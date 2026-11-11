import { test, expect } from "@playwright/test";
import { AUTH } from "./helpers";

test.describe("Parcours d'achat invité", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("un panier vide propose des alternatives", async ({ page }) => {
    await page.goto("/panier");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Votre panier est actuellement vide",
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Découvrir les montures" }),
    ).toBeVisible();
  });

  test("ajout au panier, checkout et confirmation de commande", async ({
    page,
    browser,
  }) => {
    // 1. Ajout d'un accessoire depuis sa fiche produit.
    await page.goto("/produit/etui-cuir-agharas");
    await page.getByRole("button", { name: "Ajouter au panier" }).click();
    await page.waitForURL("**/panier");
    await expect(
      page.getByRole("heading", { level: 2, name: "Récapitulatif de commande" }),
    ).toBeVisible();
    await expect(page.getByText("Étui en Cuir Agharas").first()).toBeVisible();

    // 2. Ouverture du checkout invité.
    await page.getByRole("link", { name: /Finaliser la commande/ }).click();
    await page.waitForURL("**/commande");
    await expect(
      page.getByRole("heading", { level: 1, name: "Finaliser ma commande" }),
    ).toBeVisible();

    // Le paiement en ligne CMI doit rester explicitement indisponible.
    await expect(page.getByText("Bientôt disponible")).toBeVisible();
    await expect(page.getByText("Paiement à la livraison").first()).toBeVisible();

    // 3. Saisie des coordonnées de livraison.
    const email = `e2e+${Date.now()}@agharas.local`;
    await page.locator('input[name="firstName"]').fill("Test");
    await page.locator('input[name="lastName"]').fill("Commande");
    await page.locator('input[name="phone"]').fill("0612345678");
    await page.locator('input[name="email"]').fill(email);
    await page
      .locator('input[name="addressLine1"]')
      .fill("12 rue de la Résistance, quartier Gauthier");
    await page.locator('input[name="city"]').fill("Casablanca");
    await page.locator('input[name="postalCode"]').fill("20050");
    await page.locator('input[name="acceptTerms"]').check();

    await page.getByRole("button", { name: /Confirmer ma commande/ }).click();
    await page.waitForURL(/\/commande\/confirmation\/AVO-/, {
      timeout: 30_000,
    });

    // 4. La page de confirmation est accessible via le jeton non devinable.
    await expect(
      page.getByRole("heading", { level: 1, name: "Merci pour votre commande" }),
    ).toBeVisible();
    const referencePattern = /AVO-\d{4}-[A-F0-9]+/;
    const reference = page.url().match(referencePattern)?.[0] ?? "";
    expect(reference).toMatch(referencePattern);
    await expect(page.getByText(reference).first()).toBeVisible();

    // 5. Nettoyage : annulation par l'administration, qui restaure le stock.
    const baseURL = test.info().project.use.baseURL ?? "http://127.0.0.1:3100";
    const adminContext = await browser.newContext({
      storageState: AUTH.admin,
      baseURL,
    });
    const adminPage = await adminContext.newPage();

    try {
      await adminPage.goto("/admin");
      await expect(
        adminPage.getByRole("heading", { level: 1, name: "Tableau de bord" }),
      ).toBeVisible();

      await adminPage.goto(`/admin/commandes?q=${reference}`);
      await adminPage
        .getByRole("link", { name: reference })
        .first()
        .click();
      await expect(
        adminPage.getByRole("heading", { level: 1, name: reference }),
      ).toBeVisible();

      await adminPage.selectOption('select[name="status"]', "CANCELLED");
      await adminPage.getByRole("button", { name: "Mettre à jour" }).click();
      await expect(
        adminPage.getByRole("status").filter({ hasText: "Statut mis à jour." }),
      ).toBeVisible();
      await expect(adminPage.getByText(/Annulée/).first()).toBeVisible();
    } finally {
      await adminContext.close();
    }
  });
});
