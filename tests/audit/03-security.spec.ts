import { expect, test } from "@playwright/test";
import path from "node:path";
import { db, uniqueEmail } from "./helpers";

const PRODUCT_SLUG = "le-marais-n04-or-pur";
const ADMIN_STATE = path.join(import.meta.dirname, ".auth", "admin.json");

test.describe.configure({ mode: "serial" });

test.describe("Sécurité : accès anonyme", () => {
  test("administration : redirection vers la connexion", async ({ page }) => {
    const response = await page.goto("/admin");
    expect(response?.status()).toBeLessThan(400);
    await page.waitForURL(/\/connexion/, { timeout: 20_000 });
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test("confirmation de commande : jeton d'accès obligatoire", async ({ page }) => {
    const order = await db.order.findFirst({
      where: { userId: null },
      orderBy: { createdAt: "desc" },
      select: { reference: true, accessToken: true },
    });
    expect(order, "aucune commande invité : exécuter la spec 01 d'abord").not.toBeNull();
    expect(order!.accessToken).toBeTruthy();

    const withoutToken = await page.goto(`/commande/confirmation/${order!.reference}`);
    expect(withoutToken?.status(), "accès sans jeton").toBe(404);

    const wrongToken = await page.goto(
      `/commande/confirmation/${order!.reference}?token=jeton-invalide`,
    );
    expect(wrongToken?.status(), "accès avec un jeton erroné").toBe(404);

    const withToken = await page.goto(
      `/commande/confirmation/${order!.reference}?token=${order!.accessToken}`,
    );
    expect(withToken?.status(), "accès avec le jeton légitime").toBe(200);
    await expect(page.getByText(order!.reference).first()).toBeVisible();
  });

  test("ordonnances : 401 pour une requête anonyme", async ({ page }) => {
    const prescription = await db.prescription.findFirst({
      where: { userId: null },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    expect(prescription, "aucune ordonnance invité en base").not.toBeNull();

    const anonymous = await page.request.get(`/api/ordonnances/${prescription!.id}`, {
      failOnStatusCode: false,
    });
    expect(anonymous.status()).toBe(401);
  });

  test("téléversement : un faux PDF est refusé côté serveur", async ({ page }) => {
    const singleVision = await db.lensType.findFirst({ where: { kind: "SINGLE_VISION", isActive: true } });
    const index = await db.lensIndex.findFirst({ where: { value: "1.60" } });
    const ordersBefore = await db.order.count();
    const cartsBefore = await db.cart.count();

    await page.goto(`/configurateur/${PRODUCT_SLUG}`);
    await page.getByRole("button", { name: "Verres & traitements", exact: true }).click();
    await page.locator(`input[name="lensTypeId"][value="${singleVision!.id}"]`).check({ force: true });
    await page.locator(`input[name="lensIndexId"][value="${index!.id}"]`).check({ force: true });
    await page.getByRole("button", { name: "Ordonnance", exact: true }).click();

    await page.getByRole("button", { name: /Téléverser/ }).click();
    await page.locator('input[type="file"]').setInputFiles({
      name: "ordonnance.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("ceci n'est pas un PDF mais un fichier texte déguisé"),
    });
    await page.getByRole("button", { name: "Récapitulatif", exact: true }).click();
    await page.getByRole("button", { name: /Ajouter au panier/ }).click();

    await expect(page.getByText(/Format non accept/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/configurateur\//);
    expect(await db.order.count()).toBe(ordersBefore);
    expect(await db.cart.count()).toBe(cartsBefore);
  });

  test("en-têtes de sécurité HTTP", async ({ page }) => {
    const response = await page.goto("/");
    const headers = response!.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["x-powered-by"]).toBeUndefined();
  });

  test("connexion : limitation du nombre de tentatives par adresse", async ({ page }) => {
    const email = uniqueEmail("audit.brute");
    await page.goto("/connexion");
    for (let attempt = 0; attempt < 7; attempt += 1) {
      await page.locator('input[name="email"]').fill(email);
      await page.locator('input[name="password"]').fill("MauvaisMotDePasse!1");
      await page.getByRole("button", { name: /Se connecter/ }).click();
      await page.waitForTimeout(700);
    }
    await expect(page.getByText(/Trop de tentatives/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test("catalogue : injection HTML dans la recherche non exécutée", async ({ page }) => {
    let dialogFired = false;
    page.on("dialog", async (dialog) => {
      dialogFired = true;
      await dialog.dismiss();
    });
    const payload = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
    const response = await page.goto(`/catalogue?q=${encodeURIComponent(payload)}`);
    expect(response?.status()).toBe(200);
    await page.waitForTimeout(1500);
    expect(dialogFired, "charge utile XSS exécutée").toBe(false);
    expect(await page.locator('img[src="x"]').count()).toBe(0);
    expect(await page.locator("script").filter({ hasText: "alert(2)" }).count()).toBe(0);
  });
});

test.describe("Sécurité : administration réservée au propriétaire", () => {
  test("les anciens identifiants staff et client ne créent pas de session", async ({ page }) => {
    for (const account of ["staff", "client"] as const) {
      const record = await db.user.findUnique({ where: { email: `audit.${account}@audit.local` } });
      expect(record).not.toBeNull();
      await page.goto("/connexion");
      await page.locator('input[name="email"]').fill(record!.email);
      await page.locator('input[name="password"]').fill("Audit!2026#Agharas");
      await page.getByRole("button", { name: /Se connecter/ }).click();
      await expect(page.locator('p[role="alert"]')).toContainText("incorrects");
      expect((await page.context().cookies()).some((cookie) => cookie.name === "agharas_session")).toBe(false);
    }
  });

  test("un visiteur ne peut pas rejouer une action de modification du produit", async ({ page, browser }) => {
    const product = await db.product.findFirst({ where: { slug: PRODUCT_SLUG } });
    expect(product).not.toBeNull();
    const owner = await browser.newContext({ storageState: ADMIN_STATE, baseURL: test.info().project.use.baseURL });
    const ownerPage = await owner.newPage();
    await ownerPage.goto(`/admin/produits/${product!.slug}`);
    const actionFields = await ownerPage.locator('form:has(input[name="imageUrls"])').evaluate((form: HTMLFormElement) =>
      Object.fromEntries(Array.from(new FormData(form).entries()).filter(([name]) => name.startsWith("$ACTION_")).map(([name, value]) => [name, String(value)])),
    );
    await owner.close();
    expect(Object.keys(actionFields).length).toBeGreaterThan(0);
    const before = await db.product.findUnique({ where: { id: product!.id } });
    const response = await page.request.post(`/admin/produits/${product!.slug}`, {
      form: { ...actionFields, id: product!.id, price: "0.01", imageUrls: "/images/stitch/boutique_en_ligne_haute_lunetterie-02.jpg", isActive: "on" }, maxRedirects: 0, failOnStatusCode: false,
    });
    expect(response.status()).not.toBe(303);
    const after = await db.product.findUnique({ where: { id: product!.id } });
    expect(after!.isActive).toBe(before!.isActive);
    expect(after!.priceCents).toBe(before!.priceCents);
  });

  test("un visiteur ne peut modifier ni bannière ni paramètres de boutique", async ({ page, browser }) => {
    const hero = await db.banner.findUnique({ where: { key: "home-hero" } });
    const phone = await db.setting.findUnique({ where: { key: "store.phone" } });
    expect(hero).not.toBeNull();
    expect(phone).not.toBeNull();
    const owner = await browser.newContext({ storageState: ADMIN_STATE, baseURL: test.info().project.use.baseURL });
    const ownerPage = await owner.newPage();
    await ownerPage.goto(`/admin/contenu?onglet=bannieres&modifier=${hero!.id}`);
    const bannerAction = await ownerPage.locator('form:has(input[name="key"][value="home-hero"])').evaluate((form: HTMLFormElement) =>
      Object.fromEntries(Array.from(new FormData(form).entries()).filter(([name]) => name.startsWith("$ACTION_")).map(([name, value]) => [name, String(value)])),
    );
    await ownerPage.goto("/admin/parametres");
    const settingsAction = await ownerPage.locator('form:has(input[name="store.phone"])').evaluate((form: HTMLFormElement) =>
      Object.fromEntries(Array.from(new FormData(form).entries()).filter(([name]) => name.startsWith("$ACTION_")).map(([name, value]) => [name, String(value)])),
    );
    await owner.close();
    expect(Object.keys(bannerAction).length).toBeGreaterThan(0);
    expect(Object.keys(settingsAction).length).toBeGreaterThan(0);

    const bannerResponse = await page.request.post("/admin/contenu", {
      form: { ...bannerAction, id: hero!.id, key: "home-hero", title: "Intrusion audit" },
      maxRedirects: 0, failOnStatusCode: false,
    });
    const settingsResponse = await page.request.post("/admin/parametres", {
      form: { ...settingsAction, "store.phone": "+212 555 11 11 11" },
      maxRedirects: 0, failOnStatusCode: false,
    });
    expect(bannerResponse.status()).not.toBe(303);
    expect(settingsResponse.status()).not.toBe(303);
    expect((await db.banner.findUnique({ where: { id: hero!.id } }))!.title).toBe(hero!.title);
    expect((await db.setting.findUnique({ where: { key: "store.phone" } }))!.value).toBe(phone!.value);
  });

  test("cookie propriétaire HttpOnly, SameSite et Secure", async ({ browser }) => {
    const context = await browser.newContext({ storageState: ADMIN_STATE });
    const session = (await context.cookies()).find((cookie) => cookie.name === "agharas_session");
    expect(session).toBeTruthy();
    expect(session!.httpOnly).toBe(true);
    expect(["Lax", "Strict"]).toContain(session!.sameSite);
    expect(session!.secure).toBe(true);
    await context.close();
  });
});
