# MariaDB Conversion — Test Results

**Date:** 10 November 2026 (disk/pagefile recovery follow-up)  
**Server:** genuine MariaDB 11.4.8; isolated recovery/acceptance instance on `127.0.0.1:3311`  
**Database:** `agharas_mariadb_test` (synthetic fixtures only; newly initialized on D:)  
**Node:** 22.23.0  
**npm:** 10.9.8  
**Prisma:** 6.19.3  
**Deployment:** not performed

## Results

| Check | Result | Details |
|---|---|---|
| Official MariaDB binary | PASS | Official MariaDB 11.4.8 Windows ZIP checksum verified before extraction; server isolated, no Windows service installed. |
| Prisma schema validation | PASS | MySQL provider; Prisma 6.19.3. |
| Prisma Client generation | PASS | Latest `npm run build` generated Prisma Client 6.19.3 successfully; prior DLL-lock failure was avoided by building after stopping only the isolated test app. |
| Migrations / schema status | PASS | Two migrations; schema up to date on the synthetic MariaDB database. Earlier fresh baseline created 38 InnoDB/utf8mb4 application tables plus migration table. |
| Checkout-price action race | PASS | Real checkout and owner catalog-save actions; both deterministic orderings repeated three times. Owner-first rejects stale quote with no order/stock/movement/cart consumption. Checkout-first stores the locked price snapshot, decrements stock once, records one movement, then allows the owner update. |
| Competing optical-review action race | PASS | Two real review actions overlap at the shared InnoDB mutex. Both serialized audit transitions persist in order; final row matches last committed decision. Owner authorization works, unauthorized session is rejected, and incompatible state blocks a real subsequent checkout. |
| Node / npm | PASS | fnm activated Node 22.23.0 and npm 10.9.8 for verification commands. |
| TypeScript | PASS | Final `npm run typecheck` passed under Node 22.23.0 with a process-local 768 MiB Node heap cap. An earlier 512 MiB retry OOMed under low Windows commit headroom; see the historical continuation. |
| Full Vitest | PASS | **143/143** on genuine local MariaDB, including the two new production-action race tests. |
| Playwright E2E | PASS | Latest full suite **38/38**, one worker, Node 22.23.0, D: browser cache, isolated MariaDB-backed app. Initial setup-only attempt lacked `SEED_ADMIN_PASSWORD`; it was corrected and the full suite passed. |
| Full acceptance suite | PASS | Latest full run **44/44**, one worker, no failures or skips. Prior campaign was 33/3/8. Product/image imports, stale cart, prescription roundtrip and the eight dependent admin tests all passed after resource recovery. |
| Disk/temp recovery | PASS | Owner-remediation preflight: C: **0.25 GB free**, D: **19.50 GB free**. Process-scoped TEMP/TMP were directed to `D:\AGHARAS-TEMP`; npm cache remained on D:. MariaDB 11.4.8 on port 3311 reported `tmpdir=D:/AGHARAS-TEMP` and datadir `D:\AGHARAS-MARIADB-RECOVERY\data\db`. No existing datadir was moved or reset. No errno 28 / error 1021 recurred in the completed run. |
| Browser cache | PASS | Playwright Chromium/headless-shell revision 1248 installed by the supported CLI at `D:\AGHARAS-PLAYWRIGHT-BROWSERS`; previous C: cache remained untouched. Browser artifacts and test outputs were directed to D:. |
| Windows memory / pagefile | PASS for this run | Preflight: 15.89 GB RAM, 5.70 GB available, 1.96 GB available commit, 2,902 MB allocated pagefile. After the system restart during this session: 8.95 GB RAM and 10.16 GB commit available. Final reading after tests: 8.86 GB RAM and 6.11 GB commit available; pagefile reported 1,573 MB allocated. No system settings or unrelated processes were changed. |
| Production build | PASS | Full `npm run build` under Node 22.23.0, while MariaDB remained online through page-data collection; Prisma Client generated and Next production build completed without DB errors. |
| Dependency audit | PASS | Full and production-only `npm audit --audit-level=low`: **0 vulnerabilities** each. |
| Package/lock consistency | PASS | Root dependencies and engines in `package.json` match `package-lock.json`; isolated tested copy matched all 261 checked package-input files. `npm ls --depth=0` completed and reported two extraneous packages. |
| Source whitespace/conflicts | PASS, scoped | No trailing whitespace or conflict markers in 216 source, test, migration, and script files. Existing Markdown hard-break spaces were left unchanged. |
| `git diff --check` | UNAVAILABLE | Workspace has no `.git` metadata; this is not reported as a pass. |

