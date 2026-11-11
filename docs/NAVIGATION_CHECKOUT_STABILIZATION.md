# Navigation and guest-checkout stabilization

**Date:** 3 November 2026  
**Verdict: ACCEPTED — VERIFIED** for the requested stabilization/regression scope. This is **not** a production-readiness declaration.

## Environment recovery and exact blockers

### Original production-build blockage

The build script is `npm run build` → `prisma generate && next build`. The original project dev server and production build shared the project `.next` output and Prisma Windows engine under `node_modules`. The prior investigation recorded an `EPERM` rename failure while that dev server held the Prisma engine. The old console artifact was no longer available, so an exact prior Windows error path/line cannot be recovered. This was a process/file-lock contention, not an application compilation error.

For this recovery, the project processes were identified before touching them: Next server PID 14896, Next CLI PID 8036, launcher PID 3236; they belonged to this repository and owned port 3000. Only that project server tree was stopped via SIGTERM. PostgreSQL PID 6744 on port 5432 remained running. Running the actual project build after that produced `Compiled successfully`, completed static generation/tracing, and exited **0**. Prisma Client 6.19.3 generated successfully. The controlled build was repeated after the final test edit and again exited 0. The successful logs are:

- `C:\Users\admin\AppData\Local\Temp\opencode\stabilization-build.log`
- `C:\Users\admin\AppData\Local\Temp\opencode\stabilization-build-final.log`

No application compilation error, dependency absence, port conflict, or permission failure occurred in the successful run. Node 22.23.0 was explicitly selected; PATH Node was 23.1.0.

### Previous harness failures and recovery

- A prior temporary clone/junction attempt failed Next module resolution (`Can't resolve './D:/PROJETs/e-agharass-vision/node_modules/next/dist/client/...`), then exhausted memory during workarounds. This was caused by the copied/junctioned harness layout, not source compilation. That clone approach was abandoned; no dependencies were reinstalled.
- The first acceptance attempt on port 3111 failed before test execution: Playwright global setup timed out at `tests/audit/global-setup.ts:79` while logging in. The server had `OWNER_EMAIL=admin@agharas.local`, while the synthetic fixture is `audit.admin@audit.local`. Production `isOwner()` correctly rejected the mismatched fixture. Setting the isolated server's `OWNER_EMAIL` to the synthetic audit owner allowed setup and the suite to pass. No authorization code or assertions were weakened.
- One initial E2E invocation was prematurely terminated by PowerShell's native-stderr handling on a Prisma deprecation warning; rerunning through `cmd.exe` with stdout/stderr redirected executed the suite normally. This was a shell capture/invocation issue, not a Playwright or application failure.

## Runtime and database isolation

- Versions: Next.js 15.5.28; React/React DOM 19.3.1; Prisma/client 6.19.3; Playwright 1.64.1.
- E2E production server used port **3110** and its `webServer` build/start lifecycle. Acceptance used a separately launched production server on port **3111**. Runs were sequential; no dev/build/test servers competed for `.next`.
- Three fresh schemas inside local `agharas_test` were independently migrated and seeded:
  - `agharas_recovery_e2e_20261103_a`
  - `agharas_recovery_audit_20261103_b`
  - `agharas_recovery_focus_20261103_a`
- E2E/acceptance environment variables pointed at those schemas; the development `agharas/public` schema was not used for test writes. No destructive migration, reset, or deployment occurred. PostgreSQL remained running. Online payments stayed disabled.
- Test logs are in the approved temp directory:
  - Full E2E: `C:\Users\admin\AppData\Local\Temp\opencode\recovery-e2e.log`
  - Focused E2E: `C:\Users\admin\AppData\Local\Temp\opencode\recovery-focused-e2e.log`
  - Final acceptance: `C:\Users\admin\AppData\Local\Temp\opencode\recovery-audit-final.log`
  - Earlier acceptance setup failure: `C:\Users\admin\AppData\Local\Temp\opencode\recovery-audit.log`
- Playwright uses `retain-on-failure`. The final browser runs passed, so no failure trace or screenshot was produced. The first acceptance failure was in global setup before a test case and had no test trace. Historical traces remain unavailable.

## Application findings and changes

### Missing-product status and navigation

Removing the root `src/app/loading.tsx` boundary corrected the reproducible missing dynamic product response: content remains the French not-found page and HTTP is now **404**. `tests/e2e/navigation.spec.ts` asserts both the real response status and the visible French not-found message.

Production E2E navigation covered ordinary links, product/cart, rapid route changes, direct URLs and refresh, history back/forward, the mobile drawer, and owner dashboard modules. No page errors or unexpected failed requests occurred. Logs include aborted `?_rsc=` speculative prefetches while navigation moved on; these are expected obsolete-prefetch cancellations, and the current destinations completed and rendered. The precise trigger of the earlier intermittent App Router cancellation remains unknown; no destination freeze was reproduced in the full or focused suite.

