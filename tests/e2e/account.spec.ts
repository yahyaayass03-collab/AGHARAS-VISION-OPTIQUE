import { test, expect } from "@playwright/test";

test.describe("Boutique sans compte client", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("aucun lien client dans l'en-tête et le pied de page", async ({ page }) => {
    await page.goto("/");
    const chrome = page.locator("header, footer");
    await expect(chrome.getByRole("link", { name: /mon compte|connexion|s'inscrire/i })).toHaveCount(0);
    await expect(chrome.locator('a[href^="/compte"], a[href="/inscription"]')).toHaveCount(0);
    await expect(page.getByRole("link", { name: /panier/i }).first()).toBeVisible();
  });

  test("l'inscription et les anciennes pages client sont retirées", async ({ page }) => {
    for (const path of ["/inscription", "/compte", "/compte/commandes", "/compte/profil"]) {
      await page.goto(path);
      await page.waitForURL("**/");
    }
  });

  test("les favoris restent accessibles sans compte", async ({ page }) => {
    await page.goto("/favoris");
    await expect(page.getByRole("heading", { level: 1, name: "Mes favoris" })).toBeVisible();
  });

  test("un favori invité n'affiche aucune invitation à créer un compte", async ({ page }) => {
    await page.goto("/produit/etui-cuir-agharas");
    await page.getByRole("button", { name: "Ajouter aux favoris" }).first().click();
    await page.goto("/favoris");
    await expect(page.getByRole("heading", { level: 1, name: "Mes favoris" })).toBeVisible();
    await expect(page.getByRole("link", { name: /se connecter|créer un compte/i })).toHaveCount(0);
  });

  test("seul le propriétaire peut se connecter à l'administration", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/connexion?suivant=%2Fadmin");
    await page.locator('input[name="email"]').fill("visitor@audit.local");
    await page.locator('input[name="password"]').fill("NotAnOwner!2026");
    await page.getByRole("button", { name: /Se connecter/ }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("incorrects");
    await expect(page.getByRole("link", { name: /créer un compte/i })).toHaveCount(0);
  });
});
