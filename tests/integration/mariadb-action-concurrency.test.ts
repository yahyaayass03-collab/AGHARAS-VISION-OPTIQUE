import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { generateToken, sha256 } from "@/lib/auth/password";

const state = vi.hoisted(() => ({ sessionToken: "", cartToken: "" }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => {
      const value = name === "agharas_session" ? state.sessionToken : name === "agharas_cart" ? state.cartToken : "";
      return value ? { value } : undefined;
    },
    set: vi.fn(),
    delete: (name: string) => { if (name === "agharas_cart") state.cartToken = ""; },
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (location: string): never => {
    throw Object.assign(new Error(`redirect:${location}`), { digest: `NEXT_REDIRECT;push;${location};307;` });
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", async () => {
  const { PrismaClient } = await import("@prisma/client");
  return { db: new PrismaClient({ datasourceUrl: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL }) };
});
vi.mock("@/lib/cart", async () => {
  const { db } = await import("@/lib/db");
  return {
    CART_COOKIE: "agharas_cart",
    findCartWithItems: async () => db.cart.findUnique({
      where: { token: state.cartToken },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
          include: {
            product: { include: { category: true, brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
            variant: { include: { inventory: true } },
          },
        },
      },
    }),
  };
});

import { db } from "@/lib/db";
import { setMariaDbCheckoutTestBarrier } from "@/lib/mariadb-checkout-test-barrier";
import { placeOrderAction } from "@/app/actions/checkout";
import { saveProductAction } from "@/app/actions/admin/catalog";
import { saveOpticalDecisionAction } from "@/app/actions/admin/optical-compatibility";
import { opticalSignature } from "@/lib/optical-compatibility";

const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ??
  "mysql://agv_test:local-test-only-Agv-2026@127.0.0.1:3307/agharas_mariadb_test";
const marker = `action-race-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const TEST_DATABASE = "agharas_mariadb_test";
let productId = "";
let variantId = "";
let roleId = "";
let userId = "";
let sessionId = "";

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => { resolve = done; });
  return { promise, resolve };
}

function checkoutForm(email: string, key: string): FormData {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    firstName: "Synthetic", lastName: "Race", email, phone: "+212600000001",
    addressLine1: "Adresse de test synthétique", addressLine2: "", city: "Agadir",
    postalCode: "80000", deliveryNotes: "", shippingCode: "standard",
    paymentMethod: "CASH_ON_DELIVERY", couponCode: "", acceptTerms: "on", idempotencyKey: key,
  })) form.set(name, value);
  return form;
}

function productForm(priceDh: string): FormData {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    id: productId, name: "Synthetic MariaDB race frame", slug: `${marker}-frame`,
    subtitle: "", description: "Synthetic product used only for isolated MariaDB action tests.",
    story: "", brandId: brandId!, categoryId: categoryId!, type: "OPTICAL", gender: "MIXTE",
    material: "TEST ONLY", shape: "AUTRE", sku: `${marker.slice(-24)}-product-sku`, price: priceDh,
    compareAtPrice: "", badge: "", weightGrams: "", lensWidthMm: "", bridgeMm: "",
    templeLengthMm: "", lensCompatible: "on", isActive: "on", isFeatured: "",
    isNew: "", isBestseller: "", imageUrls: "/images/brand/agharass-vision-logo-header.webp",
  })) form.set(name, value);
  return form;
}

let brandId = "";
let categoryId = "";

async function runCheckout(email: string, key: string) {
  try {
    return await placeOrderAction(null, checkoutForm(email, key));
  } catch (error) {
    if (error instanceof Error && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT;")) return { ok: true as const };
    throw error;
  }
}

async function savePrice(priceDh: string) {
  return saveProductAction(null, productForm(priceDh));
}

async function createCart(token: string, lensSnapshot?: object) {
  const cart = await db.cart.create({ data: { token } });
  state.cartToken = token;
  await db.cartItem.create({
    data: {
      cartId: cart.id, productId, variantId, quantity: 1,
      configKey: lensSnapshot ? `${marker}-optical-config` : "",
      lensSnapshot: lensSnapshot ?? undefined,
    },
  });
  return cart.id;
}

beforeAll(async () => {
  process.env.DATABASE_URL = url;
  process.env.TEST_DATABASE_URL = url;
  process.env.OWNER_EMAIL = `${marker}@test.invalid`;
  process.env.EMAIL_TRANSPORT = "discard";
  process.env.NEXT_PUBLIC_SITE_URL = "http://127.0.0.1:3100";

  const identity = await db.$queryRaw<Array<{ database: string; version: string }>>`
    SELECT DATABASE() AS database, VERSION() AS version
  `;
  if (identity[0]?.database !== TEST_DATABASE || !identity[0]?.version.includes("MariaDB")) {
    throw new Error("Action concurrency tests require the disposable synthetic MariaDB test database.");
  }
  const [brand, category] = await Promise.all([
    db.brand.findFirstOrThrow({ where: { isActive: true } }),
    db.category.findFirstOrThrow({ where: { isActive: true } }),
  ]);
  brandId = brand.id;
  categoryId = category.id;
  const product = await db.product.create({
    data: {
      slug: `${marker}-frame`, name: "Synthetic MariaDB race frame",
      description: "Synthetic product used only for isolated MariaDB action tests.",
      brandId, categoryId, type: "OPTICAL", gender: "MIXTE", shape: "AUTRE",
      sku: `${marker.slice(-24)}-product-sku`, priceCents: 20_000, isActive: true, lensCompatible: true,
      images: { create: { url: "/images/brand/agharass-vision-logo-header.webp", alt: "TEST ONLY", sortOrder: 0 } },
      variants: { create: {
        sku: `${marker.slice(-24)}-variant-sku`, colorName: "TEST ONLY", colorHex: "#123456",
        inventory: { create: { quantity: 5, lowStockThreshold: 1 } },
      } },
    }, include: { variants: true },
  });
  productId = product.id;
  variantId = product.variants[0]!.id;

  const role = await db.role.create({ data: { name: `${marker}-owner`, permissions: ["products.update"], isSuperAdmin: true } });
  roleId = role.id;
  const user = await db.user.create({
    data: { email: process.env.OWNER_EMAIL!, passwordHash: "not-a-real-password-hash", firstName: "Synthetic", lastName: "Owner", roleId },
  });
  userId = user.id;
  const rawSession = generateToken(32);
  const session = await db.session.create({ data: { tokenHash: sha256(rawSession), userId, expiresAt: new Date(Date.now() + 60 * 60_000) } });
  sessionId = session.id;
  state.sessionToken = rawSession;
});

afterAll(async () => {
  setMariaDbCheckoutTestBarrier(undefined);
  if (productId) {
    await db.cart.deleteMany({ where: { token: { startsWith: marker } } });
    await db.order.deleteMany({ where: { email: { startsWith: marker } } });
    await db.inventoryMovement.deleteMany({ where: { variantId } });
    await db.auditLog.deleteMany({ where: { entityType: "Product", entityId: productId } });
    await db.auditLog.deleteMany({ where: { entityType: "OpticalCompatibilityRule", actorEmail: process.env.OWNER_EMAIL } });
    await db.opticalCompatibilityRule.deleteMany({ where: { productId } });
    await db.product.delete({ where: { id: productId } });
  }
  if (sessionId) await db.session.delete({ where: { id: sessionId } });
  if (userId) await db.user.delete({ where: { id: userId } });
  if (roleId) await db.role.delete({ where: { id: roleId } });
  state.sessionToken = "";
  state.cartToken = "";
  await db.$disconnect();
});

describe("real MariaDB production-action concurrency", () => {
  it("serializes actual guest checkout and owner price update in both lock orders", async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      setMariaDbCheckoutTestBarrier(undefined);
      const priceBefore = 20_000;
      const quantityBefore = 5;
      await db.product.update({ where: { id: productId }, data: { priceCents: priceBefore } });
      await db.productVariant.update({ where: { id: variantId }, data: { priceCents: null } });
      await db.inventoryItem.update({ where: { variantId }, data: { quantity: quantityBefore } });

      // Catalog owner wins after checkout has captured its quote but before its price-row lock.
      const staleToken = `${marker}-stale-cart-${attempt}`;
      const staleKey = randomUUID();
      const staleEmail = `${marker}+stale${attempt}@test.invalid`;
      await createCart(staleToken);
      const quoteReached = deferred();
      const resumeStale = deferred();
      setMariaDbCheckoutTestBarrier(async (point, id) => {
        if (point === "quoted" && id === productId) { quoteReached.resolve(); await resumeStale.promise; }
      });
      const staleCheckout = runCheckout(staleEmail, staleKey);
      await Promise.race([
        quoteReached.promise,
        staleCheckout.then((result) => { throw new Error(`Checkout exited before quote barrier: ${JSON.stringify(result)}`); }),
      ]);
      const priceUpdate = await savePrice("250");
      resumeStale.resolve();
      if (!priceUpdate?.ok) throw new Error(`Owner price action failed: ${JSON.stringify(priceUpdate)}`);
      const rejected = await staleCheckout;
      expect(rejected).toMatchObject({ ok: false });
      expect((rejected as { message?: string }).message).toContain("prix");
      expect(await db.order.count({ where: { email: staleEmail } })).toBe(0);
      expect(await db.inventoryItem.findUniqueOrThrow({ where: { variantId } }).then((row) => row.quantity)).toBe(quantityBefore);
      expect(await db.cart.count({ where: { token: staleToken } })).toBe(1);
      await db.cart.deleteMany({ where: { token: staleToken } });

      // Checkout wins the catalog row lock; the real owner update is observed waiting in InnoDB.
      await db.product.update({ where: { id: productId }, data: { priceCents: priceBefore } });
      await db.inventoryItem.update({ where: { variantId }, data: { quantity: quantityBefore } });
      const winningToken = `${marker}-checkout-cart-${attempt}`;
      const winningKey = randomUUID();
      const winningEmail = `${marker}+checkout${attempt}@test.invalid`;
      await createCart(winningToken);
      const lockedReached = deferred();
      const resumeCheckout = deferred();
      setMariaDbCheckoutTestBarrier(async (point, id) => {
        if (point === "catalog-locked" && id === productId) { lockedReached.resolve(); await resumeCheckout.promise; }
      });
      const checkout = runCheckout(winningEmail, winningKey);
      await lockedReached.promise;
      // Checkout already owns the InnoDB catalog locks before the real owner action starts.
      // Starting that action while checkout is paused establishes the winner without timing sleeps.
      const ownerUpdate = savePrice("250");
      resumeCheckout.resolve();
      expect(await checkout).toMatchObject({ ok: true });
      expect(await ownerUpdate).toMatchObject({ ok: true });

      const order = await db.order.findUniqueOrThrow({
        where: { idempotencyKey: winningKey }, include: { items: true },
      });
      expect(order.items).toHaveLength(1);
      expect(order.items[0]!.unitPriceCents).toBe(priceBefore);
      expect(order.items[0]!.lineTotalCents).toBe(priceBefore);
      expect(order.subtotalCents).toBe(priceBefore);
      expect(await db.product.findUniqueOrThrow({ where: { id: productId } }).then((row) => row.priceCents)).toBe(25_000);
      expect(await db.inventoryItem.findUniqueOrThrow({ where: { variantId } }).then((row) => row.quantity)).toBe(quantityBefore - 1);
      expect(await db.inventoryMovement.count({ where: { variantId, note: `Commande ${order.reference}`, delta: -1 } })).toBe(1);
      expect(await db.order.count({ where: { email: winningEmail } })).toBe(1);
      expect(await db.inventoryMovement.count({ where: { variantId, delta: { gt: 0 } } })).toBe(0);
      expect(await db.cart.count({ where: { token: winningToken } })).toBe(0);
    }
  }, 90_000);

  it("serializes competing real optical-review actions and keeps audit/check-out decisions consistent", async () => {
    setMariaDbCheckoutTestBarrier(undefined);
    const lensType = await db.lensType.findFirstOrThrow({ where: { kind: "SINGLE_VISION", isActive: true } });
    const lensIndex = await db.lensIndex.findFirstOrThrow({ where: { isActive: true } });
    const combination = { productId, variantId, lensTypeId: lensType.id, lensIndexId: lensIndex.id, treatmentIds: [] as string[] };
    const signature = opticalSignature(combination);
    const reviewForm = (status: "APPROVED" | "INCOMPATIBLE") => {
      const form = new FormData();
      for (const [key, value] of Object.entries({ ...combination, treatmentIds: undefined, status, reviewer: "TEST ONLY — synthetic concurrency fixture", reviewDate: new Date().toISOString().slice(0, 10), evidence: "TEST ONLY — no clinical/business decision", confirmed: "on" })) {
        if (key !== "treatmentIds") form.set(key, String(value));
      }
      return form;
    };

    const beforeAuditIds = (await db.auditLog.findMany({ where: { entityType: "OpticalCompatibilityRule", actorEmail: process.env.OWNER_EMAIL }, select: { id: true } })).map((row) => row.id);
    const firstLocked = deferred();
    const releaseFirst = deferred();
    const secondReady = deferred();
    const releaseSecond = deferred();
    let lockAcquisitions = 0;
    let actionEntries = 0;
    setMariaDbCheckoutTestBarrier(async (point, id) => {
      if (id !== signature) return;
      if (point === "review-entering" && ++actionEntries === 2) {
        secondReady.resolve();
        await releaseSecond.promise;
      }
      if (point === "review-locked" && ++lockAcquisitions === 1) {
        firstLocked.resolve();
        await releaseFirst.promise;
      }
    });
    const firstReview = saveOpticalDecisionAction(null, reviewForm("APPROVED"));
    await firstLocked.promise;
    const secondReview = saveOpticalDecisionAction(null, reviewForm("INCOMPATIBLE"));
    await secondReady.promise;
    releaseSecond.resolve();
    // The first action owns the real InnoDB mutex while the second is released toward it.
    releaseFirst.resolve();
    const outcomes = await Promise.all([firstReview, secondReview]);
    setMariaDbCheckoutTestBarrier(undefined);
    expect(outcomes).toEqual([{ ok: true, message: expect.any(String) }, { ok: true, message: expect.any(String) }]);

    const rule = await db.opticalCompatibilityRule.findUniqueOrThrow({ where: { signature } });
    const newAudit = await db.auditLog.findMany({
      where: { entityType: "OpticalCompatibilityRule", entityId: rule.id, actorEmail: process.env.OWNER_EMAIL, id: { notIn: beforeAuditIds } },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });
    expect(newAudit).toHaveLength(2);
    const transitions = newAudit.map((entry) => entry.metadata as { previous: string | null; status: string });
    expect(transitions[0]!.previous).toBeNull();
    expect(transitions[1]!.previous).toBe(transitions[0]!.status);
    expect(transitions[1]!.status).toBe(rule.status);
    expect(["APPROVED", "INCOMPATIBLE"]).toContain(rule.status);

    // Authorization is exercised through the real guard/session path, not stubbed.
    const deniedRole = await db.role.create({ data: { name: `${marker}-read-only`, permissions: [], isSuperAdmin: false } });
    const deniedUser = await db.user.create({ data: { email: `${marker}-denied@test.invalid`, passwordHash: "synthetic", firstName: "Denied", lastName: "User", roleId: deniedRole.id } });
    const deniedRaw = generateToken(32);
    const deniedSession = await db.session.create({ data: { tokenHash: sha256(deniedRaw), userId: deniedUser.id, expiresAt: new Date(Date.now() + 60_000) } });
    const authorizedToken = state.sessionToken;
    state.sessionToken = deniedRaw;
    try {
      await expect(saveOpticalDecisionAction(null, reviewForm("INCOMPATIBLE"))).rejects.toMatchObject({ name: "AuthorizationError" });
    } finally {
      state.sessionToken = authorizedToken;
      await db.session.delete({ where: { id: deniedSession.id } });
      await db.user.delete({ where: { id: deniedUser.id } });
      await db.role.delete({ where: { id: deniedRole.id } });
    }

    // A real subsequent checkout action is blocked by a persisted incompatible decision.
    expect(await saveOpticalDecisionAction(null, reviewForm("INCOMPATIBLE"))).toMatchObject({ ok: true });
    const cartToken = `${marker}-optical-cart`;
    const cartId = await createCart(cartToken, {
      hasCorrection: true, lensTypeId: lensType.id, lensTypeName: lensType.name,
      lensTypePriceCents: lensType.priceCents, lensIndexId: lensIndex.id,
      lensIndexName: lensIndex.name, lensIndexValue: lensIndex.value,
      lensIndexPriceCents: lensIndex.priceCents, treatments: [], lensPriceCents: lensType.priceCents + lensIndex.priceCents,
      summary: "TEST ONLY optical compatibility race",
    });
    const stockBefore = await db.inventoryItem.findUniqueOrThrow({ where: { variantId } }).then((row) => row.quantity);
    const opticalEmail = `${marker}+optical@test.invalid`;
    const opticalKey = randomUUID();
    const deniedCheckout = await placeOrderAction(null, checkoutForm(opticalEmail, opticalKey));
    expect(deniedCheckout).toMatchObject({ ok: false });
    expect((deniedCheckout as { message?: string }).message).toContain("combinaison");
    expect(await db.order.count({ where: { email: opticalEmail } })).toBe(0);
    expect(await db.inventoryItem.findUniqueOrThrow({ where: { variantId } }).then((row) => row.quantity)).toBe(stockBefore);
    await db.cart.delete({ where: { id: cartId } });
  }, 60_000);
});
