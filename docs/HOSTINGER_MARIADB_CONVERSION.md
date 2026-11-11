# AGHARAS VISION — MariaDB Conversion Report

**Current local status:** `MARIADB LOCAL ACCEPTANCE COMPLETE` (Hostinger checks remain unverified)  
**Date:** 10 November 2026  
**Workspace:** isolated conversion copy `D:\PROJETs\e-agharass-vision-mariadb`  
**Deployment:** none

## Summary

The isolated application uses Prisma 6's `mysql` provider and has now passed the complete local regression against a genuine MariaDB 11.4.8 server. The existing PostgreSQL project at `D:\PROJETs\e-agharass-vision` was not edited, and no PostgreSQL database was accessed. There was no historical-data transfer; test databases contain synthetic fixtures only. Local acceptance is complete, but this isolated conversion has **not** been adopted into the original project; Hostinger account-specific checks remain outstanding.

## Schema and migrations

- `prisma/schema.prisma` now declares `provider = "mysql"`; Prisma remains pinned at 6.19.3. `DIRECT_URL` was removed.
- PostgreSQL migrations are recoverably archived at `prisma/migrations-postgresql-archive/` in this isolated copy. The production history is a separate MySQL-provider `prisma/migrations/` containing a fresh baseline and an InnoDB integrity migration.
- The empty-database baseline was applied successfully to `agharas_mariadb_test`; the integrity migration adds the optical review `CHECK` and seeds the shared mutex row. A later Prisma schema-to-database diff was empty; `prisma migrate status` reported up to date.
- The generated baseline creates 38 application tables. With `_prisma_migrations`, the test schema contained 39 tables, all InnoDB and `utf8mb4`.
- PostgreSQL scalar lists became JSON fields: `Role.permissions`, `LensType.productTypes`, `OpticalCompatibilityRule.treatmentIds`, and `Store.services`. Runtime readers validate JSON array contents before use. MariaDB JSON membership is evaluated in application code rather than PostgreSQL array operators.
- Prisma-generated defaults and MariaDB JSON defaults were validated on the actual server. The four JSON list columns have corresponding defaults in the reviewed baseline.
- Prisma enums, integer-cent monetary amounts, bounded decimals, `DATETIME(3)`, relations, indexes, and referential actions remain represented in the schema. Text lengths for long content and indexed identifiers were reviewed and bounded where needed. Tables explicitly use InnoDB and `utf8mb4_unicode_ci`.

## Database-specific implementation

- Replaced both PostgreSQL transaction advisory-lock calls with a shared `DatabaseMutex` InnoDB row locked using parameterized `SELECT ... FOR UPDATE` inside the existing interactive transactions. Checkout and optical review use the same mutex; a missing row fails closed.
- Preserved conditional stock decrement, order/idempotency uniqueness, and transaction rollback semantics. No client-provided totals are trusted.
- Checkout locks product and variant price rows with `SELECT ... FOR UPDATE` inside the order transaction and rejects a cart snapshot whose effective catalog price changed before the lock. Actual checkout and catalog-save actions were synchronized against MariaDB: three runs per schedule verified stale-checkout rejection when the owner commits first, and locked-price order acceptance when checkout locks first. Stale rejection leaves order, stock, movement, and cart state unchanged; successful snapshots and inventory movements match the locked price.
- Optical-review actions share the InnoDB mutex with checkout. Two competing real owner decisions were forced to overlap; both serialize and both audit transitions persist in chain order, with the last commit reflected in the row. Authorization was checked through the real session guard; an unauthorized actor is rejected, and an incompatible record blocks a subsequent actual checkout. This is the documented serialization policy, without changing clinical criteria.
- `src/lib/mariadb-checkout-test-barrier.ts` is configurable only under `NODE_ENV=test`; regression fixtures are synthetic and use the disposable MariaDB database.
- Removed Prisma `mode: "insensitive"` filters (unsupported by the MySQL connector); text search relies on the tested case/accent-insensitive `utf8mb4_unicode_ci` collation.
- Runtime migrations use guarded `prisma migrate deploy`, verify the connected database identity, require an explicit expected database and either an empty-target confirmation or backup confirmation, and do not run `migrate dev`, reset, or seed.
- Build-time Prisma Client generation now uses a local placeholder URL and does not require PostgreSQL or a live database connection.

## Optical and data safeguards

- Progressive stays disabled; ADD and EP remain removed; no clinical plausibility gate was introduced.
- The database rejects non-pending optical decisions without a non-empty reviewer and review timestamp. Missing, pending, incompatible, or mismatched combinations remain blocked by exact compatibility evaluation.
- Synthetic approval records used by browser acceptance are confined to the disposable automated-test database, are marked TEST ONLY, and are not inserted by the demo seed. No approvals were created in the empty production schema (none was provisioned).
- The MariaDB seed is synthetic, refuses production, and will neither reset a database except the explicitly confirmed local test target nor seed a non-empty database during ordinary seeding.

