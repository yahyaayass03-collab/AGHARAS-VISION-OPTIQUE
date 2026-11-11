import { expect, test } from "@playwright/test";
import {
  acceptTerms,
  chooseShipping,
  db,
  fillCheckoutIdentity,
  uniqueEmail,
  waitForConfirmation,
} from "./helpers";

const PRODUCT_SLUG = "le-marais-n04-or-pur";

test.describe.configure({ mode: "serial" });

test.describe("Parcours d'achat client (base dédiée)", () => {
  test("invité : monture + verres unifocaux + ordonnance manuelle + COD", async ({ page }) => {
    const email = uniqueEmail("audit.guest");
    const product = await db.product.findUnique({
      where: { slug: PRODUCT_SLUG },
      include: { variants: { where: { isActive: true }, orderBy: { sortOrder: "asc" }, include: { inventory: true } } },
    });
    expect(product, "produit de démonstration introuvable").not.toBeNull();

    const variant = product!.variants[0]!;
    const stockBefore = variant.inventory!.quantity;
    expect(stockBefore).toBeGreaterThan(0);
    const cartItemsBefore = await db.cartItem.count();

    const [singleVision, index160, blueProtect, antiReflet] = await Promise.all([
      db.lensType.findFirst({ where: { kind: "SINGLE_VISION", isActive: true } }),
      db.lensIndex.findFirst({ where: { value: "1.60" } }),
      db.lensTreatment.findFirst({ where: { name: { contains: "BlueProtect" } } }),
      db.lensTreatment.findFirst({ where: { isDefault: true } }),
    ]);
    expect(singleVision && index160 && blueProtect && antiReflet).toBeTruthy();

    // 1. Accueil -> catalogue -> fiche produit
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();
    await page.goto("/catalogue");
    await page.locator(`a[href="/produit/${PRODUCT_SLUG}"]`).first().click();
    await page.waitForURL(`**/produit/${PRODUCT_SLUG}`);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Le Marais");

    // 2. Choix du coloris
    await page.locator('button[aria-label]').filter({ has: page.locator("span") }).first().click();

    // 3. Configurateur de verres
    await page.getByRole("link", { name: /Configurer mes verres/ }).click();
    await page.waitForURL(`**/configurateur/${PRODUCT_SLUG}**`);

    await page.getByRole("button", { name: "Verres & traitements", exact: true }).click();
    await expect(page.getByText(/progressif/i)).toHaveCount(0);
    await expect(page.locator('#rightAdd, #leftAdd, #pupillaryDistance, [name="rightAdd"], [name="leftAdd"], [name="pupillaryDistance"]')).toHaveCount(0);
    await expect(page.getByText(/Addition|\bADD\b|EP\s*\(mm\)/i)).toHaveCount(0);
    await page.locator(`input[name="lensTypeId"][value="${singleVision!.id}"]`).check({ force: true });
    await page.locator(`input[name="lensIndexId"][value="${index160!.id}"]`).check({ force: true });
    await page.locator(`input[name="treatmentIds"][value="${blueProtect!.id}"]`).check({ force: true });
    await page.getByRole("button", { name: /^Ordonnance/ }).click();
    await page.getByRole("button", { name: /Saisir les mesures/ }).click();

    // 4. Ordonnance saisie manuellement
    await page.locator("#rightSphere").fill("-25");
    await page.locator("#rightCylinder").fill("-4");
    await page.locator("#rightAxis").fill("240");
    await page.locator("#leftSphere").fill("8");
    await page.locator("#leftCylinder").fill("-0.5");
    await page.locator("#leftAxis").fill("-10");
    await page.locator("#customerNote").fill("Audit pre-production : commande synthetique.");
    await page.getByRole("button", { name: /^Récapitulatif/ }).click();
    await expect(page.getByText(/Les mesures saisies sont déclarées par le client/).last()).toBeVisible();

    // 5. Récapitulatif : le total affiché doit être calculé côté serveur-identique
    const expectedLens = singleVision!.priceCents + index160!.priceCents + blueProtect!.priceCents + antiReflet!.priceCents;
    const expectedTotal = product!.priceCents + expectedLens;
    const submit = page.getByRole("button", { name: /Ajouter au panier/ });
    await expect(submit).toContainText("DH");
    await submit.click();

    // 6. Panier
    await page.waitForURL("**/panier");
    await expect(page.locator("body")).toContainText("unifocaux", { ignoreCase: true });

    // 7. Commande
    await page.locator('a[href="/commande"]').last().click();
    await page.waitForURL("**/commande");
    await fillCheckoutIdentity(page, {
      firstName: "Amine",
      lastName: "Audit",
      email,
    });
    await chooseShipping(page, "standard");
    await acceptTerms(page);
    await page.getByRole("button", { name: /Confirmer ma commande/ }).click();

    const reference = await waitForConfirmation(page);
    expect(reference).toMatch(/^AVO-2026-/);

    // Confirmation refresh must remain read-only and must not create a second order.
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "Merci pour votre commande" }),
    ).toBeVisible();
    await expect(page.getByText(reference).first()).toBeVisible();
    expect(await db.order.count({ where: { email } })).toBe(1);

    // 8. Vérification en base
    const order = await db.order.findUnique({
      where: { reference },
      include: { items: true, payments: true, shipments: true, history: true },
    });
    expect(order, "commande absente de la base").not.toBeNull();
    expect(order!.email).toBe(email);
    expect(order!.status).toBe("PENDING");
    expect(order!.subtotalCents).toBe(expectedTotal);
    expect(order!.shippingCents).toBe(0); // franco de port (> 80 000 centimes)
    expect(order!.discountCents).toBe(0);
    expect(order!.totalCents).toBe(expectedTotal);
    expect(order!.paymentMethod).toBe("CASH_ON_DELIVERY");
    expect(order!.items).toHaveLength(1);
    expect(order!.payments).toHaveLength(1);
    expect(order!.payments[0]!.method).toBe("CASH_ON_DELIVERY");
    expect(order!.payments[0]!.status).toBe("PENDING");
    expect(order!.shipments).toHaveLength(1);
    expect(order!.history).toHaveLength(1);

    const item = order!.items[0]!;
    expect(item.unitPriceCents).toBe(product!.priceCents);
    expect(item.lensPriceCents).toBe(expectedLens);
    expect(item.quantity).toBe(1);
    expect(item.configuration).toBeTruthy();
    const snapshot = item.configuration as Record<string, unknown>;
    expect(JSON.stringify(snapshot)).toContain("1.60");
    expect(item.prescriptionId, "ordonnance non rattachée à la ligne").not.toBeNull();

    const prescription = await db.prescription.findUnique({ where: { id: item.prescriptionId! } });
    expect(prescription).not.toBeNull();
    expect(prescription!.method).toBe("MANUAL");
    expect(prescription!.status).toBe("PENDING");
    expect(Number(prescription!.rightSphere)).toBe(-25);
    expect(Number(prescription!.rightCylinder)).toBe(-4);
    expect(Number(prescription!.rightAxis)).toBe(240);
    expect(Number(prescription!.leftSphere)).toBe(8);
    expect(Number(prescription!.leftAxis)).toBe(-10);
    expect(prescription!.pupillaryDistance).toBeNull();
    expect(prescription!.rightAdd).toBeNull();
    expect(prescription!.leftAdd).toBeNull();
    expect(prescription!.userId, "invité : ordonnance sans propriétaire (limite connue)").toBeNull();

    // 9. Stock décrémenté de 1, panier vidé
    const inventoryAfter = await db.inventoryItem.findUnique({ where: { variantId: variant.id } });
    expect(inventoryAfter!.quantity).toBe(stockBefore - 1);
    const movements = await db.inventoryMovement.findMany({
      where: { variantId: variant.id, reason: "SALE" },
    });
    expect(movements.length).toBeGreaterThan(0);
    const cartItems = await db.cartItem.count();
    expect(cartItems, "panier consommé par la commande").toBe(cartItemsBefore);
  });

  test("invité : ajout monture seule puis tentative de falsification du prix", async ({ page }) => {
    const email = uniqueEmail("audit.tamper");
    const product = await db.product.findUnique({ where: { slug: PRODUCT_SLUG } });
    expect(product).not.toBeNull();

    await page.goto(`/produit/${PRODUCT_SLUG}`);
    await page.getByRole("button", { name: /Ajouter la monture seule/ }).click();
    await page.waitForURL("**/panier");
    await page.goto("/commande");

    await fillCheckoutIdentity(page, { firstName: "Samir", lastName: "Tamper", email });
    await chooseShipping(page, "standard");
    await acceptTerms(page);

    // Injection de champs de prix forgés : le serveur doit les ignorer.
    await page.evaluate(() => {
      const form = document.querySelector("#firstName")!.closest("form") as HTMLFormElement;
      for (const name of ["totalCents", "subtotalCents", "shippingCents", "discountCents", "unitPriceCents"]) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = "1";
        form.appendChild(input);
      }
    });

    await page.getByRole("button", { name: /Confirmer ma commande/ }).click();
    const reference = await waitForConfirmation(page);
    const order = await db.order.findUnique({ where: { reference }, include: { items: true } });
    expect(order).not.toBeNull();
    expect(order!.totalCents).toBe(product!.priceCents);
    expect(order!.subtotalCents).toBe(product!.priceCents);
    expect(order!.items[0]!.unitPriceCents).toBe(product!.priceCents);
  });

  test("saisie invalide : aucun enregistrement créé", async ({ page }) => {
    const email = uniqueEmail("audit.invalid");
    const before = await db.order.count();
    const notificationsBefore = await db.orderEmailNotification.count();

    await page.goto(`/produit/${PRODUCT_SLUG}`);
    await page.getByRole("button", { name: /Ajouter la monture seule/ }).click();
    await page.waitForURL("**/panier");
    await page.goto("/commande");

    // Formulaire volontairement incomplet (e-mail invalide, téléphone invalide, CGV refusées)
    await page.locator("#firstName").fill("A");
    await page.locator("#lastName").fill("B");
    await page.locator("#phone").fill("12");
    await page.locator("#email").fill("pas-un-email");
    await page.locator("#addressLine1").fill("x");
    // Contourne la validation native du navigateur pour éprouver la validation serveur.
    await page.evaluate(() => {
      document.querySelector("#firstName")!.closest("form")!.setAttribute("novalidate", "");
    });
    await page.getByRole("button", { name: /Confirmer ma commande/ }).click();

    await expect(page.locator(".field-error-text").first()).toBeVisible();
    await expect(page).toHaveURL(/\/commande$/);
    const after = await db.order.count();
    expect(after).toBe(before);
    expect(await db.order.count({ where: { email } })).toBe(0);
    expect(await db.orderEmailNotification.count()).toBe(notificationsBefore);
  });

  test("double soumission simultanée : une seule commande créée", async ({ page, context }) => {
    const email = uniqueEmail("audit.duplicate");
    const before = await db.order.count();

    await page.goto(`/produit/${PRODUCT_SLUG}`);
    await page.getByRole("button", { name: /Ajouter la monture seule/ }).click();
    await page.waitForURL("**/panier");

    const second = await context.newPage();
    await page.goto("/commande");
    await second.goto("/commande");

    for (const target of [page, second]) {
      await fillCheckoutIdentity(target, { firstName: "Nadia", lastName: "Double", email });
      await chooseShipping(target, "standard");
      await acceptTerms(target);
    }

    await page.getByRole("button", { name: /Confirmer ma commande/ }).click();
    await waitForConfirmation(page);

    // La seconde page soumet un formulaire périmé (panier déjà consommé)
    await second.getByRole("button", { name: /Confirmer ma commande/ }).click();
    await second.waitForTimeout(4000);

    const after = await db.order.count();
    expect(after, "une seule commande doit être créée").toBe(before + 1);
    expect(await db.order.count({ where: { email } })).toBe(1);
    const committed = await db.order.findFirst({ where: { email }, orderBy: { createdAt: "desc" } });
    const notifications = await db.orderEmailNotification.findMany({ where: { orderId: committed!.id } });
    expect(notifications, "une seule notification propriétaire doit être créée pour le même idempotency key").toHaveLength(1);
    expect(notifications[0]!.kind).toBe("OWNER_ORDER");
    expect(notifications[0]!.status).toBe("DISCARDED");
    expect(notifications[0]!.attempts).toBe(1);
  });
});
