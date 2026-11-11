import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { chromium } from "@playwright/test";
import { ACCOUNT_ROLES, ACCOUNTS, AUDIT_DB_URL, db } from "./helpers";
import { opticalSignature } from "../../src/lib/optical-compatibility";

/**
 * Préparation de la campagne d'audit :
 *  - crée (ou réinitialise) trois comptes synthétiques dédiés aux rôles
 *    Super Administrateur / Opticien / Client ;
 *  - ouvre une session par compte et enregistre l'état de stockage
   *    (`tests/audit/.auth/admin.json`) réutilisé par les specs.
 *
 * Les comptes de démonstration ne sont pas utilisés afin que les tests soient
 * rejouables sans être bloqués par la limitation de tentatives de connexion.
 */
export default async function globalSetup(): Promise<void> {
  const testUrl = new URL(AUDIT_DB_URL);
  if (testUrl.pathname !== "/agharas_mariadb_test" || !["localhost", "127.0.0.1", "::1", "[::1]"].includes(testUrl.hostname)) {
    throw new Error("L'audit exige exclusivement la base MariaDB synthétique locale agharas_mariadb_test.");
  }
  const identity = await db.$queryRaw<Array<{ database: string | null; version: string }>>`
    SELECT DATABASE() AS database, VERSION() AS version
  `;
  if (identity[0]?.database !== "agharas_mariadb_test" || !identity[0]?.version.includes("MariaDB")) {
    throw new Error("L'audit est bloqué : l'identité serveur n'est pas la MariaDB de test autorisée.");
  }
  const baseURL = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3100";
  const dir = path.join(import.meta.dirname, ".auth");
  fs.mkdirSync(dir, { recursive: true });

  const passwordHash = await bcrypt.hash(ACCOUNTS.admin.password, 10);

  for (const key of ["admin", "staff", "client"] as const) {
    const account = ACCOUNTS[key];
    const role = await db.role.findFirst({ where: { name: ACCOUNT_ROLES[key] } });
    if (!role) {
      throw new Error(`Rôle système introuvable : ${ACCOUNT_ROLES[key]}`);
    }
    await db.user.upsert({
      where: { email: account.email },
      update: { passwordHash, isActive: true, roleId: role.id },
      create: {
        email: account.email,
        passwordHash,
        firstName: "Audit",
        lastName: key,
        roleId: role.id,
      },
    });
  }

  // Decisions synthetic and confined to this isolated test schema; never infer
  // approval from existing business records or insert these via the demo seed.
  const [lens, index, defaultTreatment, blue, products] = await Promise.all([
    db.lensType.findFirstOrThrow({ where: { kind: "SINGLE_VISION", isActive: true } }),
    db.lensIndex.findFirstOrThrow({ where: { value: "1.60" } }),
    db.lensTreatment.findFirstOrThrow({ where: { isDefault: true } }),
    db.lensTreatment.findFirstOrThrow({ where: { name: { contains: "BlueProtect" } } }),
    db.product.findMany({ where: { slug: { in: ["le-marais-n04-or-pur", "titane-minimaliste-noir-mat"] } }, include: { variants: true } }),
  ]);
  for (const product of products) for (const variant of product.variants) {
    for (const treatmentIds of [[defaultTreatment.id], [defaultTreatment.id, blue.id]]) {
      const data = { productId: product.id, variantId: variant.id, lensTypeId: lens.id, lensIndexId: index.id, treatmentIds: treatmentIds.sort() };
      const signature = opticalSignature(data);
      await db.opticalCompatibilityRule.upsert({
        where: { signature },
        create: { ...data, signature, status: "APPROVED", reviewer: "TEST ONLY — NOT A PROFESSIONAL APPROVAL", reviewedAt: new Date("2026-01-01T12:00:00Z"), evidence: "Test-only fixture for isolated browser automation; no clinical or business decision.", actorEmail: ACCOUNTS.admin.email },
        update: {},
      });
    }
  }

  const browser = await chromium.launch();
  try {
    for (const key of ["admin"] as const) {
      const account = ACCOUNTS[key];
      const context = await browser.newContext({ baseURL, locale: "fr-MA" });
      const page = await context.newPage();
      await page.goto("/connexion");
      await page.locator('input[name="email"]').fill(account.email);
      await page.locator('input[name="password"]').fill(account.password);
      await page.getByRole("button", { name: /Se connecter/ }).click();
      await page.waitForURL((url) => !url.pathname.startsWith("/connexion"), {
        timeout: 40_000,
      });
      await context.storageState({ path: path.join(dir, `${key}.json`) });
      await context.close();
    }
  } finally {
    await browser.close();
    await db.$disconnect();
  }
}
