import { test, expect } from "@playwright/test";
import path from "node:path";
import { db, fillCheckoutIdentity, chooseShipping, acceptTerms, uniqueEmail } from "./helpers";

test("une dépublication bloque un panier invité déjà rempli sans commande ni mouvement", async ({ page, browser }) => {
  const product = await db.product.findUnique({ where: { slug: "etui-cuir-agharas" }, include: { variants: true } });
  expect(product?.isActive).toBe(true);
  const owner = await browser.newContext({ storageState: path.join(import.meta.dirname, ".auth", "admin.json"), baseURL: test.info().project.use.baseURL });
  const admin = await owner.newPage();
  try {
    await page.goto(`/produit/${product!.slug}`);
    await page.getByRole("button", { name: "Ajouter au panier" }).click();
    await page.waitForURL("**/panier");
    await page.goto("/commande");
    await fillCheckoutIdentity(page, { firstName: "Test", lastName: "Invité", email: uniqueEmail("stale") });
    await chooseShipping(page, "standard");
    await acceptTerms(page);
    await admin.goto(`/admin/produits/${product!.slug}`);
    admin.once("dialog", (dialog) => dialog.accept());
    await admin.getByRole("button", { name: "Dépublier" }).click();
    await expect.poll(async () => (await db.product.findUnique({ where: { id: product!.id } }))?.isActive).toBe(false);
    const orders = await db.order.count();
    const payments = await db.payment.count();
    const movements = await db.inventoryMovement.count({ where: { variantId: { in: product!.variants.map((item) => item.id) } } });
    await page.getByRole("button", { name: /Confirmer ma commande/ }).click();
    await expect(page.getByText(/n'est plus disponible.*Retirez-le du panier/)).toBeVisible();
    expect(await db.order.count()).toBe(orders);
    expect(await db.payment.count()).toBe(payments);
    expect(await db.inventoryMovement.count({ where: { variantId: { in: product!.variants.map((item) => item.id) } } })).toBe(movements);
    await page.goto("/panier");
    await expect(page.getByRole("button", { name: /retirer|supprimer/i }).first()).toBeVisible();
  } finally {
    await db.product.update({ where: { id: product!.id }, data: { isActive: true } });
    await owner.close();
  }
});