## Race policy and evidence

Checkout quote policy: if the owner price update commits before checkout obtains its catalog row locks, checkout rejects the stale quote and leaves the cart and inventory untouched. If checkout obtains the locks first, it accepts that locked price, commits the order snapshot and inventory movement atomically, and the owner update proceeds after the transaction.

Optical review policy: decisions for the same shared review mutex serialize; both committed transitions are audited, and the last committed review is the persisted state. Checkout reads compatibility under the same mutex and fails closed for an incompatible decision. The tests use synthetic records only and do not create clinical or business approvals.

The synchronization hooks in `src/lib/mariadb-checkout-test-barrier.ts` can be configured only in test mode. `tests/integration/mariadb-action-concurrency.test.ts` invokes the actual production checkout, catalog-save, and optical-review actions against the disposable MariaDB database.

## Acceptance and fixture integrity

The earlier full campaign ended 33 passed / 3 failed / 8 not run under C: disk and Windows commit pressure. Following owner remediation, a fresh sequential run passed acceptance **44/44** and E2E **38/38**. The prior prescription test-fixture adjustment uses an on-disk temporary file of the same 10 MiB+1 size; application validation limits were not weakened. The final database identity was MariaDB 11.4.8 on port 3311 with `tmpdir=D:/AGHARAS-TEMP`; post-run persistence checks found synthetic products, orders and prescriptions. All generated data remained in the isolated test datadir. No production or real-business records were involved.

## Not established

- Hostinger account-specific MariaDB version/endpoint, user prefixes, grants, connection limits, runtime integration, and migration permissions.
- External email delivery, online payment, production data, deployment, and adoption into the original PostgreSQL project.
- `git diff --check` (unavailable without Git metadata); no preserved pre-change source baseline was available for a full byte-for-byte diff.

**Current verdict:** `MARIADB LOCAL ACCEPTANCE COMPLETE` — Prisma, TypeScript, Vitest 143/143, E2E 38/38, acceptance 44/44, checkout/optical-review concurrency, the full Node 22 build, and both dependency audits passed. Hostinger-specific compatibility remains unverified; this is not deployment authorization.

## Preserved earlier package

- `D:\PROJETs\e-agharass-vision-mariadb\dist\hostinger-mariadb-business-20261109.zip`
- SHA-256: `9EE87F98F00CD63F0A8E9ECFD3D516131CA7FAF2ACD31F093C6723DCE64BA7DE`
- 213 entries; 2,563,735 bytes. Preserved and not overwritten; predates the latest concurrency changes and is not deployment-ready.
- A new candidate is recorded in the final recovery addendum below; neither this earlier ZIP nor any PostgreSQL project was overwritten.

## Earlier recovery continuation (superseded) — 10 November 2026

This addendum captures the latest continuation and supersedes neither the earlier successful targeted runs nor the original 33/3/8 full-campaign result.

