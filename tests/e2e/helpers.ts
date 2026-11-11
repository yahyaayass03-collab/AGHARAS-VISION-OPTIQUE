import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");
const directory = path.dirname(fileURLToPath(import.meta.url));

loadEnvConfig(process.cwd());

/** États de session produits par `auth.setup.ts`. */
export const AUTH = {
  admin: path.join(directory, ".auth", "admin.json"),
} as const;

export const SEED = {
  adminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@agharas.local",
  adminPassword: process.env.SEED_ADMIN_PASSWORD ?? "",
} as const;
