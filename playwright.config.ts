import { defineConfig, devices } from "@playwright/test";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");

loadEnvConfig(process.cwd());

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

/**
 * Configuration E2E.
 *
 * Les tests s'exécutent en série (`workers: 1`) car ils partagent la même base
 * PostgreSQL de démonstration : le stock et les commandes créées par un test
 * doivent être restaurés avant le suivant.
 *
 * Playwright construit l'application puis démarre `next start` sur le port 3100.
 * Le serveur est arrêté à la fin de la campagne ; les limites de débit en
 * mémoire repartent donc de zéro à chaque exécution.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
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
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: "chromium",
      dependencies: ["setup"],
      testIgnore: /auth\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    // Le serveur de production évite le rechargement à chaud de `next dev`
    // pendant l'écriture des traces Playwright et se rapproche du runtime réel.
    command: `npm run build && npm run start -- --port ${port}`,
    url: baseURL,
    // Allows an already-verified isolated production server (and build output)
    // to be reused without rebuilding Prisma artifacts while a dev server is
    // holding the Windows query-engine DLL. Defaults to the original lifecycle.
    reuseExistingServer: process.env.PLAYWRIGHT_USE_EXISTING_SERVER === "1",
    timeout: 600_000,
    env: {
      APP_ENVIRONMENT: "test",
      NEXT_PUBLIC_SITE_URL: baseURL,
      OWNER_EMAIL: process.env.OWNER_EMAIL ?? process.env.SEED_ADMIN_EMAIL ?? "admin@agharas.local",
    },
  },
});