| Check | Latest continuation result | Evidence / detail |
|---|---|---|
| Initial disk state | C: 0.16 GB free; D: 20.56 GB free | Initial process `TEMP`/`TMP` were `C:\Users\admin\AppData\Local\Temp`; npm cache was `D:\npm-cache`. The existing C: Playwright cache occupied about 1.23 GB and was preserved. |
| Process temp setup | PASS | `D:\AGHARAS-TEMP` existed with write permissions. Verification processes used process-scoped `TEMP`/`TMP` there. The staged MariaDB 11.4.8 instance on 3310 and the isolated recovery instance on 3311 both reported `@@tmpdir=D:/AGHARAS-TEMP`. No datadir was moved or reset. |
| Playwright browser | PARTIAL PASS | Installed Chromium/headless-shell revision 1248 with Playwright's supported install command to `D:\AGHARAS-PLAYWRIGHT-BROWSERS`; left the prior C: cache untouched. A standalone browser launch and `/connexion` navigation passed. |
| Isolated recovery database | PASS (provisioning) | New MariaDB 11.4.8 instance on 127.0.0.1:3311, datadir `D:\AGHARAS-MARIADB-RECOVERY\data\db`, D: tmpdir. Two migrations applied; synthetic seed produced 12 products and one demo order. No existing test schema was reset. The instance remains a separate disposable test environment. |
| Prisma validation | PASS | `prisma validate` under Node 22.23.0 on the source-isolated recovery copy. |
| TypeScript | PASS | `npm run typecheck` under Node 22.23.0 with a process-local 768 MiB Node heap cap. |
| Dependency audit | PASS | Full `npm audit --audit-level=low`: 0 vulnerabilities. |
| Production build | PASS WITH WARNING | First build attempt hit V8 native `Fatal process out of memory: Zone`. A capped retry exited 0 and created `BUILD_ID`, but MariaDB had been gracefully stopped for that build; Next logged `Can't reach database server at 127.0.0.1:3311` during page-data collection. A clean DB-connected build is not established by this retry. |
| Prescription scenario rerun | FAIL / ENVIRONMENT BLOCKED | One isolated rerun on the recovery database timed out at the existing 120-second limit while setting up `page`. Trace confirms browser launch and context creation, then `BrowserContext.newPage` never completed. The app test body and upload were not reached. A standalone one-page browser smoke test passed. |
| Memory/pagefile | BLOCKED | 15.89 GB RAM; free physical RAM remained about 6.05 GB, but free Windows commit fell from 1.66 GB to 0.38 GB. `C:\pagefile.sys` is 1,269 MB (98 MB current use, 116 MB peak at measurement). No pagefile/system setting or unrelated process was changed. |
| Full Vitest / E2E / concurrency | NOT RERUN | Prior verified results remain 143/143 Vitest, 38/38 E2E, and both checkout/optical-review concurrency tests passing. |
| Full acceptance | BLOCKED | Previous full campaign remains 33 PASS / 3 FAIL / 8 NOT RUN. Earlier targeted image-import (2/2) and stale-cart (1/1) passes are retained. This continuation's prescription retry failed before its test body; no 44/44 result is claimed. MariaDB error 1021 was not reproduced against the D: tmpdir. |
| Source integrity | PASS, scoped | 216 source/test/migration/script files: 0 conflict markers, 0 trailing whitespace. Package/lock root dependencies, name, version, and engine match. Workspace has no Git metadata; `git diff --check` is unavailable. |
| Deployment package | NOT CREATED | Critical acceptance gates remain blocked. Previous ZIP remains unchanged at the path and SHA-256 above. No deployment was made. |

### Exact recovery paths and resource findings

- Browser install: `D:\AGHARAS-PLAYWRIGHT-BROWSERS`; previous C: browser cache retained.
- MariaDB recovery datadir/config: `D:\AGHARAS-MARIADB-RECOVERY\data\db` and `D:\AGHARAS-MARIADB-RECOVERY\my.ini`; configured `tmpdir=D:/AGHARAS-TEMP`.
- Isolated Next build/test copy and output: `D:\AGHARAS-MARIADB-RECOVERY\workspace` and `.next-recovery`; test artifacts/traces remain in that recovery copy, not the original workspace.
- D: free space after browser install and recovery files was about 19.49 GB; C: remained about 0.16 GB. The exact earlier MariaDB failure was errno 28 / error 1021, `Disk got full writing '.(temporary)'`; it did not recur on the D: configured tmpdir in the limited verification performed.

