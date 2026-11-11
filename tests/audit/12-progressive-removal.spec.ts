import { expect, test } from "@playwright/test";
import { db, fillCheckoutIdentity, chooseShipping, acceptTerms, uniqueEmail } from "./helpers";
import { opticalSignature } from "../../src/lib/optical-compatibility";

test("une requête de panier falsifiée ne peut pas ajouter l'option progressive", async ({ page }) => {
  const lens = await db.lensType.findFirstOrThrow({ where: { kind: "PROGRESSIVE" } });
  const product = await db.product.findUniqueOrThrow({ where: { slug: "titane-minimaliste-noir-mat" } });
  const supportedLens = await db.lensType.findFirstOrThrow({ where: { slug: "unifocaux-hd", isActive: true } });
  const supportedIndex = await db.lensIndex.findFirstOrThrow({ where: { value: "1.60", isActive: true } });
  const itemsBefore = await db.cartItem.count();
  const prescriptionsBefore = await db.prescription.count();
  try {
    // Exercise the application policy even if a stale/incorrect admin edit
    // reactivates the legacy catalogue row.
    await db.lensType.update({ where: { id: lens.id }, data: { isActive: true } });
    await page.goto(`/configurateur/${product.slug}`);
    await page.getByRole("button", { name: "Verres & traitements", exact: true }).click();
    await expect(page.getByText(/progressif/i)).toHaveCount(0);
    await page.locator(`input[name="lensTypeId"][value="${supportedLens.id}"]`).check({ force: true });
    await page.locator(`input[name="lensIndexId"][value="${supportedIndex.id}"]`).check({ force: true });
    await page.getByRole("button", { name: /^Ordonnance/ }).click();
    await page.getByRole("button", { name: /Saisir les mesures/ }).click();
    await page.locator("#rightSphere").fill("-2.30");
    await page.getByRole("button", { name: /RÉCAPITULATIF/i }).last().click();
    // Craft the submitted FormData only after React's final render. This
    // models a malicious browser request against the real server action.
    await page.locator('form:has(input[name="prescriptionMethod"])').evaluate((form, value) => {
      const choices = form.querySelectorAll<HTMLInputElement>('input[name="lensTypeId"]');
      for (const choice of choices) choice.removeAttribute("name");
      const forged = document.createElement("input");
      forged.type = "hidden";
      forged.name = "lensTypeId";
      forged.value = String(value);
      form.append(forged);
    }, lens.id);
    expect(await page.locator('form:has(input[name="prescriptionMethod"])').evaluate((form) => new FormData(form as HTMLFormElement).get("lensTypeId"))).toBe(lens.id);
    await page.getByRole("button", { name: /Ajouter au panier/ }).click();
    await expect(page.getByText(/n'est plus disponible pour les nouveaux achats/i)).toBeVisible();
    expect(await db.cartItem.count()).toBe(itemsBefore);
    expect(await db.prescription.count()).toBe(prescriptionsBefore);
  } finally {
    await db.lensType.update({ where: { id: lens.id }, data: { isActive: false } });
  }
});

test("progressifs absents des choix et panier historique progressif refusé à la commande", async ({ page }) => {
  const lens = await db.lensType.findFirstOrThrow({ where: { kind: "PROGRESSIVE" } });
  const product = await db.product.findUniqueOrThrow({
    where: { slug: "titane-minimaliste-noir-mat" },
    include: { variants: { where: { isActive: true }, include: { inventory: true }, take: 1 } },
  });
  const variant = product.variants[0]!;
  const index = await db.lensIndex.findFirstOrThrow({ where: { isActive: true, value: "1.60" } });
  const treatments = await db.lensTreatment.findMany({ where: { isActive: true, isDefault: true } });

  expect(lens.isActive).toBe(false);
  await page.goto(`/configurateur/${product.slug}`);
  await page.getByRole("button", { name: "Verres & traitements", exact: true }).click();
  await expect(page.getByText(/progressif/i)).toHaveCount(0);
  await expect(page.locator(`input[name="lensTypeId"][value="${lens.id}"]`)).toHaveCount(0);

  // Model a pre-existing browser cart snapshot. Temporarily mark the legacy
  // option active so this specifically exercises the immutable kind guard.
  const token = `progressive-stale-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const cart = await db.cart.create({ data: { token } });
  const oldSnapshot = {
    hasCorrection: true,
    lensTypeId: lens.id,
    lensTypeName: lens.name,
    lensTypePriceCents: lens.priceCents,
    lensIndexId: index.id,
    lensIndexName: index.name,
    lensIndexValue: index.value,
    lensIndexPriceCents: index.priceCents,
    treatments: treatments.map(({ id, name, priceCents }) => ({ id, name, priceCents })),
    lensPriceCents: lens.priceCents + index.priceCents + treatments.reduce((sum, row) => sum + row.priceCents, 0),
    summary: "Ancienne configuration — test synthétique",
  };
  const ordersBefore = await db.order.count();
  const stockBefore = variant.inventory!.quantity;
  const salesBefore = await db.inventoryMovement.count({ where: { variantId: variant.id, reason: "SALE" } });
  const signature = opticalSignature({ productId: product.id, variantId: variant.id, lensTypeId: lens.id, lensIndexId: index.id, treatmentIds: treatments.map(({ id }) => id) });
  const syntheticRule = await db.opticalCompatibilityRule.create({
    data: {
      signature,
      productId: product.id,
      variantId: variant.id,
      lensTypeId: lens.id,
      lensIndexId: index.id,
      treatmentIds: treatments.map(({ id }) => id).sort(),
      status: "APPROVED",
      reviewer: "TEST ONLY — NOT A PROFESSIONAL APPROVAL",
      reviewedAt: new Date(),
      evidence: "Synthetic regression fixture only; no clinical or business approval.",
      actorEmail: "test-only@audit.local",
    },
  });
  try {
    await db.lensType.update({ where: { id: lens.id }, data: { isActive: true } });
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        variantId: variant.id,
        quantity: 1,
        configKey: `legacy-progressive-${lens.id}`,
        lensSnapshot: oldSnapshot,
      },
    });
    await page.context().addCookies([{ name: "agharas_cart", value: token, url: test.info().project.use.baseURL as string }]);
    await page.goto("/commande");
    await fillCheckoutIdentity(page, { firstName: "Test", lastName: "Synthétique", email: uniqueEmail("no-progressive") });
    await chooseShipping(page, "standard");
    await acceptTerms(page);
    await page.getByRole("button", { name: /Confirmer ma commande/ }).click();
    await expect(page.getByText(/options de verres ont changé/i)).toBeVisible();
    expect(await db.order.count()).toBe(ordersBefore);
    expect((await db.productVariant.findUniqueOrThrow({ where: { id: variant.id }, include: { inventory: true } })).inventory!.quantity).toBe(stockBefore);
    expect(await db.inventoryMovement.count({ where: { variantId: variant.id, reason: "SALE" } })).toBe(salesBefore);
  } finally {
    await db.cart.delete({ where: { id: cart.id } });
    await db.opticalCompatibilityRule.delete({ where: { id: syntheticRule.id } });
    await db.lensType.update({ where: { id: lens.id }, data: { isActive: false } });
  }
});
