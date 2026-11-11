import { test, expect } from "@playwright/test";
import { AUTH } from "./helpers";

test.use({ storageState: AUTH.admin });

test.describe("Administration AGHARAS", () => {
  test("le tableau de bord et la navigation sont accessibles au super-administrateur", async ({
    page,
  }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).toBe(200);
    await expect(
      page.getByRole("heading", { level: 1, name: "Tableau de bord" }),
    ).toBeVisible();

    const nav = page.getByRole("navigation", { name: "Navigation administration" });
    if (await nav.count()) {
      await expect(nav.first()).toBeVisible();
    }

    for (const label of [
      "Commandes",
      "Produits",
      "Stock",
      "Ordonnances",
      "Promotions",
      "Pages et contenu",
      "Messages",
      "Paramètres",
      "Catégories",
      "Marques",
      "Verres et corrections",
      "Adresse du magasin",
      "Journal d'audit",
    ]) {
      await expect(
        page.locator("aside").getByRole("link", { name: label }).first(),
      ).toBeVisible();
    }
  });

  test("les modules de gestion s'ouvrent avec leurs données de démonstration", async ({
    page,
  }) => {
    const modules = [
      ["/admin/commandes", "Commandes", /AVO-2026-0001/],
      ["/admin/produits", "Produits", /Le Marais N°04/],
      ["/admin/stock", "Stock & inventaire", /AV-MARAIS-04-OR/],
      ["/admin/promotions", "Promotions", /CERCLE10/],
      ["/admin/ordonnances", "Ordonnances", /ordonnance/i],
      ["/admin/contenu", "Contenu", /Conditions générales/i],
      ["/admin/messages", "Messages", /message/i],
      ["/admin/parametres", "Paramètres", /CMI/],
      ["/admin/categories", "Catégories", /Femme/],
      ["/admin/marques", "Marques", /produit/i],
      ["/admin/verres", "Verres et corrections", /Types de verres/],
      ["/admin/salons", "Adresses du magasin", /AGHARAS VISION/],
      ["/admin/journal", "Journal d'audit", /./],
    ] as const;

    for (const [path, heading, expectedText] of modules) {
      const response = await page.goto(path);
      expect(response?.status(), `statut de ${path}`).toBe(200);
      const h1 = page.getByRole("heading", { level: 1 });
      if (typeof heading === "string") {
        await expect(h1, `titre de ${path}`).toHaveText(heading);
      } else {
        await expect(h1, `titre de ${path}`).toContainText(heading);
      }
      await expect(
        page.getByText(expectedText).first(),
        `contenu de ${path}`,
      ).toBeVisible();
    }
  });

  test("le détail d'une commande expose les transitions contrôlées", async ({
    page,
  }) => {
    await page.goto("/admin/commandes?q=AVO-2026-0001");
    await page.getByRole("link", { name: "AVO-2026-0001" }).first().click();
    await expect(
      page.getByRole("heading", { level: 1, name: "AVO-2026-0001" }),
    ).toBeVisible();
    await expect(page.getByText("Mettre à jour le statut")).toBeVisible();
    await expect(page.getByText(/Livrée/).first()).toBeVisible();
  });

  test("les permissions sont refusées aux rôles non autorisés", async ({
    page,
  }) => {
    // Les anciens comptes staff n'ont plus accès à l'interface propriétaire.
    await page.context().clearCookies();
    await page.goto("/connexion");
    await page.locator('input[name="email"]').fill("opticien@agharas.local");
    await page.locator('input[name="password"]').fill("NotAnOwner!2026");
    await page.getByRole("button", { name: /Se connecter/ }).click();
    await expect(page.locator('p[role="alert"]')).toContainText("incorrects");
    await page.goto("/admin/ordonnances");
    await page.waitForURL("**/connexion?suivant=%2Fadmin");
  });
});

test.describe("Administration sans session", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("l'administration redirige vers la connexion avec retour", async ({
    page,
  }) => {
    await page.goto("/admin");
    await page.waitForURL("**/connexion?suivant=%2Fadmin");
    expect(page.url()).toContain("suivant=%2Fadmin");
  });
});