## Real MariaDB environment

- Tested server: MariaDB **11.4.8**, official MariaDB Windows ZIP, SHA-256 verified before extraction.
- Disposable server: `127.0.0.1:3307`; data directory and binaries are beneath `C:\Users\admin\AppData\Local\Temp\opencode\agharas-mariadb-11.4.8`.
- Test database: `agharas_mariadb_test`, `utf8mb4_unicode_ci`, database-scoped test user. No unrelated server, Windows service, or port 3000 was changed.
- The optional local Docker Compose configuration targets MariaDB 11.4 on port 3308, but Docker was unavailable and Compose was not run.

## Hostinger-specific checks and historical local blockers

1. Hostinger hPanel engine version, host/port, prefixed DB/user, grants, connection limits, TLS/remote-access policy, and migration privileges have not been provided or verified. Local MariaDB 11.4.8 testing is not proof of the Hostinger account runtime.
2. Historical local issue: an earlier full acceptance result was **33 passed, 3 failed, 8 not run** under disk and Windows commit pressure. The final owner-remediation run subsequently passed **44/44**; see the final recovery section below.
3. Historical resource issue: earlier C: temp use caused MariaDB error 1021 / OS errno 28 and Chromium page setup timed out at low commit headroom. The final run used process-scoped D: temp/cache paths and passed. No system-wide settings were changed by the verification process.
4. `git diff --check` remains unavailable without Git metadata. Independent source integrity checks and package/lock checks are recorded in the final test report.
5. Existing PostgreSQL runtime assets, PostgreSQL project, and previous ZIP were not intentionally modified. No Hostinger deployment, real email, online payment, or business-data migration was performed. The continuation used a newly initialized, separate recovery datadir on port 3311; other database datadirs and services were not moved, deleted, or reconfigured.

See [`HOSTINGER_MARIADB_TEST_RESULTS.md`](HOSTINGER_MARIADB_TEST_RESULTS.md) for exact run results and [`HOSTINGER_MARIADB_DEPLOYMENT_FR.md`](HOSTINGER_MARIADB_DEPLOYMENT_FR.md) for the French manual deployment procedure and rollback.

## Preserved earlier package

A previous Hostinger-specific candidate ZIP remains preserved. The newer final recovery candidate is listed below; neither archive has been deployed:

- Path: `D:\PROJETs\e-agharass-vision-mariadb\dist\hostinger-mariadb-business-20261109.zip`
- Entries: 213; compressed size: 2,563,735 bytes.
- SHA-256: `9EE87F98F00CD63F0A8E9ECFD3D516131CA7FAF2ACD31F093C6723DCE64BA7DE`
- The archive includes the MySQL Prisma schema and two MariaDB migrations; PostgreSQL migration archive, synthetic seed, `.env` secrets, uploads, and `node_modules` are excluded.
- This earlier artifact predates the latest verified source/test changes and is not the current candidate. The original PostgreSQL project and ZIP were preserved.

## Earlier recovery continuation (superseded) — 10 November 2026

This superseded addendum records the pre-remediation continuation; its results are historical and are followed by the final acceptance recovery.

- Initial resource readings in this continuation: C: **0.16 GB free**, D: **20.56 GB free**; `TEMP`/`TMP` resolved to `C:\Users\admin\AppData\Local\Temp`; npm cache was `D:\npm-cache`. The C: Playwright cache (`C:\Users\admin\AppData\Local\ms-playwright`) occupied about **1.23 GB**. It was left in place. Node on the default PATH was **23.1.0**; `fnm` provided **22.23.0** for all verification commands.
- RAM/pagefile: **15.89 GB RAM**, initially **6.38 GB free**; C:\pagefile.sys is **1,269 MB**. Free Windows commit fell from **1.66 GB** initially to **0.38 GB** during the failed browser run, while physical RAM still showed about **6.05 GB free**. No unrelated process or Windows pagefile setting was changed.
- `D:\AGHARAS-TEMP` already existed and ACL inspection confirmed authenticated users can modify it. Process-scoped `TEMP`/`TMP` were set to that path. Playwright Chromium/headless-shell revision **1248** was installed via the supported local Playwright CLI under `D:\AGHARAS-PLAYWRIGHT-BROWSERS`; the old C: cache was not moved or deleted. A one-page Chromium launch/navigation smoke test passed.
- A separate recovery-only MariaDB 11.4.8 instance was created under `D:\AGHARAS-MARIADB-RECOVERY\data\db` on `127.0.0.1:3311`; its genuine MariaDB config sets `tmpdir=D:/AGHARAS-TEMP`. `SELECT DATABASE(), VERSION(), @@tmpdir` returned `agharas_mariadb_test`, MariaDB 11.4.8, and the D: temp path. Two migrations applied and the synthetic seed persisted 12 products and one demo order. Existing port-3310 and port-3000 processes/data were not changed.
- A source-isolated copy was built to avoid the active port-3000 dev server. Under Node 22.23.0, Prisma validation and `npm run typecheck` passed; full `npm audit --audit-level=low` found 0 vulnerabilities. The first Next build failed with V8 native `Fatal process out of memory: Zone`. A retry with a 768 MiB Node heap exited successfully and produced `BUILD_ID`, but the recovery database had been gracefully stopped during that build, so Next logged database-connectivity errors while collecting page data. Treat that build as **completed with a database-unavailable warning**, not a clean DB-backed build.
- The prescription acceptance test was rerun alone against the fresh recovery database. Chromium launched and Playwright created a browser context, but `context.newPage()` did not complete before the test's existing 120-second timeout. It failed before the application test body or image upload. This run did not reproduce the earlier image-file import or MariaDB errno-28 failure; the other two prior targeted passes remain as recorded above. Full acceptance, Vitest, E2E, and both concurrency tests were not rerun in this continuation.
- Integrity checks on 216 source/test/migration/script files found no conflict markers or trailing whitespace; package/lock root metadata and dependencies matched. No Git metadata exists, so `git diff --check` remains unavailable. The Hostinger package allowlist was inspected; no new ZIP was generated because critical gates remain blocked. The old ZIP SHA-256 remains `9EE87F98F00CD63F0A8E9ECFD3D516131CA7FAF2ACD31F093C6723DCE64BA7DE`.

