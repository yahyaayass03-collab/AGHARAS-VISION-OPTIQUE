import { test, expect } from "@playwright/test";
import path from "node:path";
import { db, acceptTerms, chooseShipping, fillCheckoutIdentity, uniqueEmail, waitForConfirmation } from "./helpers";
import { formatDH } from "../../src/lib/money";

test("tarif de verre modifié par le propriétaire appliqué à la prochaine commande invitée", async ({ page, browser }) => {
  const [lens, index, defaultTreatment, product, historical] = await Promise.all([
    db.lensType.findFirst({ where: { kind: "SINGLE_VISION", isActive: true } }),
    db.lensIndex.findFirst({ where: { value: "1.60", isActive: true } }),
    db.lensTreatment.findFirst({ where: { isDefault: true, isActive: true } }),
    db.product.findUnique({ where: { slug: "titane-minimaliste-noir-mat" }, include: { variants: { include: { inventory: true } } } }),
    db.order.findFirst({ orderBy: { createdAt: "asc" }, include: { items: true } }),
  ]);
  expect(lens && index && defaultTreatment && product && historical).toBeTruthy();
  const owner = await browser.newContext({ storageState: path.join(import.meta.dirname, ".auth", "admin.json"), baseURL: test.info().project.use.baseURL });
  const admin = await owner.newPage();
  const updatedPrice = lens!.priceCents + 12300;
  try {
    await admin.goto("/admin/verres");
    const form = admin.locator('form').filter({ has: admin.locator(`input[name="id"][value="${lens!.id}"]`) });
    await form.locator('input[name="price"]').fill(String(updatedPrice / 100));
    await form.getByRole("button", { name: "Enregistrer" }).click();
    await expect(form.getByRole("status")).toContainText("Option enregistrée");
    await page.goto(`/configurateur/${product!.slug}`);
    await page.getByRole("button", { name: "Verres & traitements", exact: true }).click();
    const label = page.locator("label").filter({ has: page.locator(`input[name="lensTypeId"][value="${lens!.id}"]`) });
    await expect(label).toContainText(formatDH(updatedPrice));
    await label.locator("input").check({ force: true });
    await page.locator(`input[name="lensIndexId"][value="${index!.id}"]`).check({ force: true });
    await page.getByRole("button", { name: /^Ordonnance/ }).click();
    await page.getByRole("button", { name: /Saisir les mesures/ }).click();
    await page.locator("#rightSphere").fill("-2");
    await page.locator("#leftSphere").fill("-2");
    await page.getByRole("button", { name: /^Récapitulatif/ }).click();
    await page.getByRole("button", { name: /Ajouter au panier/ }).click();
    await page.waitForURL("**/panier");
    await page.goto("/commande");
    await fillCheckoutIdentity(page, { firstName: "Lina", lastName: "Audit", email: uniqueEmail("lens-price") });
    await chooseShipping(page, "standard");
    await acceptTerms(page);
    await page.getByRole("button", { name: /Confirmer ma commande/ }).click();
    const reference = await waitForConfirmation(page);
    const order = await db.order.findUnique({ where: { reference }, include: { items: true } });
    const expectedLens = updatedPrice + index!.priceCents + defaultTreatment!.priceCents;
    expect(order!.items[0]!.lensPriceCents).toBe(expectedLens);
    expect(order!.subtotalCents).toBe(product!.priceCents + expectedLens);
    expect(JSON.stringify(order!.items[0]!.configuration)).toContain(String(updatedPrice));
    const after = await db.order.findUnique({ where: { id: historical!.id }, include: { items: true } });
    expect(after!.totalCents).toBe(historical!.totalCents);
    expect(after!.items.map((item) => item.lensPriceCents)).toEqual(historical!.items.map((item) => item.lensPriceCents));
  } finally {
    await db.lensType.update({ where: { id: lens!.id }, data: { priceCents: lens!.priceCents } });
    await owner.close();
  }
});
