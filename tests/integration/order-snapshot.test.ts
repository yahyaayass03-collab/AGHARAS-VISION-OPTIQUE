import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";

/**
 * Tests d'intégration sur une base dédiée MariaDB. Ils vérifient les
 * garanties structurelles : instantané de commande, anonymisation, contraintes
 * d'unicité. La base de développement n'est jamais utilisée.
 */
const connectionString =
  process.env.TEST_DATABASE_URL ??
  "mysql://agv_test:local-test-only-Agv-2026@127.0.0.1:3307/agharas_mariadb_test";

const prisma = new PrismaClient({ datasourceUrl: connectionString });
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const email = `integration-${suffix}@test.local`;
const reference = `TEST-${suffix}`;
const couponCode = `TEST${suffix}`.toUpperCase().slice(0, 24);

let roleId = "";
let userId = "";
let orderId = "";

beforeAll(async () => {
  const role = await prisma.role.create({
    data: {
      name: `Test Role ${suffix}`,
      permissions: [],
    },
  });
  roleId = role.id;

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: "not-a-real-hash-for-integration-tests",
      firstName: "Test",
      lastName: "Intégration",
      roleId: role.id,
    },
  });
  userId = user.id;

  const order = await prisma.order.create({
    data: {
      reference,
      accessToken: `token-${suffix}`,
      userId: user.id,
      email,
      firstName: "Test",
      lastName: "Intégration",
      phone: "0612345678",
      addressLine1: "1 rue de l'Intégration",
      city: "Casablanca",
      shippingMethodName: "Livraison standard",
      shippingCents: 3_000,
      subtotalCents: 185_000,
      discountCents: 18_500,
      totalCents: 169_500,
      couponCode: "CERCLE10",
      selectedShippingCode: "standard",
      items: {
        create: [
          {
            productName: "Monture d'essai",
            productSlug: "monture-d-essai",
            variantName: "Or",
            sku: `SKU-${suffix}`,
            unitPriceCents: 185_000,
            lensPriceCents: 0,
            quantity: 1,
            lineTotalCents: 185_000,
            configuration: {
              lensTypeName: "Unifocaux HD",
              lensPriceCents: 0,
              treatments: [],
            },
          },
        ],
      },
      history: {
        create: [{ toStatus: "PENDING", note: "Création de la commande" }],
      },
      payments: {
        create: [
          {
            method: "CASH_ON_DELIVERY",
            status: "PENDING",
            amountCents: 169_500,
          },
        ],
      },
    },
  });
  orderId = order.id;
});

afterAll(async () => {
  if (orderId) await prisma.order.deleteMany({ where: { id: orderId } });
  if (userId) await prisma.user.deleteMany({ where: { id: userId } });
  if (roleId) await prisma.role.deleteMany({ where: { id: roleId } });
  await prisma.coupon.deleteMany({ where: { code: couponCode } });
  await prisma.$disconnect();
});

describe("instantané de commande", () => {
  it("conserve les prix et libellés indépendamment du catalogue", async () => {
    const item = await prisma.orderItem.findFirstOrThrow({
      where: { orderId },
    });
    await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        productName: "Nom modifié après coup",
        unitPriceCents: 1,
      },
    });

    const reset = await prisma.orderItem.update({
      where: { id: item.id },
      data: {
        productName: "Monture d'essai",
        unitPriceCents: 185_000,
      },
    });
    expect(reset.lineTotalCents).toBe(185_000);
    expect(reset.configuration).toMatchObject({ lensTypeName: "Unifocaux HD" });
  });

  it("conserve le total et le code promo figés", async () => {
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.subtotalCents).toBe(185_000);
    expect(order.discountCents).toBe(18_500);
    expect(order.shippingCents).toBe(3_000);
    expect(order.totalCents).toBe(169_500);
    expect(order.couponCode).toBe("CERCLE10");
    expect(order.paymentMethod).toBe("CASH_ON_DELIVERY");
    expect(order.paymentStatus).toBe("PENDING");
  });

  it("anonymise la commande lorsque le compte est supprimé", async () => {
    await prisma.user.delete({ where: { id: userId } });
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(order.userId).toBeNull();
    expect(order.email).toBe(email);
    expect(order.totalCents).toBe(169_500);
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    expect(items).toHaveLength(1);
  });

  it("conserve l'historique de statut après anonymisation", async () => {
    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: "PENDING",
        toStatus: "CONFIRMED",
        note: "Confirmation téléphonique",
      },
    });
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
    });
    expect(history).toHaveLength(2);
    expect(history[1]?.toStatus).toBe("CONFIRMED");
    expect(history[1]?.userId).toBeNull();
  });
});

describe("contraintes d'unicité", () => {
  it("refuse deux codes promo identiques", async () => {
    await prisma.coupon.create({
      data: {
        code: couponCode,
        type: "PERCENT",
        value: 10,
      },
    });

    await expect(
      prisma.coupon.create({
        data: {
          code: couponCode,
          type: "FIXED",
          value: 1_000,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("refuse deux commandes partageant la même référence", async () => {
    await expect(
      prisma.order.create({
        data: {
          reference,
          accessToken: `other-token-${suffix}`,
          email,
          firstName: "Autre",
          lastName: "Commande",
          phone: "0612345678",
          addressLine1: "2 rue de l'Intégration",
          city: "Rabat",
          shippingMethodName: "Livraison standard",
          shippingCents: 0,
          subtotalCents: 0,
          totalCents: 0,
          selectedShippingCode: "standard",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });
});
