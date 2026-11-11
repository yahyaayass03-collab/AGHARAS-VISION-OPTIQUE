# Production dependency security remediation — AGHARAS VISION OPTIQUE

**Date:** 5 November 2026  
**Scope:** dependency advisories reported by npm, with targeted fixes and full local synthetic-data regression. No deployment, database migration, optical decision change, payment change, or source feature work.

## Executive result

**The production audit is clean after the remediation.** Before changes, `npm audit` reported 8 affected package nodes (3 high, 5 moderate), and `npm audit --omit=dev` reported 3 high. The three high nodes were not three independent Prisma CVEs: they were one GHSA repeated through the dependency chain. After scoped dependency overrides:

| Audit | Before | After |
|---|---:|---:|
| `npm audit --omit=dev` | 3 high | **0 vulnerabilities** |
| `npm audit` | 3 high, 5 moderate | **0 vulnerabilities** |

The fix leaves `prisma` and `@prisma/client` at **6.19.3**. No Prisma major upgrade, schema change, migration, client API rewrite, or production database operation was performed. One transitive major override (`deepmerge-ts` 8.0.0) is scoped to `@prisma/config`; it was selected because it is the official patched release and the Prisma config package's only callsite uses the still-supported `deepmerge(left, right)` API. That compatibility assumption was exercised with Prisma validation, a cyclic-graph smoke test, production build and the complete suites.

## Exact initial findings and applicability

### HIGH: GHSA-ggr8-5vv4-36mx / CVE-2026-40345

Official advisory: [GitHub Security Advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx). It affects `deepmerge-ts <8.0.0`; patched version is **8.0.0**. The advisory describes synchronous stack exhaustion when **both input values contain matching self-referential/cyclic objects at the same property path** and are passed to `deepmerge`, `deepmergeInto`, or custom variants. This is a denial-of-service condition; ordinary JSON cannot encode cycles. No claim is made that normal product/order JSON triggers it.

| npm audit node | Installed | Classification/path | Applicability |
|---|---|---|---|
| `deepmerge-ts` | 7.1.5 | Transitive through `@prisma/config@6.19.3` | Vulnerable implementation when passed a matching cyclic object pair. |
| `@prisma/config` | 6.19.3 | Transitive through `prisma@6.19.3` | Its `loadConfigTsOrJs` loads `deepmerge` and passes it as the merger for Prisma TS/JS config loading. This repository has no `prisma.config.ts`; the only Prisma package config is the existing seed declaration. No application HTTP request passes attacker-controlled cyclic graphs to this callsite. The realistic trigger requires execution of the Prisma config loader with crafted cyclic config objects (normally local build/operator config code), not ordinary PostgreSQL queries or checkout traffic. |
| `prisma` | 6.19.3 | Direct root **devDependency**; installed as an optional peer (`devOptional`) through `@prisma/client`, which is why npm also reported it under `--omit=dev` | The vulnerable function is a Prisma CLI configuration-loading path. `@prisma/client` does not expose this config parser as an application request API. npm's production audit still included the optional-peer path, so it was remediated rather than suppressed or dismissed as dev-only. |

**Counting clarification:** npm displayed 3 HIGH package records, but all three resolve to the same unique GHSA/CVE above. Its `fixAvailable` suggested `npm audit fix --force` would install Prisma **6.12.0**, a downgrade flagged by npm as breaking; that is not an acceptable security fix. The advisory's actual patched dependency release is `deepmerge-ts` 8.0.0.

### MODERATE before remediation: GHSA-px8p-9vwx-vf98 / CVE-2026-45820

