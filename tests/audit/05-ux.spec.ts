import { expect, test } from "@playwright/test";
import path from "node:path";

const PRODUCT_SLUG = "le-marais-n04-or-pur";
const ADMIN_STATE = path.join(import.meta.dirname, ".auth", "admin.json");

const VIEWPORTS = [
  { name: "bureau", width: 1440, height: 900 },
  { name: "tablette", width: 768, height: 1024 },
  { name: "mobile", width: 390, height: 844 },
] as const;

const PUBLIC_PAGES = [
  "/",
  "/catalogue",
  `/produit/${PRODUCT_SLUG}`,
  "/panier",
  "/faq",
  "/contact",
  "/boutiques",
  "/connexion",
];

test.describe.configure({ mode: "serial" });

test.describe("UX et responsive : pages publiques", () => {
  for (const viewport of VIEWPORTS) {
    test(`aucun débordement horizontal ni page vide — ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const route of PUBLIC_PAGES) {
        await page.goto(route);
        const status = await page.evaluate(() => document.readyState);
        expect(status, `${route} non chargé`).toBe("complete");
        await expect(
          page.getByRole("heading", { level: 1 }).first(),
          `${route} sans titre principal`,
        ).toBeVisible();

        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(overflow, `${route} déborde horizontalement de ${overflow}px`).toBeLessThanOrEqual(2);
      }
    });
  }

  test("menu mobile : ouverture, dialogue modal et fermeture par Échap", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const trigger = page.getByRole("button", { name: "Ouvrir le menu" });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Menu principal" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Femme" }).first()).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });
});

test.describe("UX et responsive : parcours invité", () => {
  test("aucun débordement sur le panier et les favoris (mobile)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const route of ["/panier", "/favoris", "/catalogue"]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route} déborde de ${overflow}px`).toBeLessThanOrEqual(2);
      // Un seul repère <main> par page.
      expect(await page.locator("main").count(), `${route} : <main> imbriqué`).toBe(1);
    }
  });
});

test.describe("UX et responsive : administration", () => {
  test.use({ storageState: ADMIN_STATE });

  test("les écrans d'administration s'affichent sans débordement (bureau)", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const route of [
      "/admin",
      "/admin/produits",
      "/admin/commandes",
      "/admin/stock",
      "/admin/categories",
      "/admin/marques",
      "/admin/verres",
      "/admin/promotions",
      "/admin/parametres",
    ]) {
      const response = await page.goto(route);
      expect(response?.status(), `${route}`).toBeLessThan(400);
      await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route} déborde de ${overflow}px`).toBeLessThanOrEqual(2);
    }
  });
});
