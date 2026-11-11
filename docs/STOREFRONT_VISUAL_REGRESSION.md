# Storefront Visual Regression & Build Recovery

**Date:** 2 November 2026  
**Scope:** verification and repair only; no deployment or storefront redesign.

## Status summary

| Check | Status | Result |
| --- | --- | --- |
| TypeScript | **PASS** | `next typegen && tsc --noEmit`, zero errors |
| Prisma Client generation | **PASS** | Prisma 6.19.3 generated successfully |
| Next production build | **PASS** | `npm run build`, optimized build completed |
| Cloudflare/Vinext build | **PASS** | `npm run build:vinext`, all five Vite environments completed |
| Vitest unit/integration | **PASS** | 11 files, 90 tests |
| Full Playwright E2E | **PASS** | 31 tests |
| Full acceptance suite | **PASS** | 41 tests |
| Responsive/visual checks | **PASS** | 390, 768, 1440 px; no horizontal overflow on tested routes |
| `git diff --check` | **PASS** | No whitespace errors (Git printed existing LF/CRLF notices) |
| Cloudflare deployment | **NOT EXECUTED** | Deployment was expressly out of scope |
| Production readiness | **NOT ASSERTED** | Separate business/security/go-live review remains required |

## Root causes and fixes

### TypeScript module errors

The initial compiler output was exactly:

```text
cloudflare.config.ts(1,54): error TS2307: Cannot find module 'cf/config' or its corresponding type declarations.
vite.config.ts(2,20): error TS2307: Cannot find module 'vinext' or its corresponding type declarations.
vite.config.ts(3,28): error TS2307: Cannot find module '@cloudflare/vite-plugin' or its corresponding type declarations.
```

The Cloudflare and Vite integration was active: package scripts, `cloudflare.config.ts`, `vite.config.ts`, and generated-output ignores were present. The three imported packages were absent from both `package.json` and the lockfile; this was not a path-alias or `tsconfig` resolution defect.

Added exact dev dependency versions compatible with the configured Cloudflare/Vite integration:

- `cf` 1.0.0-beta.27
- `@cloudflare/vite-plugin` 1.67.0
- `vinext` 1.4.1 and `@vinext/cloudflare` 1.3.1
- `vite` 8.3.5
- `@vitejs/plugin-rsc` 0.5.38 and `react-server-dom-webpack` 19.3.1
- `vitest` 5.1.0

The Vite 8 requirement conflicts with the prior Vitest 3 peer range (Vite through 7); a clean npm resolution rejected that combination. Vitest was therefore moved to the compatible Vite 8 release. No `--force` or `--legacy-peer-deps` was used. `.cloudflare/types/**/*.ts` was added to the TypeScript includes, as required by the Vinext Cloudflare type-generation workflow.

The installed system Node was 23.1.0, outside the declared engine ranges of current `cf` and Vitest. Verification used a local, temporary Node 22.23.0 runtime; no system Node installation was changed.

Two additional Node 22 ESM issues surfaced during full Playwright runs: native named-import interop for Next’s CommonJS `@next/env`, and use of `__dirname` in ESM. Config/helper imports now use `createRequire`; test file paths use `fileURLToPath` or `import.meta.dirname`.

Vinext and Next both write route type files beneath `.next/types`. A Vinext build can leave Next’s generated validator paired with Vinext’s route declarations. The existing `typecheck` command now runs `next typegen` before `tsc --noEmit`, so it deterministically generates the correct Next declarations without excluding generated files or weakening type checks.

### Prisma Windows DLL `EPERM`

The failed build attempted to rename `node_modules/.prisma/client/query_engine-windows.dll.node` while the Next development server was running on port 3000. The owning process was identified as this project’s `npm run dev` tree (npm PID 16324 → Next PID 13816 → server PID 7588). Windows rejected graceful termination and explicitly required a forceful termination for that console process. Only this identified project process tree was stopped; unrelated Node processes were not targeted.

After stopping it, `npm run db:generate` succeeded, followed by successful production builds. This confirms the DLL was locked by the running app process. No Prisma schema or migration changes were made to resolve it.

## Regression results

