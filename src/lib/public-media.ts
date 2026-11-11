import "server-only";

import { randomBytes, createHash } from "node:crypto";
import sharp, { type Sharp } from "sharp";
import { db } from "@/lib/db";
import { putStoredObject, readStoredObject } from "@/lib/object-storage";

const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
const MAX_DIMENSION = 8_000;
const MAX_PIXELS = 40_000_000;
const OUTPUT_EDGE = 2_400;
const QUOTA_ROW_ID = "public-media";
const STORAGE_MODE = () => process.env.PUBLIC_MEDIA_STORAGE_DRIVER ?? "object";

function maximumDatabaseMediaBytes(): number {
  const value = Number(process.env.PUBLIC_MEDIA_MAX_TOTAL_BYTES);
  if (!Number.isSafeInteger(value) || value < 2 * 1024 * 1024) {
    throw new Error("PUBLIC_MEDIA_MAX_TOTAL_BYTES doit être un entier d'au moins 2097152 octets.");
  }
  return value;
}

export type PublicImage = { bytes: Buffer; mimeType: string; etag: string };

export function validPublicImageUrl(url: string): boolean {
  return /^\/(?:images\/[a-zA-Z0-9_./-]+\.(?:jpg|jpeg|png|webp)|api\/media\/[a-f0-9]{32}\.(?:jpg|png|webp))$/.test(url) && !url.includes("..");
}

export async function storePublicImage(file: File): Promise<string> {
  if (!file || file.size === 0 || file.size > MAX_INPUT_BYTES) {
    throw new Error("Image vide ou supérieure à 5 Mo.");
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Format non accepté : utilisez JPEG, PNG ou WebP.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  if (!input.length || input.length > MAX_INPUT_BYTES) throw new Error("Le contenu reçu dépasse la limite de 5 Mo.");
  let image: Sharp;
  try {
    image = sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "error" });
    const metadata = await image.metadata();
    const matchingFormat =
      (file.type === "image/jpeg" && metadata.format === "jpeg") ||
      (file.type === "image/png" && metadata.format === "png") ||
      (file.type === "image/webp" && metadata.format === "webp");
    if (!matchingFormat || !metadata.width || !metadata.height ||
        metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION ||
        metadata.width * metadata.height > MAX_PIXELS) {
      throw new Error("Le contenu n'est pas une image JPEG, PNG ou WebP valide, ou ses dimensions dépassent la limite.");
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Le contenu")) throw error;
    throw new Error("Impossible de décoder cette image.");
  }

  const optimized = await image
    .rotate()
    .resize({ width: OUTPUT_EDGE, height: OUTPUT_EDGE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();
  if (!optimized.length || optimized.length > MAX_OUTPUT_BYTES) {
    throw new Error("L'image optimisée dépasse la limite de 2 Mo.");
  }

  const id = randomBytes(16).toString("hex");
  const etag = createHash("sha256").update(optimized).digest("hex");
  if (STORAGE_MODE() === "mariadb") {
    const quota = maximumDatabaseMediaBytes();
    await db.$transaction(async (tx) => {
      const reserved = await tx.$executeRaw`
        UPDATE \`PublicMediaQuota\`
        SET \`bytesUsed\` = \`bytesUsed\` + ${optimized.length}
        WHERE \`id\` = ${QUOTA_ROW_ID} AND \`bytesUsed\` <= ${quota - optimized.length}
      `;
      if (reserved !== 1) throw new Error("Le stockage MariaDB des images a atteint sa limite configurée.");
      await tx.publicMediaObject.create({
        data: { id, mimeType: "image/webp", sha256: etag, byteLength: optimized.length, data: optimized },
      });
    });
  } else if (STORAGE_MODE() === "object") {
    await putStoredObject("public-media", `${id}.webp`, optimized, "image/webp");
  } else {
    throw new Error("PUBLIC_MEDIA_STORAGE_DRIVER doit être mariadb ou object.");
  }
  return `/api/media/${id}.webp`;
}

export async function readPublicImage(name: string): Promise<PublicImage | null> {
  if (!/^[a-f0-9]{32}\.(?:jpg|png|webp)$/.test(name)) return null;
  const id = name.slice(0, name.lastIndexOf("."));
  if (STORAGE_MODE() === "mariadb") {
    const stored = await db.publicMediaObject.findUnique({
      where: { id },
      select: { data: true, mimeType: true, sha256: true, isDeleted: true },
    });
    if (stored?.isDeleted) return null;
    if (stored) return { bytes: Buffer.from(stored.data), mimeType: stored.mimeType, etag: `"${stored.sha256}"` };
    // Keeps URLs created by the previous filesystem/S3 adapter working during
    // a controlled migration; new uploads always use MariaDB in this mode.
  }
  const bytes = await readStoredObject("public-media", name);
  if (!bytes) return null;
  const mimeType = name.endsWith(".jpg") ? "image/jpeg" : `image/${name.split(".").at(-1)}`;
  const etag = createHash("sha256").update(bytes).digest("hex");
  return { bytes, mimeType, etag: `"${etag}"` };
}

export async function deletePublicImageObject(name: string): Promise<void> {
  if (!/^[a-f0-9]{32}\.webp$/.test(name)) return;
  const id = name.slice(0, -5);
  if (STORAGE_MODE() === "mariadb") {
    await db.$transaction(async (tx) => {
      const existing = await tx.publicMediaObject.findUnique({ where: { id }, select: { byteLength: true, isDeleted: true } });
      if (!existing || existing.isDeleted) return;
      await tx.publicMediaObject.update({
        where: { id },
        data: { isDeleted: true, data: Buffer.alloc(0), byteLength: 0 },
      });
      const released = await tx.publicMediaQuota.updateMany({
        where: { id: QUOTA_ROW_ID, bytesUsed: { gte: existing.byteLength } },
        data: { bytesUsed: { decrement: existing.byteLength } },
      });
      if (released.count !== 1) throw new Error("Le compteur de stockage des images est incohérent.");
    });
  } else if (STORAGE_MODE() === "object") {
    const { deleteStoredObject } = await import("@/lib/object-storage");
    await deleteStoredObject("public-media", name);
  }
}

/** Delete only after checking every application-owned image reference. */
export async function deleteUnreferencedPublicImages(urls: string[]): Promise<void> {
  const candidates = [...new Set(urls)].filter((url) => /^\/api\/media\/[a-f0-9]{32}\.webp$/.test(url));
  for (const url of candidates) {
    const referenced = await Promise.all([
      db.productImage.findFirst({ where: { url }, select: { id: true } }),
      db.orderItem.findFirst({ where: { imageUrl: url }, select: { id: true } }),
      db.category.findFirst({ where: { imageUrl: url }, select: { id: true } }),
      db.brand.findFirst({ where: { imageUrl: url }, select: { id: true } }),
      db.banner.findFirst({ where: { imageUrl: url }, select: { id: true } }),
      db.setting.findFirst({ where: { value: { contains: url } }, select: { key: true } }),
      db.contentPage.findFirst({ where: { OR: [{ body: { contains: url } }, { intro: { contains: url } }] }, select: { id: true } }),
    ]);
    if (referenced.some(Boolean)) continue;
    await deletePublicImageObject(url.slice("/api/media/".length));
  }
}
