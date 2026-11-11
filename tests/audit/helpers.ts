import { PrismaClient } from "@prisma/client";
import { expect, type Page } from "@playwright/test";

/**
 * Utilitaires d'audit fonctionnel.
 *
 * La base ciblée doit être une base MariaDB dédiée (`agharas_mariadb_test` par défaut), jamais
 * la base de démonstration principale.
 */
export const AUDIT_DB_URL =
  process.env.AUDIT_DATABASE_URL ??
  process.env.TEST_DATABASE_URL ??
  "mysql://agv_test:local-test-only-Agv-2026@127.0.0.1:3307/agharas_mariadb_test";

export const db = new PrismaClient({ datasources: { db: { url: AUDIT_DB_URL } } });

export const ACCOUNTS = {
  admin: { email: "audit.admin@audit.local", password: "Audit!2026#Agharas" },
  staff: { email: "audit.staff@audit.local", password: "Audit!2026#Agharas" },
  client: { email: "audit.client@audit.local", password: "Audit!2026#Agharas" },
} as const;

/** Rôles système attribués aux comptes synthétiques d'audit. */
export const ACCOUNT_ROLES = {
  admin: "Super Administrateur",
  staff: "Opticien",
  client: "Client",
} as const;

export function uniqueEmail(prefix: string): string {
  return `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@audit.local`;
}

export async function login(page: Page, email: string, password: string): Promise<void> {
  await page.goto("/connexion");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /Se connecter/ }).click();
  await page.waitForURL((url) => url.pathname.startsWith("/admin"), { timeout: 40_000 });
}

export async function fillCheckoutIdentity(
  page: Page,
  identity: { firstName: string; lastName: string; email: string; phone?: string },
): Promise<void> {
  await page.locator("#firstName").fill(identity.firstName);
  await page.locator("#lastName").fill(identity.lastName);
  await page.locator("#phone").fill(identity.phone ?? "0661234567");
  await page.locator("#email").fill(identity.email);
  await page.locator("#addressLine1").fill("12 rue de l'Audit, Résidence Preflight");
  await page.locator("#city").fill("Casablanca");
  await page.locator("#postalCode").fill("20250");
}

export async function chooseShipping(page: Page, code: string): Promise<void> {
  await page.locator(`input[name="shippingCode"][value="${code}"]`).check({ force: true });
}

export async function acceptTerms(page: Page): Promise<void> {
  const checkbox = page.locator('input[name="acceptTerms"]');
  // Clic sur le libellé, comme un utilisateur réel.
  await page.locator("label").filter({ has: checkbox }).click();
  await expect(checkbox, "la case CGV doit être cochée par un clic sur le libellé").toBeChecked();
}

/** Attend la redirection vers la page de confirmation et retourne la référence. */
export async function waitForConfirmation(page: Page): Promise<string> {
  await page.waitForURL(/\/commande\/confirmation\/AVO-/, { timeout: 60_000 });
  const match = /\/commande\/confirmation\/(AVO-\d{4}-[A-Z0-9]+)/.exec(page.url());
  expect(match, `URL de confirmation inattendue : ${page.url()}`).not.toBeNull();
  return match![1]!;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}
