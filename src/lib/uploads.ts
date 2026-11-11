import "server-only";

import { randomBytes } from "node:crypto";
import { deletePrescriptionObject, putStoredObject, readPrescriptionObject } from "@/lib/object-storage";

const MAX_BYTES = 10 * 1024 * 1024;

const ALLOWED: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/heic": [".heic"],
  "image/heif": [".heif"],
};

export type StoredPrescriptionFile = {
  storedPath: string;
  originalFileName: string;
  mime: string;
  size: number;
};

function detectMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  if (buffer.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  const brand = buffer.subarray(4, 12).toString("latin1");
  if (brand.startsWith("ftypheic") || brand.startsWith("ftypheix") || brand.startsWith("ftypmif1")) {
    return "image/heic";
  }
  return null;
}

export async function storePrescriptionFile(
  file: File,
): Promise<StoredPrescriptionFile> {
  if (!file || file.size === 0) {
    throw new Error("Aucun fichier reçu.");
  }
  if (file.size > MAX_BYTES) {
    throw new Error("Le fichier dépasse la limite de 10 Mo.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    throw new Error("Le contenu reçu dépasse la limite de 10 Mo.");
  }
  const detected = detectMime(buffer);
  if (!detected || !ALLOWED[detected]) {
    throw new Error(
      "Format non accepté. Utilisez un PDF, JPEG, PNG ou HEIC (max. 10 Mo).",
    );
  }

  const ext = ALLOWED[detected][0];
  const fileName = `${Date.now()}-${randomBytes(16).toString("hex")}${ext}`;
  const storedPath = await putStoredObject("prescriptions", fileName, buffer, detected);

  return {
    storedPath,
    originalFileName: sanitizeOriginalName(file.name),
    mime: detected,
    size: buffer.length,
  };
}

function sanitizeOriginalName(name: string): string {
  return (
    name
      .normalize("NFKD")
      .replace(/[^\w.\-]+/g, "_")
      .slice(-120) || "ordonnance"
  );
}

export async function readPrescriptionFile(
  storedPath: string,
): Promise<Buffer | null> {
  return readPrescriptionObject(storedPath);
}

export async function deletePrescriptionFile(storedPath: string): Promise<void> {
  await deletePrescriptionObject(storedPath);
}
