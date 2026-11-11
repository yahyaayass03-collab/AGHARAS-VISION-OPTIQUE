import { expect, test } from "@playwright/test";
import path from "node:path";
import { db, fillCheckoutIdentity, chooseShipping, acceptTerms, uniqueEmail, waitForConfirmation } from "./helpers";

const STAMP = Date.now();
const PRODUCT_SLUG = `monture-audit-${STAMP}`;
const PRODUCT_SKU = `AUD-${STAMP}`;
const VARIANT_SKU = `AUD-${STAMP}-01`;
const COUPON_CODE = `AUDIT${String(STAMP).slice(-6)}`;

const ADMIN_STATE = path.join(import.meta.dirname, ".auth", "admin.json");

test.describe.configure({ mode: "serial" });

test.describe("Administration : CRUD et permissions", () => {
  test.use({ storageState: ADMIN_STATE });

  test("produit : création, édition du prix, ajout de coloris et stock initial", async ({ page }) => {
    // --- Création ---
    await page.goto("/admin/produits/nouveau");
    await page.locator('input[name="name"]').fill("Monture Audit Préflight");
    await page.locator('input[name="slug"]').fill(PRODUCT_SLUG);
    await page
      .locator('textarea[name="description"]')
      .fill("Produit synthétique créé par la campagne d'audit pré-production, à supprimer.");
    await page.locator('select[name="brandId"]').selectOption({ index: 1 });
    await page.locator('select[name="categoryId"]').selectOption({ index: 1 });
    await page.locator('select[name="type"]').selectOption("OPTICAL");
    await page.locator('select[name="gender"]').selectOption("MIXTE");
    await page.locator('select[name="shape"]').selectOption("PANTOS");
    await page.locator('input[name="sku"]').fill(PRODUCT_SKU);
    await page.locator('input[name="price"]').fill("1500");
    await page.getByRole("button", { name: "Créer le produit" }).click();

    await page.waitForURL(`**/admin/produits/${PRODUCT_SLUG}`, { timeout: 40_000 });
    const created = await db.product.findUnique({ where: { slug: PRODUCT_SLUG } });
    expect(created, "produit non enregistré en base").not.toBeNull();
    expect(created!.priceCents).toBe(150_000);
    expect(created!.sku).toBe(PRODUCT_SKU);
    expect(created!.isActive).toBe(false);
    expect((await page.request.get(`/produit/${PRODUCT_SLUG}`)).status()).toBe(404);

    // --- Édition du prix ---
    await page.locator('input[name="price"]').first().fill("1999");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await page.waitForTimeout(2500);
    const edited = await db.product.findUnique({ where: { slug: PRODUCT_SLUG } });
    expect(edited!.priceCents).toBe(199_900);

    // --- Ajout d'un coloris avec stock initial ---
    await page.locator('input[name="colorName"]').fill("Noir Audit");
    await page.locator('input[name="colorHex"]').fill("#123456");
    await page.locator('input[name="sku"]').last().fill(VARIANT_SKU);
    await page.locator('input[name="stock"]').fill("7");
    await page.getByRole("button", { name: "Ajouter le coloris" }).click();
    await page.waitForTimeout(2500);

    const variant = await db.productVariant.findFirst({
      where: { sku: VARIANT_SKU },
      include: { inventory: true },
    });
    expect(variant, "variante non créée").not.toBeNull();
    expect(variant!.inventory!.quantity).toBe(7);
  });

  test("produit : import d'images, publication en direct, mise à jour puis dépublication", async ({ page, browser }) => {
    await page.goto(`/admin/produits/${PRODUCT_SLUG}`);
    await page.locator('input[name="images"]').setInputFiles(path.join(process.cwd(), "public/images/stitch/boutique_en_ligne_haute_lunetterie-01.jpg"));
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Produit enregistré" })).toBeVisible();
    await page.reload();
    const photo = await db.productImage.findFirst({ where: { product: { slug: PRODUCT_SLUG } } });
    expect(photo?.url).toMatch(/^\/api\/media\//);
    const photoResponse = await page.request.get(photo!.url);
    expect(photoResponse.status()).toBe(200);
    expect(photoResponse.headers()["content-type"]).toBe("image/webp");
    expect(photoResponse.headers()["cache-control"]).toContain("immutable");
    expect((await photoResponse.body()).subarray(8, 12).toString()).toBe("WEBP");
    const conditionalPhotoResponse = await page.request.get(photo!.url, {
      headers: { "If-None-Match": photoResponse.headers().etag! },
    });
    expect(conditionalPhotoResponse.status()).toBe(304);
    const photoId = photo!.url.match(/[a-f0-9]{32}/)?.[0];
    expect(photoId).toBeTruthy();
    expect(await db.publicMediaObject.findUnique({ where: { id: photoId! }, select: { byteLength: true } })).not.toBeNull();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Publier", exact: true }).click();
    await expect.poll(async () => (await db.product.findUnique({ where: { slug: PRODUCT_SLUG } }))?.isActive).toBe(true);
    await page.goto(`/produit/${PRODUCT_SLUG}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Monture Audit Préflight");
    await page.goto("/catalogue?q=Monture%20Audit%20Pr%C3%A9flight");
    await expect(page.getByText("Monture Audit Préflight").first()).toBeVisible();

    const listed = await db.product.findUnique({ where: { slug: PRODUCT_SLUG }, include: { category: true } });
    await page.goto(`/catalogue/${listed!.category.slug}`);
    await expect(page.getByText("Monture Audit Préflight").first()).toBeVisible();

    // Acheter le produit créé depuis une session invitée distincte du propriétaire.
    const guest = await browser.newContext({ baseURL: test.info().project.use.baseURL });
    const shopper = await guest.newPage();
    await shopper.goto(`/produit/${PRODUCT_SLUG}`);
    await shopper.getByRole("button", { name: /Ajouter la monture seule/ }).click();
    await shopper.waitForURL("**/panier");
    await shopper.goto("/commande");
    const email = uniqueEmail("nouveau-produit");
    await fillCheckoutIdentity(shopper, { firstName: "Client", lastName: "Audit", email });
    await chooseShipping(shopper, "standard");
    await acceptTerms(shopper);
    await shopper.getByRole("button", { name: /Confirmer ma commande/ }).click();
    const reference = await waitForConfirmation(shopper);
    const order = await db.order.findUnique({ where: { reference }, include: { items: true } });
    expect(order!.userId).toBeNull();
    expect(order!.items[0]!.unitPriceCents).toBe(199_900);
    const variantAfter = await db.productVariant.findFirst({ where: { sku: VARIANT_SKU }, include: { inventory: true } });
    expect(variantAfter!.inventory!.quantity).toBe(6);
    expect(await db.inventoryMovement.count({ where: { variantId: variantAfter!.id, reason: "SALE" } })).toBeGreaterThan(0);
    await guest.close();

    await page.goto(`/admin/produits/${PRODUCT_SLUG}`);
    await page.locator('input[name="images"]').setInputFiles(path.join(process.cwd(), "public/images/stitch/boutique_en_ligne_haute_lunetterie-02.jpg"));
    await page.getByRole("button", { name: "Monter la photo 2" }).click();
    await page.locator('input[name="price"]').first().fill("2145");
    await page.getByRole("button", { name: "Enregistrer les modifications" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Produit enregistré" })).toBeVisible();
    const updated = await db.product.findUnique({ where: { slug: PRODUCT_SLUG }, include: { images: { orderBy: { sortOrder: "asc" } } } });
    expect(updated!.priceCents).toBe(214_500);
    expect(updated!.images[0]!.url).not.toBe(photo!.url);
    const preserved = await db.order.findUnique({ where: { reference }, include: { items: true } });
    expect(preserved!.items[0]!.unitPriceCents).toBe(199_900);
    await page.goto(`/produit/${PRODUCT_SLUG}`);
    await expect(page.getByText(/2[\s\u00a0\u202f]145/).first()).toBeVisible();

    await page.goto(`/admin/produits/${PRODUCT_SLUG}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Dépublier" }).click();
    await expect.poll(async () => (await db.product.findUnique({ where: { slug: PRODUCT_SLUG } }))?.isActive).toBe(false);
    expect((await page.request.get(`/produit/${PRODUCT_SLUG}`)).status()).toBe(404);

    // Archivage non destructif puis restauration en brouillon.
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Archiver" }).click();
    await expect.poll(async () => (await db.product.findUnique({ where: { slug: PRODUCT_SLUG } }))?.archivedAt).not.toBeNull();
    expect((await db.order.findUnique({ where: { reference }, include: { items: true } }))!.items[0]!.unitPriceCents).toBe(199_900);
    await page.goto("/admin/produits?statut=archives");
    await expect(page.getByText("Monture Audit Préflight").first()).toBeVisible();
    await expect(page.locator("tr", { hasText: "Monture Audit Préflight" }).getByText("Archivé", { exact: true })).toBeVisible();
    await page.goto(`/admin/produits/${PRODUCT_SLUG}`);
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Restaurer le produit" }).click();
    await expect.poll(async () => (await db.product.findUnique({ where: { slug: PRODUCT_SLUG } }))?.archivedAt).toBeNull();
    const restored = await db.product.findUnique({ where: { slug: PRODUCT_SLUG } });
    expect(restored!.isActive).toBe(false);
  });

  test("stock : ajustement tracé par un mouvement d'inventaire", async ({ page }) => {
    const variant = await db.productVariant.findFirst({
      where: { sku: VARIANT_SKU },
      include: { inventory: true },
    });
    expect(variant).not.toBeNull();
    const before = variant!.inventory!.quantity;

    await page.goto(`/admin/stock?q=${VARIANT_SKU}`);
    const row = page.locator("tr", { hasText: VARIANT_SKU }).first();
    await expect(row).toBeVisible();
    await row.locator('input[name="delta"]').fill("5");
    await row.locator('input[name="note"]').fill("Réception audit");
    await row.locator('button[type="submit"]').click();
    await page.waitForTimeout(2500);

    const after = await db.inventoryItem.findUnique({ where: { variantId: variant!.id } });
    expect(after!.quantity).toBe(before + 5);
    const movement = await db.inventoryMovement.findFirst({
      where: { variantId: variant!.id },
      orderBy: { createdAt: "desc" },
    });
    expect(movement!.delta).toBe(5);
  });

  test("promotion : création d'un code et bascule d'activation", async ({ page }) => {
    await page.goto("/admin/promotions?nouveau=1");
    await page.locator('input[name="code"]').fill(COUPON_CODE);
    await page.locator('select[name="type"]').selectOption("PERCENT");
    await page.locator('input[name="value"]').fill("15");
    await page.locator('textarea[name="description"]').fill("Code synthétique d'audit");
    await page.getByRole("button", { name: "Créer le code" }).click();
    await page.waitForTimeout(2500);

    const coupon = await db.coupon.findUnique({ where: { code: COUPON_CODE } });
    expect(coupon, "code promo non créé").not.toBeNull();
    expect(coupon!.type).toBe("PERCENT");
    expect(coupon!.value).toBe(15);
    expect(coupon!.isActive).toBe(true);

    await page.goto("/admin/promotions");
    const row = page.locator("tr", { hasText: COUPON_CODE }).first();
    await row.locator('form button[type="submit"]').first().click();
    await page.waitForTimeout(2000);
    const disabled = await db.coupon.findUnique({ where: { code: COUPON_CODE } });
    expect(disabled!.isActive).toBe(false);
  });

  test("réglages : sauvegarde d'une valeur de boutique", async ({ page }) => {
    const before = await db.setting.findUnique({ where: { key: "store.phone" } });
    const newPhone = "+212 522 99 88 77";

    await page.goto("/admin/parametres");
    await page.locator('input[name="store.phone"]').fill(newPhone);
    await page.getByRole("button", { name: "Enregistrer les réglages" }).click();
    await page.waitForTimeout(2500);

    const after = await db.setting.findUnique({ where: { key: "store.phone" } });
    expect(after!.value).toBe(newPhone);

    // Restauration de la valeur initiale
    if (before) {
      await db.setting.update({ where: { key: "store.phone" }, data: { value: before.value } });
    }
  });

  test("commande : transitions valides puis rejet serveur d'une transition interdite", async ({ page }) => {
    const order = await db.order.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    expect(order, "aucune commande PENDING : exécuter la spec 01 d'abord").not.toBeNull();

    await page.goto(`/admin/commandes/${order!.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(order!.reference);

    // Récupère l'identifiant d'action serveur pour un rejeu ultérieur
    const actionField = await page
      .locator('form input[name^="$ACTION_ID_"]')
      .first()
      .getAttribute("name");
    expect(actionField, "identifiant d'action serveur introuvable").toBeTruthy();

    for (const status of ["CONFIRMED", "IN_PRODUCTION", "SHIPPED", "DELIVERED"]) {
      await page.locator('select[name="status"]').selectOption(status);
      await page.getByRole("button", { name: "Mettre à jour" }).click();
      await page.waitForTimeout(2200);
      const current = await db.order.findUnique({ where: { id: order!.id } });
      expect(current!.status, `transition vers ${status}`).toBe(status);
    }

    // Une commande livrée est terminale : plus aucun formulaire de transition.
    await page.reload();
    await expect(page.locator('select[name="status"]')).toHaveCount(0);

    // Rejeu d'une transition interdite (DELIVERED -> PENDING) via l'action serveur.
    const replay = await page.request.post(`/admin/commandes/${order!.id}`, {
      form: { [actionField!]: "", orderId: order!.id, status: "PENDING", note: "rejeu audit" },
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(replay.status(), "le rejeu ne doit pas produire une redirection de succès").not.toBe(303);
    const unchanged = await db.order.findUnique({ where: { id: order!.id } });
    expect(unchanged!.status, "statut modifié par un rejeu interdit").toBe("DELIVERED");
    const historyCount = await db.orderStatusHistory.count({ where: { orderId: order!.id } });
    expect(historyCount).toBe(5);
  });

  test("CMS : titre et image de l'accueil synchronisés sans rebuild", async ({ page }) => {
    const original = await db.banner.findUnique({ where: { key: "home-hero" } });
    expect(original).not.toBeNull();
    await page.goto(`/admin/contenu?onglet=bannieres&modifier=${original!.id}`);
    const form = page.locator('form:has(input[name="key"][value="home-hero"])');
    await form.locator('input[name="title"]').fill("Vision de la collection Audit");
    await form.locator('input[name="image"]').setInputFiles(path.join(process.cwd(), "public/images/stitch/boutique_en_ligne_haute_lunetterie-02.jpg"));
    await form.getByRole("button", { name: /Enregistrer la bannière/ }).click();
    await expect(page.getByRole("status").filter({ hasText: "Bannière enregistrée" })).toBeVisible();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Vision de la collection Audit");
    const hero = await db.banner.findUnique({ where: { key: "home-hero" } });
    expect(hero!.imageUrl).toMatch(/^\/api\/media\//);
    const heroImage = page.locator("main img").first();
    await expect(heroImage).toBeVisible();
    expect(decodeURIComponent(await heroImage.getAttribute("src") ?? "")).toContain(hero!.imageUrl);
    const uploadedUrl = hero!.imageUrl!;
    const uploadedId = uploadedUrl.match(/[a-f0-9]{32}/)![0];
    expect(await db.publicMediaObject.findUnique({ where: { id: uploadedId }, select: { id: true } })).not.toBeNull();
    expect((await page.request.get(uploadedUrl)).headers()["content-type"]).toBe("image/webp");

    await page.goto(`/admin/contenu?onglet=bannieres&modifier=${original!.id}`);
    const replaceForm = page.locator('form:has(input[name="key"][value="home-hero"])');
    await replaceForm.locator('input[name="title"]').fill(original!.title);
    await replaceForm.locator('input[name="imageUrl"]').fill(original!.imageUrl ?? "");
    await replaceForm.getByRole("button", { name: /Enregistrer la bannière/ }).click();
    await expect(page.getByRole("status").filter({ hasText: "Bannière enregistrée" })).toBeVisible();
    expect(await db.publicMediaObject.findUnique({ where: { id: uploadedId }, select: { id: true } })).toBeNull();
    expect((await page.request.get(uploadedUrl)).status()).toBe(404);
    await db.banner.update({ where: { id: original!.id }, data: { title: original!.title, imageUrl: original!.imageUrl } });
  });

  test("boutique : contact public synchronisé avec les paramètres", async ({ page }) => {
    const original = await db.setting.findUnique({ where: { key: "store.phone" } });
    await page.goto("/admin/parametres");
    await page.locator('input[name="store.phone"]').fill("+212 522 91 82 73");
    await page.getByRole("button", { name: "Enregistrer les réglages" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Réglages enregistrés" })).toBeVisible();
    await page.goto("/contact");
    await expect(page.getByText("+212 522 91 82 73").first()).toBeVisible();
    if (original) await db.setting.update({ where: { key: "store.phone" }, data: { value: original.value } });
  });

  test("CMS : masquage et réaffichage de la sélection sur l'accueil", async ({ page }) => {
    await page.goto("/admin/parametres");
    const visible = page.locator('input[name="home.featured_visible"]');
    await expect(visible).toBeChecked();
    await visible.uncheck();
    await page.getByRole("button", { name: "Enregistrer les réglages" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Réglages enregistrés" })).toBeVisible();
    await page.goto("/");
    await expect(page.locator("section#catalogue")).toHaveCount(0);
    await page.goto("/admin/parametres");
    await page.locator('input[name="home.featured_visible"]').check();
    await page.getByRole("button", { name: "Enregistrer les réglages" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Réglages enregistrés" })).toBeVisible();
    await page.goto("/");
    await expect(page.locator("section#catalogue")).toBeVisible();
  });
});

test.describe("Administration : conservation des données historiques", () => {
  test.use({ storageState: ADMIN_STATE });

  test("les anciennes données client restent dans les commandes sans espace client", async ({ page }) => {
    const customer = await db.user.findFirst({ where: { role: { name: "Client" }, orders: { some: {} } }, include: { orders: true } });
    expect(customer).not.toBeNull();
    expect(customer!.orders.length).toBeGreaterThan(0);
    await page.goto(`/admin/commandes/${customer!.orders[0]!.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(customer!.orders[0]!.reference);
    await page.goto("/compte");
    await page.waitForURL("**/");
  });
});
