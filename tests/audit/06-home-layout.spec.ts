import { test, expect } from "@playwright/test";
import path from "node:path";
import { db } from "./helpers";

test.use({ storageState: path.join(import.meta.dirname, ".auth", "admin.json") });

test("l'ordre et les catégories choisies apparaissent sur l'accueil sans reconstruction", async ({ page }) => {
  const categories = await db.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 2 });
  expect(categories).toHaveLength(2);
  await page.goto("/admin/apparence");
  const choices = page.locator('input[type="checkbox"]');
  for (const input of await choices.all()) if (await input.isChecked()) await input.uncheck();
  await page.getByLabel(categories[1]!.name, { exact: false }).check();
  await page.getByLabel(categories[0]!.name, { exact: false }).check();
  const moveCategoriesUp = page.getByRole("button", { name: "Monter Catégories mises en avant" });
  const moveCategoriesDown = page.getByRole("button", { name: "Descendre Catégories mises en avant" });
  if (await moveCategoriesUp.isDisabled()) {
    await moveCategoriesDown.click();
    await moveCategoriesUp.click();
  } else {
    while (!(await moveCategoriesUp.isDisabled())) await moveCategoriesUp.click();
  }
  await page.getByRole("button", { name: "Enregistrer et publier l'accueil" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Accueil publié" })).toBeVisible();
  await page.goto("/");
  const [lensType, treatment, lensIndex, activeCoupon] = await Promise.all([
    db.lensType.findFirst({ where: { isActive: true, kind: { not: "NONE" } }, orderBy: { sortOrder: "asc" } }),
    db.lensTreatment.findFirst({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.lensIndex.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 3 }),
    db.coupon.findFirst({ where: { isActive: true } }),
  ]);
  if (lensType) await expect(page.getByText(lensType.name, { exact: true })).toBeVisible();
  if (treatment) await expect(page.getByText(treatment.name, { exact: true })).toBeVisible();
  if (lensIndex[2]) await expect(page.getByText(`${lensIndex[2].name} (${lensIndex[2].value})`, { exact: true })).toBeVisible();
  if (activeCoupon) await expect(page.getByText(activeCoupon.code, { exact: true })).toHaveCount(0);
  // Ignore the optional collections-banner CTA, which also sits inside the section.
  const links = page.locator("section#categories .grid-cols-2 > a");
  await expect(links).toHaveCount(2);
  await expect(links.nth(0)).toHaveAttribute("href", `/catalogue/${categories[1]!.slug}`);
  await expect(links.nth(1)).toHaveAttribute("href", `/catalogue/${categories[0]!.slug}`);
  expect(await page.locator("main section").first().getAttribute("id")).toBe("categories");
});
