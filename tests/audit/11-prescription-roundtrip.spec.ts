import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { db, fillCheckoutIdentity, chooseShipping, acceptTerms, uniqueEmail, waitForConfirmation } from "./helpers";
import { opticalSignature } from "../../src/lib/optical-compatibility";

const ADMIN_STATE = path.join(import.meta.dirname, ".auth", "admin.json");
const STAMP = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;

test("ordonnance synthétique : upload privé, achat invité COD et récupération propriétaire", async ({ page, browser }) => {
  let oversizedPath: string | undefined;
  const category = await db.category.findFirstOrThrow({ where: { isActive: true } });
  const brand = await db.brand.findFirstOrThrow({ where: { isActive: true } });
  const defaultTreatments = await db.lensTreatment.findMany({ where: { isDefault: true } });
  const [lensType, lensIndex, treatment] = await Promise.all([
    db.lensType.create({ data: { slug: `test-only-single-${STAMP}`, name: `TEST ONLY unifocal ${STAMP}`, description: "Option synthétique isolée — sans usage optique réel", kind: "SINGLE_VISION", priceCents: 12000, productTypes: ["OPTICAL"] } }),
    db.lensIndex.create({ data: { slug: `test-only-index-${STAMP}`, name: `TEST ONLY Index ${STAMP}`, value: `9.${String(Date.now()).slice(-2)}`, priceCents: 3000 } }),
    db.lensTreatment.create({ data: { slug: `test-only-treatment-${STAMP}`, name: `TEST ONLY Traitement ${STAMP}`, description: "Option synthétique isolée", priceCents: 1000 } }),
  ]);
  const product = await db.product.create({
    data: {
      slug: `test-only-frame-${STAMP}`,
      name: `TEST ONLY Monture ${STAMP}`,
      description: "Monture synthétique réservée aux tests isolés.",
      brandId: brand.id,
      categoryId: category.id,
      type: "OPTICAL",
      gender: "MIXTE",
      sku: `TEST-FRAME-${STAMP}`,
      priceCents: 25000,
      isActive: true,
      lensCompatible: true,
      variants: { create: { sku: `TEST-VARIANT-${STAMP}`, colorName: "TEST ONLY Noir", colorHex: "#222222", inventory: { create: { quantity: 3, lowStockThreshold: 1 } } } },
    },
    include: { variants: { include: { inventory: true } } },
  });
  const variant = product.variants[0]!;
  const initialStock = variant.inventory!.quantity;
  const initialMovementCount = await db.inventoryMovement.count({ where: { variantId: variant.id } });
  const initialOrderCount = await db.order.count();
  const initialPrescriptionCount = await db.prescription.count();
  const combination = { productId: product.id, variantId: variant.id, lensTypeId: lensType.id, lensIndexId: lensIndex.id, treatmentIds: [treatment.id] };
  const signature = opticalSignature(combination);

  await page.goto(`/configurateur/${product.slug}`);
  await page.getByRole("button", { name: "Verres & traitements", exact: true }).click();
  await page.locator(`input[name="lensTypeId"][value="${lensType.id}"]`).check({ force: true });
  await page.locator(`input[name="lensIndexId"][value="${lensIndex.id}"]`).check({ force: true });
  for (const entry of defaultTreatments) {
    const input = page.locator(`input[name="treatmentIds"][value="${entry.id}"]`);
    if (await input.isChecked()) await input.uncheck({ force: true });
  }
  const initialSyntheticTreatment = page.locator(`input[name="treatmentIds"][value="${treatment.id}"]`);
  if (!(await initialSyntheticTreatment.isChecked())) await initialSyntheticTreatment.check({ force: true });
  await expect(page.getByRole("status")).toContainText("en attente");
  await page.getByRole("button", { name: /^Ordonnance/ }).click();
  await page.getByRole("button", { name: /Saisir les mesures/ }).click();
  await page.locator("#rightSphere").fill("-1");
  await page.locator("#leftSphere").fill("-1");
  await page.getByRole("button", { name: /^Récapitulatif/ }).click();
  await expect(page.getByRole("status")).toContainText("en attente");
  await expect(page.getByRole("button", { name: /Ajouter au panier/ })).toBeVisible();
  expect(await db.order.count()).toBe(initialOrderCount);

  // This exact synthetic-only rule uses the production decision data model but
  // is isolated to this synthetic schema; it is not a real professional approval.
  const decision = await db.opticalCompatibilityRule.create({
    data: {
      ...combination,
      signature,
      status: "APPROVED",
      reviewer: "TEST ONLY — NOT A PROFESSIONAL APPROVAL",
      reviewedAt: new Date("2026-11-05T12:00:00Z"),
      evidence: "TEST ONLY synthetic fixture; no clinical or business decision",
      actorEmail: "audit.admin@audit.local",
    },
  });
  expect(decision.status).toBe("APPROVED");
  expect(decision.reviewer).toContain("TEST ONLY");

  const ownerContext = await browser.newContext({ storageState: ADMIN_STATE, baseURL: test.info().project.use.baseURL });
  const owner = await ownerContext.newPage();
  try {
    await page.goto(`/configurateur/${product.slug}`);
    await page.getByRole("button", { name: "Verres & traitements", exact: true }).click();
    await page.locator(`input[name="lensTypeId"][value="${lensType.id}"]`).check({ force: true });
    await page.locator(`input[name="lensIndexId"][value="${lensIndex.id}"]`).check({ force: true });
    for (const entry of defaultTreatments) {
      const input = page.locator(`input[name="treatmentIds"][value="${entry.id}"]`);
      if (await input.isChecked()) await input.uncheck({ force: true });
    }
    const configuredTreatment = page.locator(`input[name="treatmentIds"][value="${treatment.id}"]`);
    if (!(await configuredTreatment.isChecked())) await configuredTreatment.check({ force: true });
    await expect(page.getByRole("status")).toContainText("enregistrée comme validée");
    await page.getByRole("button", { name: /^Ordonnance/ }).click();
    await page.getByRole("button", { name: /Téléverser/ }).click();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({ name: "not-a-prescription.txt", mimeType: "text/plain", buffer: Buffer.from("synthetic invalid type") });
    await expect(page.getByRole("alert").filter({ hasText: "Format non accepté" })).toBeVisible();
    expect(await db.prescription.count()).toBe(initialPrescriptionCount);
    oversizedPath = path.join(process.env.TEMP ?? process.env.TMP ?? process.cwd(), `TEST-ONLY-too-large-${STAMP}.pdf`);
    const oversizedFile = await fs.open(oversizedPath, "w");
    try {
      await oversizedFile.truncate(10 * 1024 * 1024 + 1);
    } finally {
      await oversizedFile.close();
    }
    await fileInput.setInputFiles(oversizedPath);
    await expect(page.getByRole("alert").filter({ hasText: "dépasse la limite" })).toBeVisible();
    expect(await db.prescription.count()).toBe(initialPrescriptionCount);

    const pdf = Buffer.from("%PDF-1.4\nTEST ONLY synthetic prescription\n%%EOF\n");
    await fileInput.setInputFiles({ name: "TEST-ONLY-ordonnance.pdf", mimeType: "application/pdf", buffer: pdf });
    await expect(page.getByText("TEST-ONLY-ordonnance.pdf", { exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Récapitulatif", exact: true }).click();
    await page.getByRole("button", { name: /Ajouter au panier/ }).click();
    await page.waitForURL("**/panier");
    await page.locator('a[href="/commande"]').last().click();
    await page.waitForURL("**/commande");
    const email = uniqueEmail("test-only-prescription");
    await fillCheckoutIdentity(page, { firstName: "Test", lastName: "Only", email });
    await chooseShipping(page, "standard");
    await acceptTerms(page);
    await page.getByRole("button", { name: /Confirmer ma commande/ }).click();
    const reference = await waitForConfirmation(page);

    const order = await db.order.findUniqueOrThrow({ where: { reference }, include: { items: true } });
    expect(await db.order.count()).toBe(initialOrderCount + 1);
    expect(order.items).toHaveLength(1);
    expect(order.paymentMethod).toBe("CASH_ON_DELIVERY");
    const prescriptionId = order.items[0]!.prescriptionId;
    expect(prescriptionId).toBeTruthy();
    const prescription = await db.prescription.findUniqueOrThrow({ where: { id: prescriptionId! } });
    expect(prescription.originalFileName).toBe("TEST-ONLY-ordonnance.pdf");
    expect(prescription.fileMime).toBe("application/pdf");
    expect(prescription.fileSize).toBe(pdf.length);
    expect(prescription.filePath).toMatch(/^fs:\/\/prescriptions\/[A-Za-z0-9._-]+$/);
    expect(prescription.filePath).not.toMatch(/^https?:/i);
    expect(prescription.filePath).not.toContain("public");
    expect(await db.inventoryItem.findUniqueOrThrow({ where: { variantId: variant.id } }).then((stock) => stock.quantity)).toBe(initialStock - 1);
    const movements = await db.inventoryMovement.findMany({ where: { variantId: variant.id }, orderBy: { createdAt: "asc" } });
    expect(movements).toHaveLength(initialMovementCount + 1);
    expect(movements.at(-1)?.delta).toBe(-1);
    expect(movements.at(-1)?.reason).toBe("SALE");

    const pageText = await page.locator("body").innerText();
    expect(pageText).not.toContain(prescription.filePath!);
    expect(pageText).not.toContain(`/api/ordonnances/${prescription.id}`);
    const publicAttempt = await page.request.get(`/api/media/${encodeURIComponent(prescription.filePath!)}`, { failOnStatusCode: false });
    expect(publicAttempt.status()).toBe(404);
    const anonymousAttempt = await page.request.get(`/api/ordonnances/${prescription.id}`, { failOnStatusCode: false });
    expect(anonymousAttempt.status()).toBe(401);
    const ownerResponse = await owner.request.get(`/api/ordonnances/${prescription.id}`);
    expect(ownerResponse.status()).toBe(200);
    expect(ownerResponse.headers()["content-type"]).toContain("application/pdf");
    expect(ownerResponse.headers()["cache-control"]).toContain("no-store");
    expect(Buffer.from(await ownerResponse.body()).equals(pdf)).toBe(true);

    const ownerNotification = await db.orderEmailNotification.findFirstOrThrow({ where: { orderId: order.id, kind: "OWNER_ORDER" } });
    expect(ownerNotification.status).toBe("DISCARDED");
    await db.orderEmailNotification.update({ where: { id: ownerNotification.id }, data: { status: "FAILED", attempts: 1, lastErrorCode: "TEST_ONLY_RETRY_FIXTURE" } });
    await owner.goto(`/admin/commandes/${order.id}`);
    await expect(owner.getByText(/Échec \(TEST_ONLY_RETRY_FIXTURE\)/)).toBeVisible();
    await owner.getByRole("button", { name: "Réessayer les notifications en échec" }).click();
    await expect.poll(async () => (await db.orderEmailNotification.findUniqueOrThrow({ where: { id: ownerNotification.id } })).status).toBe("DISCARDED");
    const retriedNotification = await db.orderEmailNotification.findUniqueOrThrow({ where: { id: ownerNotification.id } });
    expect(retriedNotification.attempts).toBe(2);
    expect(await db.auditLog.count({ where: { entityType: "Order", entityId: order.id, action: "order.email.retry" } })).toBe(1);

  } finally {
    if (oversizedPath) await fs.rm(oversizedPath, { force: true });
    await Promise.all([
      db.product.update({ where: { id: product.id }, data: { isActive: false } }),
      db.lensType.update({ where: { id: lensType.id }, data: { isActive: false } }),
      db.lensIndex.update({ where: { id: lensIndex.id }, data: { isActive: false } }),
      db.lensTreatment.update({ where: { id: treatment.id }, data: { isActive: false } }),
    ]);
    await ownerContext.close();
  }
});
