import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { db } from "@/lib/db";
import { deletePublicImageObject, readPublicImage, storePublicImage } from "@/lib/public-media";

const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ??
  "mysql://agv_test:local-test-only-Agv-2026@127.0.0.1:3307/agharas_mariadb_test";
const restartedClient = new PrismaClient({ datasourceUrl: url });
const oldDriver = process.env.PUBLIC_MEDIA_STORAGE_DRIVER;
const oldLimit = process.env.PUBLIC_MEDIA_MAX_TOTAL_BYTES;

afterAll(async () => {
  await restartedClient.$disconnect();
  if (oldDriver === undefined) delete process.env.PUBLIC_MEDIA_STORAGE_DRIVER;
  else process.env.PUBLIC_MEDIA_STORAGE_DRIVER = oldDriver;
  if (oldLimit === undefined) delete process.env.PUBLIC_MEDIA_MAX_TOTAL_BYTES;
  else process.env.PUBLIC_MEDIA_MAX_TOTAL_BYTES = oldLimit;
  await db.$disconnect();
});

describe("MariaDB-backed owner public media", () => {
  it("survives a fresh Prisma client and is served from MariaDB, then deletes only its synthetic object", async () => {
    const identity = await db.$queryRaw<Array<{ database: string; version: string; datadir: string }>>`
      SELECT DATABASE() AS database, VERSION() AS version, @@datadir AS datadir
    `;
    expect(identity[0]?.database).toBe("agharas_mariadb_test");
    expect(identity[0]?.version).toContain("MariaDB");
    expect(identity[0]?.datadir).toContain("AGHARAS-MARIADB-RECOVERY");

    process.env.PUBLIC_MEDIA_STORAGE_DRIVER = "mariadb";
    process.env.PUBLIC_MEDIA_MAX_TOTAL_BYTES = String(256 * 1024 * 1024);
    const source = await sharp({ create: { width: 320, height: 200, channels: 3, background: "#567" } }).png().toBuffer();
    const url = await storePublicImage(new File([source], "synthetic-owner-image.png", { type: "image/png" }));
    const id = url.match(/[a-f0-9]{32}/)?.[0];
    expect(id).toBeTruthy();
    try {
      const persisted = await restartedClient.publicMediaObject.findUnique({
        where: { id: id! }, select: { mimeType: true, byteLength: true, data: true, isDeleted: true },
      });
      expect(persisted).toMatchObject({ mimeType: "image/webp", byteLength: expect.any(Number), isDeleted: false });
      expect(persisted!.data.length).toBe(persisted!.byteLength);

      const served = await readPublicImage(`${id}.webp`);
      expect(served?.bytes).toEqual(Buffer.from(persisted!.data));
      expect(served?.mimeType).toBe("image/webp");
      expect(served?.etag).toMatch(/^"[a-f0-9]{64}"$/);
    } finally {
      await deletePublicImageObject(`${id}.webp`);
    }
    expect(await restartedClient.publicMediaObject.findUnique({ where: { id: id! }, select: { isDeleted: true, byteLength: true } }))
      .toMatchObject({ isDeleted: true, byteLength: 0 });
    expect((await db.publicMediaQuota.findUnique({ where: { id: "public-media" } }))?.bytesUsed).toBe(0);
  });
});
