# Optical form and storefront refinements

**Date:** 8 November 2026  
**Final verification:** 8 November 2026. **CHANGES INCOMPLETE — BLOCKERS REMAIN** for any business/demo database rollout; the code changes and synthetic-browser scope below are verified. No deployment occurred.

## Implemented

### Progressive lenses

- Public configurator queries exclude Progressive; shared selection validation, add-to-cart and checkout reject it, including stale cart snapshots and reactivated legacy rows. The owner editor also prevents reactivation.
- The seed keeps the historical catalogue row inactive. Additive migration `20261108100000_disable_progressive_new_sales` changes only the active flag; no historical orders or financial snapshots are deleted or rewritten.
- Public homepage copy no longer advertises Progressive. Historical/admin references remain intact.

### Promotional imagery and CMS

- Six local WebP assets are present in `public/images/promotional/`; original high-resolution Pexels JPEGs are preserved in `assets/pexels-originals/`. Creator, photo page, original pixel dimensions, derivatives, placement, and license are recorded in [`assets/pexels-originals/README.md`](../assets/pexels-originals/README.md). Pexels' published license permits commercial use and modification; the selected product-only photos were visually reviewed for watermarks, identifiable people, and visible/ambiguous third-party marks.
- Pexels license: <https://www.pexels.com/license/>. Derivatives were produced as WebP quality 82 without upscaling. Dimensions/bytes: hero 1920×1281 / 63,090; promotion 1200×801 / 42,078; Femme 960×1440 / 30,750; Homme 960×1440 / 54,588; Solaires 1600×1068 / 49,094; Clips 960×641 / 30,662.
- Additive migration `20261108110000_update_demo_promo_image_defaults` updates only exact bundled demo defaults (plus a null demo-promotion image); owner-selected banner/category URLs and uploaded media are not overwritten. The homepage keeps CMS banners and image upload operational. Acceptance test CMS image update/render passed.

### Prescription entry and clinical checks

- Manual customer entry shows Sphere, Cylinder and Axis for OD/OG only. Addition/ADD and EP are absent from the customer form and new-entry parsing/persistence; database columns and historical admin views remain for existing records.
- Removed clinical range/quarter-step, cross-eye and index `maxAbsSphere` blocking. Numeric parsing, Decimal storage precision/range, integer axis storage bounds, request/file security, authorization, database integrity, and exact professional optical-compatibility approval remain enforced. PENDING combinations remain blocked.
- French non-blocking notice: “Les mesures saisies sont déclarées par le client et seront vérifiées par l'opticien.”

## Main files changed

- `src/components/site/LensWizard.tsx`, `src/lib/validation.ts`, `src/lib/pricing.ts`
- `src/app/actions/cart.ts`, `src/app/actions/checkout.ts`, `src/app/actions/admin/lenses.ts`
- `src/app/(site)/configurateur/[slug]/page.tsx`, `src/app/(site)/page.tsx`
- `prisma/seed.ts`, `prisma/migrations/20261108100000_disable_progressive_new_sales/migration.sql`, `prisma/migrations/20261108110000_update_demo_promo_image_defaults/migration.sql`
- `public/images/promotional/*`, `tests/unit/{pricing,validation}.test.ts`, `tests/audit/*`, `docs/IMPLEMENTATION_PROGRESS.md`

## Verification