**Verdict at that point:** `MARIADB ACCEPTANCE BLOCKERS REMAIN`. The owner subsequently remediated resources; final results follow.

## Final acceptance recovery — 10 November 2026

- Resource preflight before testing: C: **0.25 GB free**, D: **19.50 GB free**; **15.89 GB RAM**, **5.70 GB available**, **1.96 GB commit headroom**, pagefile allocation **2,902 MB**; Node **22.23.0** selected through `fnm`. During the continuation Windows restarted; subsequent available commit rose to **10.16 GB**. Final post-test readings were C: **1.57 GB free**, D: **19.47 GB free**, **8.86 GB available RAM**, **6.11 GB available commit**, with 1,573 MB pagefile allocation reported. No system-wide setting was changed by the test process.
- Process-only temp/cache setup: `TEMP=TMP=D:\AGHARAS-TEMP`, npm cache `D:\npm-cache`, Playwright revision 1248 at `D:\AGHARAS-PLAYWRIGHT-BROWSERS`. The existing C: Playwright cache was preserved. All test traces/results remained under `D:\AGHARAS-MARIADB-RECOVERY`.
- The isolated MariaDB 11.4.8 instance used the existing recovery datadir `D:\AGHARAS-MARIADB-RECOVERY\data\db`, port 3311 and `tmpdir=D:/AGHARAS-TEMP`. The schema was current; MariaDB stayed online through production build page-data collection and test runs. Post-test counts confirmed synthetic persistence (17 products, 12 orders, 4 prescriptions). No errno 28 or error 1021 appeared in the recovery server log.
- Final regression, all under Node 22.23.0: Prisma validation **PASS**; TypeScript **PASS**; Vitest **143/143 PASS**; Playwright E2E **38/38 PASS**; MariaDB acceptance **44/44 PASS**; checkout and optical-review production-action concurrency each **PASS** in the full Vitest and focused reruns; full `npm run build` **PASS** with database online; full and production-only npm audits **0 vulnerabilities**.
- Targeted investigations: product creation/image import **2/2 PASS**, stale-cart **1/1 PASS**, prescription roundtrip **1/1 PASS**. The eight admin cases that had previously not run passed within the ordered admin spec (**10/10**). A filtered attempt without the SKU setup test exposed that dependency and was not mistaken for a product failure. An initial E2E setup attempt lacked `SEED_ADMIN_PASSWORD`; rerun with synthetic credentials passed all 38 tests. No assertions or timeouts were weakened.
- Independent integrity: 216 source/test/migration/script files had no conflict markers or trailing whitespace; 261 package-input files matched the tested source copy; package-lock metadata/dependencies/engine matched. No Git metadata exists, so no `git diff --check` claim is made.

### New Hostinger candidate — not deployed

- Path: `D:\PROJETs\e-agharass-vision-mariadb\dist\hostinger-mariadb-business-20261110-final-recovery.zip`
- 214 archive entries (213 manifest payload entries), **2,564,768 bytes**.
- SHA-256: **`C96DD002D3C2DC192874DC171B947B36A8FF94B592494019C353AECB2515A3F2`**.
- Manifest matches archive. Inspection found no `.env` secrets, non-placeholder credential assignments, private storage, test artifacts, database files, or synthetic seed data. `.env.example` contains placeholders only. The previous ZIP was not overwritten.

**Final local verdict: `MARIADB LOCAL ACCEPTANCE COMPLETE`.** Actual Hostinger MariaDB endpoint/version, grants, prefixed names, connection limits, runtime integration, migration privileges, and durable/private storage still require verification on Hostinger. No deployment occurred.
