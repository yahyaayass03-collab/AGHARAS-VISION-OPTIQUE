import "server-only";

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { NoSuchKey } from "@aws-sdk/client-s3";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { resolveStoredFilePath } from "@/lib/storage-path";

export type StorageArea = "public-media" | "prescriptions";

let s3Client: S3Client | null = null;

function storageDriver(): "filesystem" | "s3" {
  const driver = process.env.OBJECT_STORAGE_DRIVER ?? "filesystem";
  if (driver !== "filesystem" && driver !== "s3") {
    throw new Error("OBJECT_STORAGE_DRIVER doit être filesystem ou s3.");
  }
  return driver;
}

function localRoot(area: StorageArea): string {
  const variable = area === "prescriptions" ? "PRESCRIPTION_STORAGE_DIR" : "PUBLIC_MEDIA_DIR";
  const fallback = area === "prescriptions"
    ? "./storage/ordonnances"
    : path.join(process.cwd(), "storage/public-media");
  const configured = process.env[variable] ?? fallback;
  if (process.env.NODE_ENV === "production" && !path.isAbsolute(configured)) {
    throw new Error(`${variable} doit désigner un volume persistant à chemin absolu en production.`);
  }
  return path.resolve(configured);
}

function getS3(): { client: S3Client; bucket: string } {
  const bucket = process.env.OBJECT_STORAGE_BUCKET?.trim();
  const region = process.env.OBJECT_STORAGE_REGION?.trim();
  if (!bucket || !region) {
    throw new Error("OBJECT_STORAGE_BUCKET et OBJECT_STORAGE_REGION sont requis avec OBJECT_STORAGE_DRIVER=s3.");
  }
  if (!s3Client) {
    const endpoint = process.env.OBJECT_STORAGE_ENDPOINT?.trim();
    const accessKeyId = process.env.OBJECT_STORAGE_ACCESS_KEY_ID;
    const secretAccessKey = process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY;
    if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
      throw new Error("Les deux identifiants Object Storage doivent être configurés ensemble.");
    }
    s3Client = new S3Client({
      region,
      ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {}),
    });
  }
  return { client: s3Client, bucket };
}

function safeKey(area: StorageArea, key: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/.test(key) || key === "." || key === "..") {
    throw new Error("Clé de stockage invalide.");
  }
  return `${area}/${key}`;
}

function isMissingObject(error: unknown): boolean {
  if (error instanceof NoSuchKey) return true;
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: unknown; Code?: unknown; code?: unknown };
  return candidate.name === "NotFound" || candidate.Code === "NoSuchKey" || candidate.code === "ENOENT";
}

/** Stores objects privately; public media is exposed only through the application route. */
export async function putStoredObject(
  area: StorageArea,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const objectKey = safeKey(area, key);
  if (storageDriver() === "s3") {
    const { client, bucket } = getS3();
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: objectKey, Body: body, ContentType: contentType }));
    return `s3://${bucket}/${objectKey}`;
  }

  const root = localRoot(area);
  await mkdir(root, { recursive: true, mode: area === "prescriptions" ? 0o700 : 0o755 });
  await writeFile(path.join(root, key), body, { flag: "wx", mode: area === "prescriptions" ? 0o600 : 0o644 });
  return `fs://${objectKey}`;
}

export async function readStoredObject(area: StorageArea, key: string): Promise<Buffer | null> {
  const objectKey = safeKey(area, key);
  if (storageDriver() === "s3") {
    const { client, bucket } = getS3();
    try {
      const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: objectKey }));
      if (!response.Body) return null;
      return Buffer.from(await response.Body.transformToByteArray());
    } catch (error) {
      if (isMissingObject(error)) return null;
      throw new Error("Échec de lecture du stockage objet.", { cause: error });
    }
  }
  try {
    return await readFile(path.join(localRoot(area), key));
  } catch (error) {
    if (isMissingObject(error)) return null;
    throw new Error("Échec de lecture du stockage fichier.", { cause: error });
  }
}

export async function deleteStoredObject(area: StorageArea, key: string): Promise<void> {
  const objectKey = safeKey(area, key);
  if (storageDriver() === "s3") {
    const { client, bucket } = getS3();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
    return;
  }
  const root = localRoot(area);
  const resolved = resolveStoredFilePath(root, path.join(root, key));
  if (resolved) await unlink(resolved).catch(() => undefined);
}

export async function readPrescriptionObject(storedPath: string): Promise<Buffer | null> {
  if (storedPath.startsWith("s3://")) {
    const match = /^s3:\/\/([^/]+)\/(prescriptions\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,159})$/.exec(storedPath);
    if (!match || storageDriver() !== "s3") return null;
    const { client, bucket } = getS3();
    if (match[1] !== bucket) return null;
    try {
      const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: match[2] }));
      return response.Body ? Buffer.from(await response.Body.transformToByteArray()) : null;
    } catch (error) {
      if (isMissingObject(error)) return null;
      throw new Error("Échec de lecture du document privé.", { cause: error });
    }
  }

  if (storedPath.startsWith("fs://")) {
    const key = /^fs:\/\/prescriptions\/([a-zA-Z0-9][a-zA-Z0-9._-]{0,159})$/.exec(storedPath)?.[1];
    if (!key || storageDriver() !== "filesystem") return null;
    return readStoredObject("prescriptions", key);
  }

  // Read compatibility for existing records whose paths predate the storage adapter.
  let legacyPath: string | null;
  try {
    legacyPath = resolveStoredFilePath(localRoot("prescriptions"), storedPath);
  } catch {
    return null;
  }
  if (!legacyPath) return null;
  try {
    return await readFile(legacyPath);
  } catch (error) {
    if (isMissingObject(error)) return null;
    throw new Error("Échec de lecture du document privé legacy.", { cause: error });
  }
}

export async function deletePrescriptionObject(storedPath: string): Promise<void> {
  if (storedPath.startsWith("s3://")) {
    const match = /^s3:\/\/([^/]+)\/(prescriptions\/[a-zA-Z0-9][a-zA-Z0-9._-]{0,159})$/.exec(storedPath);
    if (!match || storageDriver() !== "s3") return;
    const { client, bucket } = getS3();
    if (match[1] !== bucket) return;
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: match[2] }));
    return;
  }

  const candidate = storedPath.startsWith("fs://")
    ? /^fs:\/\/prescriptions\/([a-zA-Z0-9][a-zA-Z0-9._-]{0,159})$/.exec(storedPath)?.[1]
    : null;
  const resolved = candidate
    ? path.join(localRoot("prescriptions"), candidate)
    : resolveStoredFilePath(localRoot("prescriptions"), storedPath);
  if (resolved) await unlink(resolved).catch(() => undefined);
}
