import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { test as setup, expect } from "@playwright/test";
import { SEED } from "./helpers";

const authDir = path.join(path.dirname(fileURLToPath(import.meta.url)), ".auth");

async function signIn(
  page: import("@playwright/test").Page,
  email: string,
  password: string,
) {
  await page.goto("/connexion");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /Se connecter/ }).click();
  await page.waitForURL("**/admin**");
  await expect(
    page.getByRole("heading", { level: 1, name: "Tableau de bord" }),
  ).toBeVisible();
}

setup.beforeAll(() => {
  fs.mkdirSync(authDir, { recursive: true });
});

setup("session administrateur de démonstration", async ({ page }) => {
  if (!SEED.adminPassword) throw new Error("SEED_ADMIN_PASSWORD requis pour les tests E2E.");
  await signIn(page, SEED.adminEmail, SEED.adminPassword);
  await page.context().storageState({ path: path.join(authDir, "admin.json") });
});
