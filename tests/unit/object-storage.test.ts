import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  deletePrescriptionObject,
  putStoredObject,
  readPrescriptionObject,
  readStoredObject,
} from "@/lib/object-storage";

let temporaryRoot: string | null = null;

afterEach(async () => {
  vi.unstubAllEnvs();
  if (temporaryRoot) await rm(temporaryRoot, { recursive: true, force: true });
  temporaryRoot = null;
});

async function configureFilesystem() {
  temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "agharas-storage-test-"));
  vi.stubEnv("OBJECT_STORAGE_DRIVER", "filesystem");
  vi.stubEnv("PRESCRIPTION_STORAGE_DIR", path.join(temporaryRoot, "private"));
  vi.stubEnv("PUBLIC_MEDIA_DIR", path.join(temporaryRoot, "public"));
}

describe("object storage isolation", () => {
  it("round-trips private documents in the private area and deletes them by key", async () => {
    await configureFilesystem();
    const content = Buffer.from("synthetic-prescription-bytes");
    const reference = await putStoredObject("prescriptions", "synthetic.pdf", content, "application/pdf");
    expect(reference).toBe("fs://prescriptions/synthetic.pdf");
    await expect(readPrescriptionObject(reference)).resolves.toEqual(content);
    await expect(readFile(path.join(temporaryRoot!, "private", "synthetic.pdf"))).resolves.toEqual(content);
    await deletePrescriptionObject(reference);
    await expect(readPrescriptionObject(reference)).resolves.toBeNull();
  });

  it("retains objects across a fresh storage-module instance", async () => {
    await configureFilesystem();
    const content = Buffer.from("synthetic-restart-persistence");
    await putStoredObject("prescriptions", "restart.pdf", content, "application/pdf");
    vi.resetModules();
    const restartedStorage = await import("@/lib/object-storage");
    await expect(restartedStorage.readPrescriptionObject("fs://prescriptions/restart.pdf")).resolves.toEqual(content);
  });

  it("keeps product media in a separate area and rejects traversal keys", async () => {
    await configureFilesystem();
    const content = Buffer.from("synthetic-public-image-bytes");
    await putStoredObject("public-media", "synthetic.webp", content, "image/webp");
    await expect(readStoredObject("public-media", "synthetic.webp")).resolves.toEqual(content);
    await expect(readStoredObject("prescriptions", "synthetic.webp")).resolves.toBeNull();
    await expect(putStoredObject("prescriptions", "../outside.pdf", content, "application/pdf")).rejects.toThrow(/Clé/);
  });

  it("fails closed for legacy local prescription paths when no legacy volume is configured", async () => {
    vi.stubEnv("OBJECT_STORAGE_DRIVER", "s3");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PRESCRIPTION_STORAGE_DIR", "");
    await expect(readPrescriptionObject("storage/ordonnances/legacy.pdf")).resolves.toBeNull();
  });

  it("distinguishes a missing object from a storage backend failure", async () => {
    temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "agharas-storage-error-test-"));
    const invalidRoot = path.join(temporaryRoot, "private");
    await mkdir(path.join(invalidRoot, "missing.pdf"), { recursive: true });
    vi.stubEnv("OBJECT_STORAGE_DRIVER", "filesystem");
    vi.stubEnv("PRESCRIPTION_STORAGE_DIR", invalidRoot);
    await expect(readPrescriptionObject("fs://prescriptions/missing.pdf")).rejects.toThrow(/Échec de lecture/);
  });
});