### Checkout, idempotency, and settings

The focused checkout/navigation suite passed the guest COD journey through the rendered confirmation. The full acceptance suite additionally verified current price validation, optical configuration/manual prescription, order snapshot/stock movement, invalid submission rejection, and simultaneous stale-cart submission producing exactly one order. A new assertion in `tests/audit/01-purchase.spec.ts` reloads the confirmation, verifies the same reference/message, and verifies exactly one order for the guest email.

Settings verification passed both ordinary settings persistence and the WhatsApp setting action: success feedback appeared, the database value changed, and fresh public routes reflected it without a rebuild. Cleanup/restoration returned settings to their seeded values.

The earlier timed-out order records showed server persistence but did not establish which browser stage had stalled. After removing broad revalidation from cart-add/checkout/settings success paths, the fresh browser flows passed. This is evidence the current paths work, but it does not prove revalidation removal alone caused the earlier failures. No further production-source changes were made during this environment recovery.

### Historical acceptance failures and skips

The former **12 PASS / 6 FAIL / 23 SKIP** result is superseded by the fresh complete acceptance run: **41 PASS / 0 FAIL / 0 SKIP / 0 TIMEOUT**. All six formerly failing paths passed, including cart-to-checkout/confirmation, inactive product HTTP 404, confirmation-token privacy, coupon checkout, optical-price checkout, and WhatsApp owner feedback/public propagation.

The historical per-test attribution of all 23 skips cannot be reconstructed because earlier traces/reports had been removed; recorded evidence showed skips cascading in serial/dependent suites after failures. In the fresh run no test was skipped, and all 41 registered tests executed. No skip is counted as a pass.

## Exact verification results

| Suite/check | PASS | FAIL | SKIP | TIMEOUT | Outcome |
|---|---:|---:|---:|---:|---|
| TypeScript (`npm run typecheck`) | 1 command | 0 | 0 | 0 | PASS, exit 0 |
| Vitest (`npm test`) | 90 tests / 11 files | 0 | 0 | 0 | PASS, exit 0 |
| Production build (`npm run build`) | 1 command | 0 | 0 | 0 | PASS, exit 0; Prisma generate + Next build |
| Focused E2E (`checkout.spec.ts`, `navigation.spec.ts`) | 8 | 0 | 0 | 0 | PASS, 1.2m |
| Full E2E | 36 (including setup) | 0 | 0 | 0 | PASS, 1.6m |
| Full acceptance audit | 41 | 0 | 0 | 0 | PASS, 2.0m |

Full E2E included the guest checkout confirmation and missing-product status regression. Acceptance included confirmation refresh/no duplicate, simultaneous duplicate submission, optical/security, stock, settings, and CMS checks. There were no final failures to diagnose or failure traces to attach.

## Database and integrity observations

- E2E schema: 2 synthetic COD orders were subsequently cancelled by the test cleanup workflow, with 2 SALE movements and no duplicate idempotency-key groups.
- Acceptance schema: tests created 6 synthetic orders in addition to the seeded historical demonstration order; transitions/cancellations were exercised. There were zero duplicate idempotency-key groups. The simultaneous submission assertion passed with one order for its email.
- Settings were restored to seeded phone/WhatsApp values after test actions. Test data exists only in the named isolated schemas and was not deleted/reset after the run.
- The investigation did not modify historical records in the development schema. No payment provider was enabled; no deployment occurred.

## Files changed in this recovery

- `tests/audit/01-purchase.spec.ts`: refreshes a valid confirmation and asserts the reference remains visible and exactly one order exists.
- `docs/NAVIGATION_CHECKOUT_STABILIZATION.md`: this final report.
- `docs/NAVIGATION_FREEZE_FIX.md`: corrected outcome/evidence after production verification.
- `docs/IMPLEMENTATION_PROGRESS.md`: updated current status, preserving historical entries below.

The prior stabilization's loading-boundary removal, targeted action revalidation changes, and 404 regression remain in the working tree; they were verified but not reimplemented here. Pre-existing unrelated modifications were preserved.

## Remaining uncertainty and verdict

The precise internal trigger for the historical App Router cancellation is unproven. Fresh full and focused production-browser suites recorded expected aborted speculative prefetches but no failed destination or reproducible freeze. The exact attribution of the historical 23 skips is also unavailable, although the fresh suite executed all 41 tests with none skipped. The old checkout failures' precise stalled stage is unrecoverable from deleted traces; current checkout, refresh, idempotency, stock and confirmation tests pass.

**Final verdict: ACCEPTED — VERIFIED** for this stabilization scope: production build, complete E2E and complete acceptance all pass on isolated synthetic schemas, with no current reproducible critical navigation or checkout failure. This is not a claim that the application is production-ready, nor proof that every historical intermittent App Router cancellation trigger has been identified.