**Verdict at that point:** `MARIADB ACCEPTANCE BLOCKERS REMAIN`. The final recovery below supersedes that state.

## Final acceptance recovery — 10 November 2026

| Gate | Result | Run details |
|---|---|---|
| Resource preflight before tests | PASS | C: 0.25 GB free; D: 19.50 GB free; RAM 15.89 GB total / 5.70 GB available; Windows commit 1.96 GB available; pagefile 2,902 MB; Node 22.23.0. Later after the system restart, commit headroom rose to 10.16 GB. Final post-run: C: 1.57 GB, D: 19.47 GB, RAM available 8.86 GB, commit available 6.11 GB; pagefile reported 1,573 MB allocated. |
| Temp/browser/database configuration | PASS | Process TEMP/TMP `D:\AGHARAS-TEMP`; npm cache `D:\npm-cache`; Playwright revision 1248 at `D:\AGHARAS-PLAYWRIGHT-BROWSERS`; MariaDB 11.4.8 on 127.0.0.1:3311, datadir `D:\AGHARAS-MARIADB-RECOVERY\data\db`, runtime `tmpdir=D:/AGHARAS-TEMP`. MariaDB stayed online for build data collection and test runs. |
| Prisma / TypeScript | PASS | `prisma validate`; `npm run typecheck` under Node 22.23.0. |
| Full Vitest | PASS | 143/143, 24 test files, 0 skipped. Includes actual checkout and optical-review action races. Focused reruns: checkout 1/1 and optical-review 1/1 passed; each focused filter excluded the other case, while the complete suite had no skips. |
| Playwright E2E | PASS | 38/38. An initial setup-only attempt lacked `SEED_ADMIN_PASSWORD`; rerun with synthetic seed credentials passed all tests. |
| Acceptance | PASS | 44/44, one worker. Three prior blocker areas passed in focused runs; the admin spec passed 10/10, including the eight dependent cases. A filtered eight-case attempt first exposed its required SKU setup dependency; the ordered full admin spec resolved this without source changes. |
| Production build | PASS | Full `npm run build`: Prisma Client 6.19.3 generated, Next compile/type checks/page-data collection/trace collection all completed with MariaDB online and no connection errors. |
| Dependency audits | PASS | Full and production-only audit: 0 vulnerabilities. |
| Disk error / database persistence | PASS | No MariaDB error 1021 / OS errno 28 in the recovery server log. Post-test identity remained MariaDB 11.4.8 with D: tmpdir; 17 synthetic products, 12 synthetic orders and 4 synthetic prescriptions persisted. |
| Integrity / ZIP | PASS | 216 source files checked: no conflict markers or trailing whitespace. 261 package-input files matched the isolated tested copy; package/lock dependencies and engines match. Archive manifest matches 213 package payload entries; 214 ZIP entries including manifest. No private paths, database files, seed script, synthetic credentials or non-placeholder credential assignments were found. |

### Final deployment candidate (not deployed)

- New ZIP: `D:\PROJETs\e-agharass-vision-mariadb\dist\hostinger-mariadb-business-20261110-final-recovery.zip`
- Entries: **214**; size: **2,564,768 bytes**.
- SHA-256: **`C96DD002D3C2DC192874DC171B947B36A8FF94B592494019C353AECB2515A3F2`**.
- The package includes `.env.example` placeholders only; no `.env` secrets, private files, test artifacts, database files, or synthetic seed data. The prior 9 November ZIP remains unchanged.
- **Not deployed.** Hostinger hPanel database endpoint/version, grants, prefixed names, connection limits, Node runtime integration, migration privileges, and durable/private storage still require owner verification on Hostinger.

**Final local verdict: `MARIADB LOCAL ACCEPTANCE COMPLETE`. Hostinger readiness is not established.**