| Check | Result | Evidence / limitation |
|---|---|---|
| Prisma validation | PASS | `npx prisma validate` |
| TypeScript | PASS | `npm run typecheck` |
| Vitest | PASS | 18 files, 122/122 |
| Production build | PASS | `node_modules/.bin/next build` to isolated `.next-recovery-optical-20261108-final`; ordinary `npm run build` first exited 1 from Node native process OOM during redundant `prisma generate`, then direct Next build passed with existing generated Prisma client. |
| Full E2E | PASS | 36/36 against fresh `agharas_test.agharas_test_optical_20261108_e`, local port 3112, existing isolated production build. |
| Full acceptance | PASS | 44/44 against fresh `agharas_test.agharas_test_optical_20261108_d`; includes CMS, security, PENDING/INCOMPATIBLE, prescription, atypical values, crafted Progressive action and stale-cart regressions. |
| Dependency audit | PASS | `npm audit --audit-level=moderate`: 0 vulnerabilities. |
| Real-browser visual checks | PASS | Chromium 156 / Playwright 1.64.1; homepage, catalogue, product and configurator HTTP 200; no console/page errors. Hero, category, promo images loaded. CMS image change/render also passed in acceptance. |
| Responsive screenshots | PASS | Homepage and prescription entry at 390, 768, 1024 and 1440 px under `artifacts/optical-browser/`; measured document scroll width equaled viewport at each width. Progressive, ADD and EP absent on all prescription widths. |
| `git diff --check` | PASS | Exit 0; only Git's existing LF→CRLF working-copy warnings appeared. |

## Runtime recovery evidence

- The earlier failing command was `npx next start -H 127.0.0.1 -p 3106`; it exited 1 before rendering. The failure came from the production instrumentation guard (`.next/server/instrumentation.js:1:3445`): the process had incomplete local runtime configuration, so it refused startup. No secret values were captured or printed. At inspection, `NODE_ENV`/`APP_ENVIRONMENT` were unset, the configured public origin was `http://localhost:3000`, `DATABASE_URL` resolved to local `agharas/public`, and `TEST_DATABASE_URL` resolved to local `agharas_test/public`.
- Recovery used a separately built app at `http://127.0.0.1:3112`, `NEXT_DIST_DIR=.next-recovery-optical-20261108-b` (final validation build `.next-recovery-optical-20261108-final`), `NODE_ENV=production`, `APP_ENVIRONMENT=test`, owner account matching the synthetic schema, `EMAIL_TRANSPORT=discard`, and absolute local temporary public/private media paths. Prisma resolved to `localhost / agharas_test / agharas_test_optical_20261108_d` for acceptance and schema E for E2E. The installed Playwright Chromium cache was explicitly set to `.playwright-browsers`.
- `npm run build` initially exited 1 with a Node native out-of-memory fatal during its redundant `prisma generate`; `node_modules/.bin/next build` then passed using the already-generated client and an isolated output directory. The initial listener check found 3002 and 3110 only; 3106 had no listener at that check. At final check, 3002 remained and 3110 was no longer listening. This workflow did not bind or stop 3000, 3106, or 3110; the isolated 3112 server was stopped after testing.

## Database safety and migration disposition

- Created and identity-verified fresh schemas D and E only in local database `agharas_test`; applied the six current migrations and seeded synthetic data only there. Schema D hosted acceptance; schema E hosted E2E. Schema A was separately used to compare historical order-item snapshots immediately before/after the Progressive migration; unchanged. The two runs used `TEST ONLY — NOT A PROFESSIONAL APPROVAL` fixtures exclusively in isolated schemas.
- No backup/restore rehearsal or migration was run against a business/demo database in this recovery. The Progressive migration is verified on isolated schemas only; business/demo migration status was not re-queried or changed because this task expressly forbids targeting `agharas/public` or production/demo databases. No statement of business/demo migration status is made here. A separately recorded earlier operational incident remains documented in the prior report history and was not re-investigated.
- Historical order snapshots, pricing, and database columns for old Addition/EP values are retained; tests did not rewrite historic prescription/order data. No database reset or deployment occurred.

No deployment, hosting connection or online payment activation occurred.

## Remaining blockers

1. Business/demo database migration status and rollout remain outside this recovery: no DB was targeted, backed up/restored, or migrated. Before any such operation, follow the required verified backup, restore test, and clone rehearsal; do not deploy based only on synthetic-schema verification.
2. Owner/professional decisions for real optical compatibility remain required. The synthetic `TEST ONLY` approvals in acceptance do not constitute clinical or commercial approvals.

## Final verdict

**CHANGES INCOMPLETE — BLOCKERS REMAIN**

The requested code changes, licensed/attributed image assets, production build, full E2E and acceptance, and real-browser responsive checks are verified locally. This is not authorization to apply the migration to a business/demo database, an optical professional approval, or a deployment clearance.
