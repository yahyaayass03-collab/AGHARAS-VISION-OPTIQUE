import { afterEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

const state = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  reserveQuota: vi.fn().mockResolvedValue(1),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({
  db: {
    publicMediaObject: { create: state.create, findUnique: state.findUnique },
    $transaction: (callback: (tx: unknown) => unknown) => callback({
      $executeRaw: state.reserveQuota,
      publicMediaObject: { create: state.create, findUnique: state.findUnique },
    }),
  },
}));
vi.mock("@/lib/object-storage", () => ({
  putStoredObject: vi.fn(),
  readStoredObject: vi.fn(),
}));

import { readPublicImage, storePublicImage } from "@/lib/public-media";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("MariaDB public media storage", () => {
  it("validates, resizes, compresses, and persists owner image bytes separately", async () => {
    vi.stubEnv("PUBLIC_MEDIA_STORAGE_DRIVER", "mariadb");
    vi.stubEnv("PUBLIC_MEDIA_MAX_TOTAL_BYTES", String(256 * 1024 * 1024));
    const source = await sharp({ create: { width: 900, height: 600, channels: 3, background: "#49627c" } }).jpeg().toBuffer();
    const url = await storePublicImage(new File([source], "catalog.jpg", { type: "image/jpeg" }));

    expect(url).toMatch(/^\/api\/media\/[a-f0-9]{32}\.webp$/);
    expect(state.create).toHaveBeenCalledOnce();
    const saved = state.create.mock.calls[0]![0].data;
    expect(saved.mimeType).toBe("image/webp");
    expect(saved.byteLength).toBe(saved.data.length);
    expect(saved.data.length).toBeLessThan(2 * 1024 * 1024);
    expect(saved.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect((await sharp(saved.data).metadata()).format).toBe("webp");
  });

  it("rejects MIME spoofing and oversized inputs before storage", async () => {
    vi.stubEnv("PUBLIC_MEDIA_STORAGE_DRIVER", "mariadb");
    vi.stubEnv("PUBLIC_MEDIA_MAX_TOTAL_BYTES", String(256 * 1024 * 1024));
    const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: "white" } }).png().toBuffer();
    await expect(storePublicImage(new File([png], "spoof.jpg", { type: "image/jpeg" }))).rejects.toThrow(/contenu/);
    await expect(storePublicImage(new File([Buffer.alloc(5 * 1024 * 1024 + 1)], "large.jpg", { type: "image/jpeg" }))).rejects.toThrow(/5 Mo/);
    expect(state.create).not.toHaveBeenCalled();
  });

  it("loads a single image BLOB only by requested media id and returns its stored digest", async () => {
    vi.stubEnv("PUBLIC_MEDIA_STORAGE_DRIVER", "mariadb");
    const bytes = Buffer.from("synthetic-webp");
    state.findUnique.mockResolvedValue({ data: bytes, mimeType: "image/webp", sha256: "a".repeat(64), isDeleted: false });
    const image = await readPublicImage(`${"b".repeat(32)}.webp`);
    expect(image).toEqual({ bytes, mimeType: "image/webp", etag: `"${"a".repeat(64)}"` });
    expect(state.findUnique).toHaveBeenCalledWith({
      where: { id: "b".repeat(32) },
      select: { data: true, mimeType: true, sha256: true, isDeleted: true },
    });
  });

  it("requires an explicit MariaDB image quota before writing", async () => {
    vi.stubEnv("PUBLIC_MEDIA_STORAGE_DRIVER", "mariadb");
    vi.stubEnv("PUBLIC_MEDIA_MAX_TOTAL_BYTES", "");
    const source = await sharp({ create: { width: 20, height: 20, channels: 3, background: "white" } }).png().toBuffer();
    await expect(storePublicImage(new File([source], "no-quota.png", { type: "image/png" }))).rejects.toThrow(/PUBLIC_MEDIA_MAX_TOTAL_BYTES/);
    expect(state.create).not.toHaveBeenCalled();
  });
});