Official advisory: [GitHub Security Advisory](https://github.com/advisories/GHSA-px8p-9vwx-vf98). The affected installed `fflate` was 0.7.3 under the development-only optional rendering/tooling chain `vinext@1.4.1 → @vercel/og@1.0.3 → satori@0.33.5 → fflate@0.7.3`. A malformed ZIP64 archive can make `unzipSync()` loop indefinitely. Patched 0.7-series release is **0.7.5**. This code is not used by the Next.js production app's request handling; it was still fixed with a patch-level override because the fix is narrow and compatible with Satori's declared `fflate` 0.7.3 dependency.

The five moderate npm nodes before remediation represented this same fflate advisory propagated through `satori`, `@vercel/og`, `vinext`, and `@vinext/cloudflare`, all under dev tooling. There were not five distinct moderate advisory IDs.

## Controlled changes

Only `package.json` and `package-lock.json` changed for dependency remediation:

```json
"overrides": {
  "postcss": "8.5.32",
  "@prisma/config": { "deepmerge-ts": "8.0.0" },
  "fflate": "0.7.5"
}
```

- Prisma and Prisma Client remain **6.19.3**; Node engine requirement remains `>=18.18`, and project schema/generator (`prisma-client-js`) and PostgreSQL datasource settings are unchanged.
- Prisma 7's supported Node range and migration/tooling changes were not adopted. No major upgrade is needed to remediate the confirmed High advisory.
- `deepmerge-ts` 8 is a major transitive change, so the override is intentionally scoped to `@prisma/config`, not a global upgrade across unrelated packages. The upstream 8.0.0 release notes document Map deep-merge and `deepmergeInto` behavior changes; Prisma's callsite uses the standard `deepmerge` function on configuration objects. A smoke test confirmed recursive self-references terminate and preserve the self-reference.
- `fflate` 0.7.5 is the upstream patched patch version within the same 0.7 line.
- No `npm audit fix --force`, downgrade, prerelease, code assertion weakening, or Prisma schema/migration edit was made.

## Final dependency tree and audit

`npm ls prisma @prisma/client @prisma/config deepmerge-ts fflate --all` verified:

```text
@prisma/client@6.19.3
└── prisma@6.19.3
prisma@6.19.3
└── @prisma/config@6.19.3 (overridden)
    └── deepmerge-ts@8.0.0 (overridden)
vinext@1.4.1
└── @vercel/og@1.0.3
    └── satori@0.33.5
        └── fflate@0.7.5 (overridden)
```

Fresh final commands both returned success: `npm audit --omit=dev` → **found 0 vulnerabilities**; `npm audit` → **found 0 vulnerabilities**. No advisories remain in the lockfile graph at this audit snapshot. The separate runtime warning that local Node 23.1.0 is outside some dev-tool `engines` ranges remains an environment compatibility concern, not an npm vulnerability finding; use a supported LTS runtime for hosted builds as already documented in the staging report.

`npm ci --dry-run --ignore-scripts --no-audit --no-fund` also accepted the edited lockfile/override tree. This was a dry run: it did not replace `node_modules` or regenerate the lockfile.

## Verification after final overrides

All database-backed tests used isolated synthetic schemas inside local `agharas_test`; the development `agharas/public` schema and historical records were not changed. Vitest, build, and E2E used `agharas_test_secfix_20261105_a`; the clean final acceptance campaign used newly created and seeded `agharas_test_secfix_final_20261105_b`. Uploads were directed to an approved user temp path.

| Check | Final result |
|---|---|
| `npm audit --omit=dev` | **PASS — 0 vulnerabilities** |
| `npm audit` | **PASS — 0 vulnerabilities** |
| `npx prisma validate` | **PASS — schema valid** |
| `npm run typecheck` | **PASS** |
| `npm test` | **110/110 PASS**, 15 files, schema `agharas_test_secfix_20261105_a` |
| `npm run build` | **PASS**, production build and Prisma Client generation at 6.19.3, synthetic schema `agharas_test_secfix_20261105_a` |
| `npm run test:e2e` | **36/36 PASS**, 0 failed/skipped/timed out, schema `agharas_test_secfix_20261105_a` |
| `npm run test:audit` | **41/41 PASS**, 0 failed/skipped/timed out on the fresh final schema |
| Optical compatibility | **PASS**: focused Vitest **2/2**, plus acceptance case for pending/incompatible/approved synthetic decisions; no development optical decisions changed |
| Checkout / inventory / idempotency | **PASS**: full E2E/acceptance; acceptance purchase cases **4/4**, business stock/promo cases **3/3**; guest COD, duplicate-submission idempotency, stock adjustment/restoration, stale cart and tampered-price regression cases passed |
| `deepmerge-ts` cyclic graph smoke | **PASS** using the official vulnerable shape; patched 8.0.0 completed without stack exhaustion |

One acceptance attempt against a schema already mutated by an earlier full campaign had 4 failures and 11 dependent tests did not run. No assertions were changed. A newly created, freshly seeded synthetic schema was then used; the complete acceptance campaign passed **41/41**. Treat only the clean-schema result as the final acceptance result.

## Remaining actions / decisions

- Re-run `npm audit` in CI and immediately before any deployment; advisories and lockfile metadata can change over time.
- Keep `deepmerge-ts` override scoped and pinned until Prisma publishes a compatible version that depends on the patched line; verify release notes and remove the override only with a fresh audit and full regression.
- Keep `fflate` pinned to a patched compatible release until the Vinext/Satori chain updates its dependency declaration; reevaluate if that toolchain is removed or upgraded.
- This establishes a clean npm advisory baseline only. It is not a deployment authorization and does not clear unrelated staging blockers (domain, infrastructure, monitoring, retention, owner/legal/business approvals, optical review). Do not deploy based on this report.

## Changed files

- `package.json`
- `package-lock.json`
- `docs/DEPENDENCY_SECURITY_REMEDIATION.md`
- `docs/TECHNICAL_STAGING_PREPARATION.md`
- `docs/IMPLEMENTATION_PROGRESS.md`
