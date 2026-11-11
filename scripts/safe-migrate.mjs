import { spawn } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { verifyMigrationIntent } from "./migration-safety.mjs";

const intent = verifyMigrationIntent(process.env);
if (!intent.ok) {
  console.error(JSON.stringify({ event: "migration.guard.rejected", ...intent }));
  process.exit(2);
}

const prisma = new PrismaClient();
try {
  const identity = await prisma.$queryRaw`SELECT DATABASE() AS database`;
  const actual = identity[0];
  const identityGuard = verifyMigrationIntent(process.env, actual);
  if (!identityGuard.ok) {
    console.error(JSON.stringify({ event: "migration.guard.rejected", ...identityGuard }));
    process.exitCode = 2;
  } else {
    console.log(JSON.stringify({ event: "migration.guard.verified", database: actual.database }));
    const deployment = await runPrismaDeploy();
    if (deployment.code !== 0) process.exitCode = deployment.code;
  }
} catch {
  console.error(JSON.stringify({ event: "migration.guard.failed", reason: "database_identity_or_migration_check_failed" }));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

function runPrismaDeploy() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", () => resolve({ code: 1 }));
    child.once("exit", (code) => resolve({ code: code ?? 1 }));
  });
}
