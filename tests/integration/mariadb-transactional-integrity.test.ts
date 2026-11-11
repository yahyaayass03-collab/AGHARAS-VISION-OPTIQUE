import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { evaluateOpticalCompatibility } from "@/lib/optical-compatibility-db";
import { lockOpticalReviewCheckout } from "@/lib/optical-review-lock";
import { dispatchOrderEmailNotifications } from "@/lib/order-email-notifications";

const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ??
  "mysql://agv_test:local-test-only-Agv-2026@127.0.0.1:3307/agharas_mariadb_test";
const db = new PrismaClient({ datasourceUrl: url });
const marker = `mariadb-it-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
let variantId = "";
let originalQuantity = 0;

beforeAll(async () => {
  const identity = await db.$queryRaw<Array<{ database: string; version: string }>>`
    SELECT DATABASE() AS database, VERSION() AS version
  `;
  if (identity[0]?.database !== "agharas_mariadb_test" || !identity[0]?.version.includes("MariaDB")) {
    throw new Error("Integration tests are restricted to the disposable MariaDB test database.");
  }
  const variant = await db.productVariant.findFirst({
    where: { isActive: true, product: { type: "OPTICAL" } },
    include: { inventory: true, product: true },
  });
  if (!variant?.inventory) throw new Error("Synthetic optical variant with inventory is required for MariaDB integration tests.");
  variantId = variant.id;
  originalQuantity = variant.inventory.quantity;
});

afterAll(async () => {
  if (variantId) {
    await db.order.deleteMany({ where: { idempotencyKey: { startsWith: marker } } });
    await db.inventoryMovement.deleteMany({ where: { note: { startsWith: marker } } });
    await db.inventoryItem.update({ where: { variantId }, data: { quantity: originalQuantity } });
  }
  await db.$disconnect();
});

describe("real MariaDB transactional integrity", () => {
  it("uses utf8mb4/InnoDB and persists JSON arrays, including French Unicode", async () => {
    const identity = await db.$queryRaw<Array<{
      version: string; charset: string; collation: string; engine: string;
    }>>`
      SELECT VERSION() AS version,
        @@character_set_database AS charset,
        @@collation_database AS collation,
        @@default_storage_engine AS engine
    `;
    expect(identity[0]).toMatchObject({ charset: "utf8mb4", collation: "utf8mb4_unicode_ci", engine: "InnoDB" });
    expect(identity[0]?.version).toContain("MariaDB");

    const store = await db.store.create({
      data: {
        slug: `${marker}-store`, name: "Boutique d'essai", city: "Agadir",
        address: "N° 13 Imm 08 , Lot 4 Al kheir,Cité Essalam,AGADIR", phone: "+212600000000",
        hours: "Lundi — samedi", services: ["Conseil optique", "Réparation — atelier"],
      },
    });
    try {
      expect(store.address).toContain("Cité Essalam");
      const saved = await db.store.findUniqueOrThrow({ where: { id: store.id } });
      expect(saved.services).toEqual(["Conseil optique", "Réparation — atelier"]);
    } finally {
      await db.store.delete({ where: { id: store.id } });
    }
  });

  it("enforces the optical review check in MariaDB itself", async () => {
    const [variant, lensType, lensIndex] = await Promise.all([
      db.productVariant.findUniqueOrThrow({ where: { id: variantId } }),
      db.lensType.findUniqueOrThrow({ where: { slug: "unifocaux-hd" } }),
      db.lensIndex.findUniqueOrThrow({ where: { slug: "indice-150" } }),
    ]);
    await expect(db.$executeRaw`
      INSERT INTO \`OpticalCompatibilityRule\`
        (\`id\`, \`signature\`, \`productId\`, \`variantId\`, \`lensTypeId\`, \`lensIndexId\`,
         \`treatmentIds\`, \`status\`, \`reviewer\`, \`reviewedAt\`, \`actorEmail\`, \`createdAt\`, \`updatedAt\`)
      VALUES
        (${`${marker}-invalid-review`}, ${`${marker}-signature`}, ${variant.productId}, ${variant.id}, ${lensType.id}, ${lensIndex.id},
         ${JSON.stringify([])}, 'APPROVED', NULL, NULL, 'test@invalid.local', NOW(3), NOW(3))
    `).rejects.toThrow();
    expect(await db.opticalCompatibilityRule.count({ where: { signature: `${marker}-signature` } })).toBe(0);
  });

  it("keeps absent optical decisions fail-closed against persisted catalog data", async () => {
    const source = await db.productVariant.findUniqueOrThrow({ where: { id: variantId }, include: { product: true } });
    const product = await db.product.create({
      data: {
        slug: `${marker}-pending-optical`, name: "TEST ONLY pending optical frame",
        description: "Synthetic fail-closed compatibility fixture.", brandId: source.product.brandId,
        categoryId: source.product.categoryId, type: "OPTICAL", gender: "MIXTE", sku: `${marker}-pending-product-sku`,
        priceCents: 10000, isActive: true, lensCompatible: true,
        variants: { create: {
          sku: `${marker}-pending-variant-sku`, colorName: "TEST ONLY", colorHex: "#222222",
          inventory: { create: { quantity: 1, lowStockThreshold: 1 } },
        } },
      },
      include: { variants: true },
    });
    const lensType = await db.lensType.findUniqueOrThrow({ where: { slug: "unifocaux-hd" } });
    const lensIndex = await db.lensIndex.findUniqueOrThrow({ where: { slug: "indice-150" } });
    try {
      const variant = product.variants[0]!;
      const result = await evaluateOpticalCompatibility(db, {
        productId: product.id,
        variantId: variant.id,
        lensTypeId: lensType.id,
        lensIndexId: lensIndex.id,
        treatmentIds: [],
      });
      expect(result).toEqual({ allowed: false, status: "PENDING_REVIEW" });
    } finally {
      await db.product.delete({ where: { id: product.id } });
    }
  });

  it("serializes concurrent callers on the shared InnoDB mutex row", async () => {
    let active = 0;
    let peak = 0;
    await Promise.all(Array.from({ length: 4 }, () => db.$transaction(async (tx) => {
      await lockOpticalReviewCheckout(tx);
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 35));
      active -= 1;
    })));
    expect(peak).toBe(1);
  });

  it("bounds simultaneous guarded inventory updates at zero", async () => {
    const initial = 6;
    await db.inventoryItem.update({ where: { variantId }, data: { quantity: initial } });
    const outcomes = await Promise.all(Array.from({ length: 12 }, () => db.$transaction(async (tx) => {
      await lockOpticalReviewCheckout(tx);
      const result = await tx.inventoryItem.updateMany({
        where: { variantId, quantity: { gte: 1 } },
        data: { quantity: { decrement: 1 } },
      });
      return result.count === 1;
    })));
    expect(outcomes.filter(Boolean)).toHaveLength(initial);
    expect(await db.inventoryItem.findUniqueOrThrow({ where: { variantId } }).then((row) => row.quantity)).toBe(0);
  });

  it("permits only one last-unit checkout and rolls all related writes together", async () => {
    await db.inventoryItem.update({ where: { variantId }, data: { quantity: 1 } });
    const checkout = (attempt: number) => db.$transaction(async (tx) => {
      await lockOpticalReviewCheckout(tx);
      const changed = await tx.inventoryItem.updateMany({
        where: { variantId, quantity: { gte: 1 } },
        data: { quantity: { decrement: 1 } },
      });
      if (changed.count !== 1) return false;
      await tx.inventoryMovement.create({ data: { variantId, delta: -1, reason: "SALE", note: `${marker}-last-unit` } });
      const order = await tx.order.create({
        data: {
          reference: `${marker}-LAST-${attempt}`,
          accessToken: `${marker}-token-${attempt}`,
          idempotencyKey: `${marker}-last-key-${attempt}`,
          email: "synthetic-checkout@test.invalid", firstName: "Test", lastName: "MariaDB",
          phone: "+212600000000", addressLine1: "Adresse synthétique", city: "Agadir",
          shippingMethodName: "Test", selectedShippingCode: "test",
          shippingCents: 0, subtotalCents: 10000, totalCents: 10000,
          paymentMethod: "CASH_ON_DELIVERY", paymentStatus: "PENDING",
          items: { create: {
            productId: (await tx.productVariant.findUniqueOrThrow({ where: { id: variantId } })).productId,
            variantId, productName: "Produit synthétique", productSlug: "produit-synthetique",
            sku: `${marker}-sku-${attempt}`, unitPriceCents: 10000, quantity: 1, lineTotalCents: 10000,
          } },
          history: { create: { toStatus: "PENDING", note: "Test d'intégrité MariaDB" } },
          payments: { create: { method: "CASH_ON_DELIVERY", status: "PENDING", amountCents: 10000 } },
          shipments: { create: { method: "test", status: "PREPARING" } },
          emailNotifications: { create: { kind: "OWNER_ORDER" } },
        },
      });
      return order.id;
    });

    const outcomes = await Promise.all([checkout(1), checkout(2)]);
    const orderIds = outcomes.filter((value): value is string => typeof value === "string");
    expect(orderIds).toHaveLength(1);
    expect(await db.inventoryItem.findUniqueOrThrow({ where: { variantId } }).then((row) => row.quantity)).toBe(0);
    expect(await db.order.count({ where: { idempotencyKey: { startsWith: `${marker}-last-key-` } } })).toBe(1);
    expect(await db.inventoryMovement.count({ where: { note: `${marker}-last-unit` } })).toBe(1);
    expect(await db.orderEmailNotification.count({ where: { order: { idempotencyKey: { startsWith: `${marker}-last-key-` } } } })).toBe(1);

    const previousTransport = process.env.EMAIL_TRANSPORT;
    const previousOwner = process.env.OWNER_EMAIL;
    process.env.EMAIL_TRANSPORT = "discard";
    process.env.OWNER_EMAIL = "owner@test.invalid";
    try {
      await Promise.all([
        dispatchOrderEmailNotifications(orderIds[0]!),
        dispatchOrderEmailNotifications(orderIds[0]!),
      ]);
    } finally {
      if (previousTransport === undefined) delete process.env.EMAIL_TRANSPORT;
      else process.env.EMAIL_TRANSPORT = previousTransport;
      if (previousOwner === undefined) delete process.env.OWNER_EMAIL;
      else process.env.OWNER_EMAIL = previousOwner;
    }
    const dispatched = await db.orderEmailNotification.findMany({ where: { orderId: orderIds[0] } });
    expect(dispatched).toHaveLength(1);
    expect(dispatched.every((row) => row.attempts === 1)).toBe(true);
    expect(dispatched.every((row) => row.status === "DISCARDED")).toBe(true);
  });

  it("rolls back a stock decrement and order when a duplicate idempotency key races", async () => {
    const initial = 2;
    const key = `${marker}-duplicate-key`;
    await db.inventoryItem.update({ where: { variantId }, data: { quantity: initial } });
    const attempt = (suffix: string) => db.$transaction(async (tx) => {
      await lockOpticalReviewCheckout(tx);
      const changed = await tx.inventoryItem.updateMany({
        where: { variantId, quantity: { gte: 1 } }, data: { quantity: { decrement: 1 } },
      });
      if (changed.count !== 1) return;
      await tx.inventoryMovement.create({ data: { variantId, delta: -1, reason: "SALE", note: `${marker}-duplicate` } });
      const variant = await tx.productVariant.findUniqueOrThrow({ where: { id: variantId } });
      await tx.order.create({
        data: {
          reference: `${marker}-DUP-${suffix}`, accessToken: `${marker}-dup-token-${suffix}`, idempotencyKey: key,
          email: "synthetic-checkout@test.invalid", firstName: "Test", lastName: "MariaDB", phone: "+212600000000",
          addressLine1: "Adresse synthétique", city: "Agadir", shippingMethodName: "Test", selectedShippingCode: "test",
          shippingCents: 0, subtotalCents: 10000, totalCents: 10000,
          items: { create: { productId: variant.productId, variantId, productName: "Produit test", productSlug: "produit-test", sku: `${marker}-dup-sku-${suffix}`, unitPriceCents: 10000, quantity: 1, lineTotalCents: 10000 } },
        },
      });
    });
    const outcomes = await Promise.allSettled([attempt("a"), attempt("b")]);
    expect(outcomes.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((result) => result.status === "rejected")).toHaveLength(1);
    expect(await db.order.count({ where: { idempotencyKey: key } })).toBe(1);
    expect(await db.inventoryItem.findUniqueOrThrow({ where: { variantId } }).then((row) => row.quantity)).toBe(1);
    expect(await db.inventoryMovement.count({ where: { note: `${marker}-duplicate` } })).toBe(1);
  });
});
