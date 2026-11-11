import { test, expect } from "@playwright/test";

test.describe("Vitrine publique", () => {
  test("l'accueil expose le hero, la navigation et le lien d'évitement", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    await expect(
      page.getByRole("heading", { level: 1, name: /Voyez la différence/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Aller au contenu principal" }),
    ).toBeAttached();
    await expect(
      page.getByRole("link", { name: /Découvrir la collection/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Navigation principale" }),
    ).toBeVisible();
  });

  test("le catalogue affiche les produits et filtre par recherche", async ({
    page,
  }) => {
    await page.goto("/catalogue");
    await expect(
      page.getByRole("heading", { level: 1, name: "La collection" }),
    ).toBeVisible();

    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible();

    await page.goto("/catalogue?q=Marais");
    await expect(
      page.getByRole("link", { name: /Le Marais N°04/ }).first(),
    ).toBeVisible();
    await expect(cards).toHaveCount(1);
  });

  test("une fiche produit propose le coloris et l'ajout au panier", async ({
    page,
  }) => {
    await page.goto("/produit/etui-cuir-agharas");
    await expect(
      page.getByRole("heading", { level: 1, name: /Étui en Cuir Agharas/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Ajouter au panier" }),
    ).toBeEnabled();
    await expect(page.getByText("Référence : AV-ETUI-CUIR-CO")).toBeVisible();
  });

  test("le configurateur de verres s'ouvre sur la première étape", async ({
    page,
  }) => {
    await page.goto("/configurateur/le-marais-n04-or-pur");
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Composez vos verres de précision",
      }),
    ).toBeVisible();
    await expect(page.getByText("Votre correction").first()).toBeVisible();
    await expect(page.getByText("Votre ordonnance").first()).toBeVisible();
  });

  test("les pages institutionnelles sont rendues depuis la base", async ({
    page,
  }) => {
    for (const [path, expected] of [
      ["/cgv", /Conditions générales/i],
      ["/confidentialite", /confidentialité|données personnelles/i],
      ["/mentions-legales", /mentions légales|éditeur/i],
      ["/livraison", /livraison/i],
      ["/retours", /retours|garantie/i],
    ] as const) {
      await page.goto(path);
      const heading = page.getByRole("heading", { level: 1 });
      await expect(heading).toBeVisible();
      await expect(heading).toContainText(expected);
    }

    await page.goto("/faq");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/questions/i).first()).toBeVisible();
  });

  test("une URL inconnue renvoie une page 404 en français", async ({ page }) => {
    const response = await page.goto("/cette-page-n-existe-pas");
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole("heading", { level: 1, name: /Cette page n'existe pas/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Retour à l'accueil" }),
    ).toBeVisible();
  });
});

test.describe("SEO et sécurité publique", () => {
  test("robots.txt interdit les zones privées", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Disallow: /compte");
    expect(body).toContain("Disallow: /panier");
    expect(body).toContain("Sitemap:");
  });

  test("sitemap.xml contient les routes et les produits actifs", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("<urlset");
    expect(body).toContain("/catalogue");
    expect(body).toContain("/produit/");
    expect(body).toContain("/cgv");
  });

  test("le téléchargement d'ordonnance exige une session", async ({
    request,
  }) => {
    const response = await request.get("/api/ordonnances/inexistant", {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(401);
    expect(await response.text()).toContain("Authentification requise");
  });

  test("les en-têtes de sécurité sont appliqués", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
    expect(response.headers()["referrer-policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
  });
});
