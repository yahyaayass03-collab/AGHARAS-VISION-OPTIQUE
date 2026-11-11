import { expect, test } from "@playwright/test";
import path from "node:path";
import {
  acceptTerms,
  chooseShipping,
  db,
  fillCheckoutIdentity,
  uniqueEmail,
  waitForConfirmation,
} from "./helpers";

const PRODUCT_SLUG = "le-marais-n04-or-pur";
const ADMIN_STATE = path.join(import.meta.dirname, ".auth", "admin.json");

test.describe.configure({ mode: "serial" });

test.describe("Règles métier", () => {
  test("code promo : remise calculée côté serveur et tracée", async ({ page }) => {
    const email = uniqueEmail("audit.coupon");
    const product = await db.product.findUnique({ where: { slug: PRODUCT_SLUG } });
    expect(product).not.toBeNull();

    await page.goto(`/produit/${PRODUCT_SLUG}`);
    await page.getByRole("button", { name: /Ajouter la monture seule/ }).click();
    await page.waitForURL("**/panier");

    await page.locator("#coupon-code").fill("CERCLE10");
    await page.getByRole("button", { name: "Appliquer" }).click();
    await expect(page.getByText(/CERCLE10/).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Retirer le code promo" })).toBeVisible();

    await page.locator('a[href="/commande"]').last().click();
    await page.waitForURL("**/commande");
    await fillCheckoutIdentity(page, { firstName: "Yassine", lastName: "Promo", email });
    await chooseShipping(page, "standard");
    await acceptTerms(page);
    await page.getByRole("button", { name: /Confirmer ma commande/ }).click();
    const reference = await waitForConfirmation(page);

    const order = await db.order.findUnique({
      where: { reference },
      include: { redemption: true },
    });
    expect(order).not.toBeNull();
    const expectedDiscount = Math.round(product!.priceCents * 0.1);
    expect(order!.couponCode).toBe("CERCLE10");
    expect(order!.discountCents).toBe(expectedDiscount);
    expect(order!.totalCents).toBe(
      order!.subtotalCents - order!.discountCents + order!.shippingCents,
    );
    expect(order!.redemption, "rachat de code non enregistré").not.toBeNull();

    const coupon = await db.coupon.findUnique({ where: { code: "CERCLE10" } });
    expect(coupon!.usageCount).toBeGreaterThanOrEqual(1);
  });

  test.describe("annulation", () => {
    test.use({ storageState: ADMIN_STATE });

    test("une annulation restaure le stock des coloris", async ({ page }) => {
      const order = await db.order.findFirst({
        where: { status: "PENDING" },
        orderBy: { createdAt: "asc" },
        include: { items: true },
      });
      expect(order, "aucune commande PENDING : exécuter la spec 01 d'abord").not.toBeNull();

      const tracked = await Promise.all(
        order!.items
          .filter((item) => item.variantId)
          .map(async (item) => ({
            variantId: item.variantId!,
            quantity: item.quantity,
            before: (await db.inventoryItem.findUnique({ where: { variantId: item.variantId! } }))!
              .quantity,
          })),
      );

      await page.goto(`/admin/commandes/${order!.id}`);
      await page.locator('select[name="status"]').selectOption("CANCELLED");
      await page.getByRole("button", { name: "Mettre à jour" }).click();
      await page.waitForTimeout(2500);

      const cancelled = await db.order.findUnique({ where: { id: order!.id } });
      expect(cancelled!.status).toBe("CANCELLED");

      for (const entry of tracked) {
        const after = await db.inventoryItem.findUnique({
          where: { variantId: entry.variantId },
        });
        expect(after!.quantity, "stock non restauré").toBe(entry.before + entry.quantity);
        const movement = await db.inventoryMovement.findFirst({
          where: { variantId: entry.variantId, reason: "CANCELLATION" },
          orderBy: { createdAt: "desc" },
        });
        expect(movement, "mouvement d'annulation absent").not.toBeNull();
      }
    });
  });

  test("rupture de stock : ajout refusé sans créer de panier", async ({ page }) => {
    const variants = await db.productVariant.findMany({
      where: { product: { slug: PRODUCT_SLUG } },
      include: { inventory: true },
    });
    expect(variants.length).toBeGreaterThan(0);
    const original = variants.map((entry) => ({
      variantId: entry.id,
      quantity: entry.inventory!.quantity,
    }));
    const cartItemsBefore = await db.cartItem.count();

    // Rupture totale : tous les coloris du produit sont à zéro.
    await db.inventoryItem.updateMany({
      where: { variantId: { in: variants.map((entry) => entry.id) } },
      data: { quantity: 0 },
    });

    try {
      await page.goto(`/produit/${PRODUCT_SLUG}`);
      const addButton = page.getByRole("button", { name: /Ajouter la monture seule/ });
      const canAdd =
        (await addButton.count()) > 0 && (await addButton.isDisabled()) === false;
      if (canAdd) {
        // Le serveur doit refuser malgré une interface encore active.
        await addButton.click();
        await expect(page.getByText(/stock|épuis/i).first()).toBeVisible({ timeout: 20_000 });
      } else {
        await expect(
          page.getByText(/Épuisé dans ce coloris|Indisponible/i).first(),
        ).toBeVisible();
      }
      expect(await db.cartItem.count(), "panier créé malgré la rupture").toBe(cartItemsBefore);
    } finally {
      for (const entry of original) {
        await db.inventoryItem.update({
          where: { variantId: entry.variantId },
          data: { quantity: entry.quantity },
        });
      }
    }
  });
});
