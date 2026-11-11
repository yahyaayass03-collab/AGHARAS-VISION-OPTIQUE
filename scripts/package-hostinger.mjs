import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { zipSync } from "fflate";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.resolve(root, process.argv[2] ?? "dist/hostinger-business-package.zip");
const distRoot = path.join(root, "dist");
if (!output.startsWith(`${distRoot}${path.sep}`)) throw new Error("Output ZIP must be inside the repository's ignored dist/ directory.");

const entries = {};
async function addFile(relative) {
  const absolute = path.join(root, relative);
  try {
    if (!(await stat(absolute)).isFile()) return;
  } catch { return; }
  if (/(^|[\\/])(?:\.git|node_modules|storage|artifacts|test-results|playwright-report|\.next[^\\/]*|pics)(?:[\\/]|$)/i.test(relative) ||
      /(^|[\\/])\.env(?:$|\.(?!example(?:[\\/]|$))[^\\/]+)(?:[\\/]|$)/i.test(relative)) {
    throw new Error(`Refusing excluded/private path in package allowlist: ${relative}`);
  }
  entries[relative.split(path.sep).join("/")] = new Uint8Array(await readFile(absolute));
}

async function addTree(relative) {
  const absolute = path.join(root, relative);
  let children;
  try { children = await readdir(absolute, { withFileTypes: true }); } catch { return; }
  for (const child of children) {
    const next = path.join(relative, child.name);
    if (child.isDirectory()) {
      if ([".git", "node_modules", "storage", "artifacts", "test-results", "playwright-report"].includes(child.name) || child.name.startsWith(".next")) continue;
      await addTree(next);
    } else if (child.isFile()) {
      await addFile(next);
    }
  }
}

await addFile("package.json");
const packageJson = JSON.parse(new TextDecoder().decode(entries["package.json"]));
delete packageJson.prisma;
delete packageJson.scripts["db:push"];
delete packageJson.scripts["db:migrate"];
delete packageJson.scripts["db:seed"];
delete packageJson.scripts["db:seed:test-reset"];
delete packageJson.scripts["package:hostinger"];
entries["package.json"] = new TextEncoder().encode(`${JSON.stringify(packageJson, null, 2)}\n`);
for (const file of ["package-lock.json", "next.config.ts", "next-env.d.ts", "tsconfig.json", "postcss.config.mjs", ".npmrc", ".nvmrc", ".env.example"]) {
  await addFile(file);
}
await addTree("src");
await addTree("public");
await addFile("prisma/schema.prisma");
await addTree("prisma/migrations");
await addFile("prisma/provision-owner.ts");
await addFile("scripts/safe-migrate.mjs");
await addFile("scripts/migration-safety.mjs");
await addFile("scripts/build.mjs");
await addFile("scripts/run-email-outbox-cron.mjs");

const manifest = {
  package: "AGHARAS VISION — Hostinger Business managed Next.js app",
  node: ">=22.23 <23",
  framework: "Next.js SSR (not static export)",
  files: Object.keys(entries).sort(),
  excluded: [".env files", ".git", "node_modules", ".next*", "artifacts/screenshots/traces", "pics source archive", "storage/private uploads", "prisma/seed.ts and synthetic demo records"],
};
entries["HOSTINGER_PACKAGE_MANIFEST.json"] = new TextEncoder().encode(`${JSON.stringify(manifest, null, 2)}\n`);

const zip = zipSync(entries, { level: 6 });
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, zip, { flag: "w" });
console.log(JSON.stringify({ event: "hostinger.package.created", output: path.relative(root, output), entries: Object.keys(entries).length, bytes: zip.byteLength, containsSeedData: false }));
