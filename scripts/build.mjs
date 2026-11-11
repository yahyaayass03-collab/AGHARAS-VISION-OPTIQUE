import { execFileSync } from "node:child_process";
import path from "node:path";

const [major, minor] = process.versions.node.split(".").map(Number);
if (!((major === 22 && minor >= 23) || major === 23)) {
  console.error(JSON.stringify({ event: "build.rejected", reason: "requires_node_22_23_or_newer", node: process.versions.node }));
  process.exit(2);
}

// Prisma Client generation needs a syntactically valid datasource URL but does
// not connect to a database. Keep client generation independent of MariaDB and
// do not persist or use this local-only placeholder for runtime operations.
process.env.DATABASE_URL ??= "mysql://build:build@127.0.0.1:3306/agharas_build";
process.env.NEXT_TELEMETRY_DISABLED = "1";

const nodeModules = path.join(process.cwd(), "node_modules");
for (const args of [
  [path.join(nodeModules, "prisma", "build", "index.js"), "generate"],
  [path.join(nodeModules, "next", "dist", "bin", "next"), "build"],
]) {
  execFileSync(process.execPath, args, { cwd: process.cwd(), env: process.env, stdio: "inherit", windowsHide: true });
}
