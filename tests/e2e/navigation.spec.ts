import { expect, test, type Page } from "@playwright/test";
import { AUTH } from "./helpers";

type BrowserDiagnostics = {
  errors: string[];
  failedRequests: string[];
  cancelledPrefetches: string[];
  timings: Array<{ destination: string; milliseconds: number }>;
};

function monitor(page: Page): BrowserDiagnostics {
  const diagnostics: BrowserDiagnostics = {
    errors: [],
    failedRequests: [],
    cancelledPrefetches: [],
    timings: [],
  };
  page.on("pageerror", (error) => diagnostics.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") diagnostics.errors.push(message.text());
  });
  page.on("requestfailed", (request) => {
    const failure = request.failure()?.errorText ?? "échec inconnu";
    const entry = `${request.url()} (${failure})`;
    // Next cancels speculative RSC prefetches when navigation makes them obsolete.
    if (failure === "net::ERR_ABORTED" && request.url().includes("?_rsc=")) {
      diagnostics.cancelledPrefetches.push(entry);
    } else {
      diagnostics.failedRequests.push(entry);
    }
  });
  return diagnostics;
}

async function finishNavigation(
  page: Page,
  destination: string,
  diagnostics: BrowserDiagnostics,
  startedAt: number,
) {
  await expect(page).toHaveURL(new RegExp(`${destination.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
  await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
  // Check an actionable link in the destination content, not just a URL change.
  await expect(page.locator("main a[href]:visible").first()).toBeVisible();
  diagnostics.timings.push({ destination, milliseconds: Date.now() - startedAt });
}

function expectClean(diagnostics: BrowserDiagnostics) {
  console.log("Navigation diagnostics:", JSON.stringify(diagnostics));
  expect(diagnostics.errors).toEqual([]);
  expect(diagnostics.failedRequests).toEqual([]);
}

test.describe("Navigation fiable de la boutique", () => {
  test("une fiche produit absente renvoie le vrai statut HTTP 404", async ({ page }) => {
    const response = await page.goto("/produit/__navigation_missing_probe__");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("Cette page n'existe pas", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voir le catalogue" })).toBeVisible();
  });

  test("liens en-tête, catégories, fiches, panier, pied de page et historique", async ({ page }) => {
    const diagnostics = monitor(page);
    await page.goto("/");

    const steps = [
      { selector: () => page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Homme" }), destination: "/catalogue/homme" },
      { selector: () => page.locator("main article a[href^='/produit/']").first(), destination: "/produit/" },
      { selector: () => page.getByRole("link", { name: /^Panier,/ }).first(), destination: "/panier" },
      { selector: () => page.locator("footer a[href='/faq']").first(), destination: "/faq" },
    ];

    for (const step of steps) {
      const startedAt = Date.now();
      await step.selector().click();
      if (step.destination === "/produit/") {
        await expect(page).toHaveURL(/\/produit\//);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await expect(page.locator("main a[href]:visible").first()).toBeVisible();
        diagnostics.timings.push({ destination: page.url(), milliseconds: Date.now() - startedAt });
      } else {
        await finishNavigation(page, step.destination, diagnostics, startedAt);
      }
    }

    const backStartedAt = Date.now();
    await page.goBack();
    await finishNavigation(page, "/panier", diagnostics, backStartedAt);
    const forwardStartedAt = Date.now();
    await page.goForward();
    await finishNavigation(page, "/faq", diagnostics, forwardStartedAt);

    expectClean(diagnostics);
  });

  test("navigation rapide et consultation directe avec rafraîchissement", async ({ page }) => {
    const diagnostics = monitor(page);
    await page.goto("/");
    for (const destination of ["/catalogue", "/contact", "/livraison", "/retours"]) {
      const link = destination === "/catalogue"
        ? page.getByRole("link", { name: /Découvrir la collection/ })
        : destination === "/contact"
          ? page.getByRole("navigation", { name: "Navigation principale" }).getByRole("link", { name: "Contact" })
        : page.locator(`a[href='${destination}']:visible`).first();
      const startedAt = Date.now();
      await link.click();
      await finishNavigation(page, destination, diagnostics, startedAt);
    }

    const refreshed = await page.reload();
    expect(refreshed?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: /Retours/ })).toBeVisible();
    await expect(page.locator("main a[href]:visible").first()).toBeVisible();
    expectClean(diagnostics);
  });

  test("menu mobile ouvre et suit ses liens", async ({ page }) => {
    const diagnostics = monitor(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const openMenu = page.getByRole("button", { name: "Ouvrir le menu" });
    await expect(openMenu).toBeVisible();
    await openMenu.click();
    const menu = page.getByRole("dialog", { name: "Menu principal" });
    await expect(menu).toBeVisible();
    // Wait for the real CSS transition to finish so the link is no longer moving.
    await expect
      .poll(() => menu.evaluate((element) => getComputedStyle(element).transform))
      .toBe("matrix(1, 0, 0, 1, 0, 0)");
    const startedAt = Date.now();
    await menu.getByRole("link", { name: "Contact", exact: true }).click();
    await finishNavigation(page, "/contact", diagnostics, startedAt);
    await expect(menu).toBeHidden();

    expectClean(diagnostics);
  });
});

test.describe("Navigation propriétaire autorisée", () => {
  test.use({ storageState: AUTH.admin });

  test("les liens du tableau de bord ouvrent les modules autorisés", async ({ page }) => {
    const diagnostics = monitor(page);
    await page.goto("/admin");
    await expect(page.getByRole("heading", { level: 1, name: "Tableau de bord" })).toBeVisible();
    const startedAt = Date.now();
    await page.locator("aside").getByRole("link", { name: "Pages et contenu" }).click();
    await expect(page).toHaveURL(/\/admin\/contenu$/);
    await expect(page.getByRole("heading", { level: 1, name: "Contenu" })).toBeVisible();
    await expect(page.locator("main")).toContainText("Conditions générales");
    diagnostics.timings.push({ destination: "/admin/contenu", milliseconds: Date.now() - startedAt });
    expectClean(diagnostics);
  });
});