All browser and database suites used dedicated schemas in the local `agharas_test` database, not the development `agharas` database. Fresh schemas were migrated and populated with synthetic seed data; no development database reset was run.

| Suite | Status | Exact result / coverage |
| --- | --- | --- |
| `npm run typecheck` | **PASS** | `next typegen` completed; TypeScript emitted zero errors |
| `npm run db:generate` | **PASS** | Prisma Client 6.19.3 generated |
| `npm test` | **PASS** | 11 test files, 90/90 tests; includes 2 optical compatibility unit tests |
| `npm run build` | **PASS** | Prisma generation, optimized Next build, type validation and route collection completed |
| `npm run build:vinext` | **PASS** | RSC, SSR, client and other Vite build environments completed; no deployment performed |
| `npm run test:e2e` | **PASS** | 31/31 tests, including owner/admin access, publishing, guest checkout/confirmation, responsive navigation, catalog and product smoke tests |
| `npm run test:audit` | **PASS** | 41/41 acceptance tests, including optical purchase/price/review validation, owner CMS/settings, product publication/archiving, inventory, security and WhatsApp settings |

The E2E suite used `agharas_test.agharas_e2e_20261102`. The final acceptance run used a separate fresh schema, `agharas_test.agharas_acceptance_b_20261102`. Earlier investigation also used `agharas_test.agharas_acceptance_20261102`. All writes from these test suites were confined to synthetic test schemas.

### Responsive and visual evidence

Homepage, catalog, product detail, cart, and checkout were checked at **390 × 900**, **768 × 900**, and **1440 × 900**. All 15 route/viewport combinations returned HTTP 200 with document width equal to viewport width. Cart and checkout were additionally checked with a synthetic item in the cart at all three widths (six checks, no overflow). Product gallery thumbnail selection and the product purchase action both passed at each viewport.

Current full-page screenshots (mobile and desktop) are in:

```text
C:\Users\admin\AppData\Local\Temp\opencode\visual-regression\
```

Files: `home-{390,1440}.png`, `catalog-{390,1440}.png`, `product-{390,1440}.png`, `cart-{390,1440}.png`, `checkout-{390,1440}.png`, `cart-populated-{390,1440}.png`, and `checkout-populated-{390,1440}.png`.

The screenshots from the previous visual enhancement, used as the current visual baseline, are:

```text
C:\Users\admin\AppData\Local\Temp\opencode\home-desktop.png
C:\Users\admin\AppData\Local\Temp\opencode\catalogue-mobile.png
C:\Users\admin\AppData\Local\Temp\opencode\product-mobile.png
```

No pre-enhancement screenshots were available, so no true pre/post comparison is claimed.

## Files changed for this recovery

- `package.json`, `package-lock.json` — Cloudflare/Vite/RSC dependencies, compatible Vitest, deterministic typecheck script.
- `tsconfig.json` — Cloudflare generated type declarations.
- `playwright.config.ts`, `tests/e2e/helpers.ts`, `tests/e2e/auth.setup.ts` — Node 22 ESM-safe imports and paths.
- `vitest.config.ts` — ESM-safe path resolution.
- `tests/audit/global-setup.ts` and `tests/audit/02-admin.spec.ts` through `10-whatsapp.spec.ts` — ESM-safe test asset paths.
- `docs/STOREFRONT_VISUAL_REGRESSION.md` — this report.

The previously implemented storefront refinements in `src/components/site/ProductCard.tsx`, `ProductGallery.tsx`, and `CatalogView.tsx` were preserved. No business logic, optical rules, checkout/payment logic, CMS content, or Prisma schema was changed by this recovery.

## Remaining warnings / blockers

- **Dependency advisory warning:** npm’s install audit summary reported 11 advisories (6 moderate, 5 high). No forced audit fixes were applied; review these separately before release. A full `npm audit` investigation was **NOT EXECUTED**.
- **Non-blocking tool warnings:** Prisma reports the deprecated `package.json#prisma` configuration. The Vite build reports upstream dynamic-import and static route-classification warnings; the build completed successfully. These should be reviewed before choosing Cloudflare as a production runtime.
- **Deployment:** **NOT EXECUTED**, as requested. The successful Vite build is build evidence only and does not establish Cloudflare runtime compatibility or production readiness.
