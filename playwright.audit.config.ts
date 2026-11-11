import { defineConfig, devices } from "@playwright/test";

/**
 * Configuration d'audit fonctionnel (acceptation pré-production).
 *
 * Distincte de `playwright.config.ts` : elle ne construit pas l'application et
 * ne démarre aucun serveur. Elle cible une instance déjà lancée par l'auditeur
 * (par défaut `next start` sur le port 3100) connectée à une base dédiée.
 *
 * Aucun test de ce dossier n'est exécuté par `npm run test:e2e`.
 */
const baseURL = process.env.AUDIT_BASE_URL ?? "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/audit",
  globalSetup: "./tests/audit/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [["list"], ["html", { open: "never", outputFolder: "audit-report" }]],
  use: {
    baseURL,
    locale: "fr-MA",
    timezoneId: "Africa/Casablanca",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "audit",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
});
