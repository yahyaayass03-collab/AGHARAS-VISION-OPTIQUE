# Performance and runtime audit

**Audit date:** 4 November 2026  
**Application:** AGHARAS VISION OPTIQUE  
**Local URL:** `http://127.0.0.1:3002/`  
**Scope:** Read-only browser baseline in Next.js development mode. No application source was changed during this audit.

> **Follow-up update (4 November 2026):** the isolated verification below supersedes the initial “no production comparison” and “testing blocked” status. It establishes an isolated schema, compares both modes on the same synthetic data, and completes the requested regression suites. It does **not** identify a production-source defect that justifies a speculative optimization.

## Environment and safety

- Confirmed the repository directory is `D:\PROJETs\e-agharass-vision`, package name `agharas-vision-optique`, using Next.js 15.5.28 / React 19.3.1. Existing storefront routes are under `src/app/(site)`, and administrative routes under `src/app/admin`.
- Port 3002 is served by this repository's `next dev` process. Startup log: ready in 12.6s; homepage first compilation 4.7s (815 modules). Port 3000 was not touched.
- Browser identity check returned HTTP 200, title `AGHARAS VISION OPTIQUE | Haute Lunetterie & Verres de Précision`, expected French storefront navigation, and no console/runtime/request errors on that first load.
- Server startup reports `.env.local` and `.env`. Redacted configuration inspection found `DATABASE_URL` points to local database `agharas`, schema `public`; `TEST_DATABASE_URL` points to database `agharas_test`, schema `public`. The browser server uses the former, not the test database. No cart mutation, checkout submission, CMS write, seed, migration, or destructive test was run. **Database isolation for state-changing tests is not established for this running server.**
- Prisma logs only `warn` and `error` in development (`src/lib/db.ts`); no query duration evidence was available. Secrets and connection strings are intentionally omitted.
- Existing reports read: `docs/NAVIGATION_CHECKOUT_STABILIZATION.md` and `docs/NAVIGATION_FREEZE_FIX.md`. Their results apply to prior production-mode tests on isolated schemas/ports, not this current development-browser baseline. The stabilization report records 90 unit tests, 36 E2E tests, and 41 acceptance tests passing in that earlier run; they were not rerun as part of these measurements.

## Measurement method and baseline

Headless Chromium (1440×900) accessed the running local server. Each direct visit waited for `domcontentloaded` and a visible `h1`; the timings therefore approximate browser click/direct-navigation to meaningful page content, not full load or Web Vitals. Initial route requests were made in a fresh browser, followed by three sequential warm visits to catalogue, category, product, and cart. One actual storefront link click from home to catalogue was timed. The initial run also observed browser console, page errors, and failed requests. Results are local development measurements and are not production promises.

| Route / interaction | Before (cold / first observed) | Warm repeats (median / worst) | After | Improvement | Status |
|---|---:|---:|---:|---:|---|
| Homepage | 1,827 ms (fresh browser; server log first response 9,846 ms includes compile) | 1,435 ms (one repeat only) | Not measured | — | 200, correct content |
| Catalogue | 5,577 ms (first compile: 2.3 s) | 1,846 / 1,868 ms (3 visits) | Not measured | — | 200 |
| Category `/catalogue/femme` | 7,269 ms (first compile: 1.318 s) | 1,324 / 1,405 ms (3 visits) | Not measured | — | 200 |
| Product `/produit/silhouette-pure-pantos` | 8,957 ms (first compile: 2.1 s) | 1,587 / 2,276 ms (3 visits) | Not measured | — | 200 |
| Cart `/panier` | 4,338 ms (first compile: 1.77 s) | 1,169 / 1,191 ms (3 visits) | Not measured | — | 200, empty-cart state |
| Checkout `/commande` | 4,389 ms including redirect to `/panier` (first compile: 1.52 s) | Not measured | Not measured | — | Not a checkout form: empty cart redirected (307) |
| Owner login `/connexion` | 2,652 ms (first compile: 1.3 s) | Not measured | Not measured | — | 200 |
| Admin `/admin` | 3,164 ms including redirect to login (first compile: 1.48 s) | Not measured | Not measured | — | 307 to owner login; unauthenticated |
| Product management `/admin/produits` | 3,837 ms including redirect to login (first compile: 1.996 s) | Not measured | Not measured | — | 307 to owner login; unauthenticated |
| Homepage CMS `/admin/apparence` | 4,999 ms including redirect to login (first compile: 2.7 s) | Not measured | Not measured | — | 307 to owner login; unauthenticated |
| Real header/link click `/` → `/catalogue` | 3,533 ms to URL and “La collection” heading | Not measured | Not measured | — | Destination rendered; no browser errors |

Three-visit warm route values (ms): catalogue 1868, 1554, 1846; category 1274, 1405, 1324; product 2276, 1587, 1383; cart 1169, 1191, 1108. The table reports medians rounded to the nearest millisecond. The dev server log after compilation reported homepage 1,227–1,396 ms, catalogue 5,473 ms on its first compiled request, category 7,176 ms, product 8,857 ms, cart 4,258 ms, and subsequent cart/home requests around 1,233–1,345 ms.

## Observed warnings and errors

- No browser console errors, uncaught page exceptions, or failed requests were observed in the baseline route runs.
- Next.js emitted a development-only cross-origin request warning because the browser used host `127.0.0.1` while Next reported `localhost`: “Cross origin request detected from 127.0.0.1 to /_next/* resource. In a future major version of Next.js, you will need to explicitly configure `allowedDevOrigins` …”. It was not accompanied by failed requests or a runtime failure. It has not been suppressed or hidden.
- Node/npm emitted an experimental CommonJS-to-ESM loading warning at startup. This concerns the local Node/npm tooling combination, not a browser application exception.
- No hydration warning or Next.js error indicator was observed in the sampled pages.

## Evidence and conclusions

**Confirmed contributor — development cold compilation.** Each route's initial server request coincided with a route compilation, and the server log separately reports compilation durations from 1.3s to 2.7s after the homepage. This accounts for a substantial part of the first-route delays (especially catalogue, product and administration). The development indicator in that window is consistent with normal route compilation, not a reproduced build failure.

**Still slow after compilation.** Warm full-page visits remained about 1.1–2.3s, and the real homepage-to-catalogue click took 3.533s. These observations mean cold compilation does not explain all reported slowness. This timing includes navigation/network/SSR and content readiness; it does not isolate DB time, RSC transfer, client hydration, or image work. Database query timings, long tasks, Web Vitals, and per-request server timings were not captured, so no database or JavaScript bottleneck is confirmed.

**Interactions and business flows not safely tested.** An add-to-cart action writes cart/cart-item rows in the current development database. Since this server points at `agharas/public`, that action and all checkout/CMS writes were deliberately not triggered. Checkout was only observed redirecting an empty cart to `/panier`; no order was created. Admin routes redirected to login because the browser was unauthenticated; no admin write action was attempted. Product color/gallery and mobile controls were not fully exercised.

**No production comparison or code fix in this pass.** Building/running production while this dev server is active risks sharing `.next` and Prisma generated artifacts. No isolated build output was configured, and source changes would not be evidence-based without isolating the remaining runtime time. Accordingly there are no claimed before/after improvements. The existing stabilization report's production results are historical and are not comparable to this browser baseline.

## Verification counts and blockers

| Check | PASS | FAIL | SKIP | TIMEOUT | Notes |
|---|---:|---:|---:|---:|---|
| Application/browser identity | 1 | 0 | 0 | 0 | Homepage 200, branding/navigation confirmed |
| Read-only route sweep | 11 routes | 0 observed browser errors | 0 | 0 | Includes expected redirect statuses |
| Repeated warm route visits | 12 | 0 observed browser errors | 0 | 0 | Catalogue/category/product/cart × 3 |
| Real link click | 1 | 0 | 0 | 0 | Destination heading rendered in 3,533 ms |
| TypeScript / Vitest / production build / E2E / acceptance in this pass | 0 | 0 | 5 not run | 0 | E2E/acceptance require verified isolated schema; typegen/build can contend with active dev artifacts |
| Checkout/CMS state-changing regressions | 0 | 0 | 2 not run | 0 | Current server uses development schema; writes were prohibited |

## Classification

- **CONFIRMED:** first-visit development compilation adds route-specific waits; the current dev app responds correctly for sampled read-only pages; unauthenticated admin and empty-cart checkout redirects behave as observed.
- **NOT REPRODUCED:** browser runtime errors, failed requests, hydration failures, stuck loading, or checkout confirmation timeouts in this read-only session.
- **UNRESOLVED:** warm navigation remains slow (including 3.533s measured link click); source of the remaining latency is not yet isolated. Production-vs-development comparison, database query durations, authenticated admin interactions, cart mutations, guest order submission/confirmation, mobile interactions, and full regression suites remain unmeasured here.
- **FIXES:** none made. No confirmed application defect justified a safe source change from the available evidence.

**Verdict:** application identity/accessibility is confirmed, but the reported responsiveness problem is **not established as resolved**. The next safe diagnostic step is a controlled production run with isolated build artifacts and a dedicated synthetic PostgreSQL schema, plus server/query timing instrumentation and authenticated Playwright coverage. Do not use the current `agharas/public` database for state-changing tests.

---

## Isolated performance verification — 4 November 2026

### Test isolation and build setup

- Reused the configured local `TEST_DATABASE_URL` only as a connection to the dedicated database `agharas_test`; created the new schema `agharas_perf_20261104_a` after verifying the schema did not exist. `DATABASE_URL` was overridden per process to that schema for migration, seed, builds, and tests. The development target `agharas/public` was never migrated, seeded, reset, or written by these tests.
- Applied the current Prisma model with `prisma db push --skip-generate` to the new empty schema. A read-only identity/count check confirmed `current_database() = agharas_test`, `current_schema() = agharas_perf_20261104_a`, and zero products before running the ordinary non-reset seed. The seed created synthetic demonstration users, products, stock, and content; audit setup created synthetic audit users and explicit synthetic compatibility approvals.
- Production build output: `.next-perf-prod`; E2E build output: `.next-perf-e2e`; development profiling output: `.next-perf-dev`. `next.config.ts` supports `NEXT_DIST_DIR`, defaulting to `.next`, and `.gitignore` excludes these local artifacts. Builds and server lifecycles were sequential where Prisma generation could contend. Port 3000 remained owned by the unrelated OptiGest process and was not touched.
- Optimized production server was verified as Agharas on port 3102. The E2E and acceptance servers ran on 3104 and 3105 respectively, with the same schema and fixture data. A first acceptance setup attempt timed out before tests because `OWNER_EMAIL` did not match `audit.admin@audit.local`; after matching the synthetic owner identity, setup and all tests passed. No authentication rule was weakened.

### Comparable performance measurements

Browser measurements used headless Chromium, 1440×900, the same synthetic schema/data, and five direct visits per route in each server mode. Each navigation waited for `domcontentloaded` plus a visible first `h1`; values below are wall time through that readiness. A real catalogue link click waited for both the URL and catalogue heading. Production values are from an optimized Next build; development includes the normal Next dev server and HMR instrumentation. “Before” is the earlier baseline on the development database and is included for context only, not as an apples-to-apples data comparison. Administrative URLs redirect to login in unauthenticated timing samples; authenticated admin functionality was checked separately by E2E/acceptance.

| Route / action | Dev median | Production median | Earlier baseline | Production after | Status |
|---|---:|---:|---:|---:|---|
| Homepage | 1,360 ms | 411 ms | 1,435 ms warm | 411 ms | 200; 5 runs each |
| Catalogue | 1,477 ms | 531 ms | 1,846 ms warm | 531 ms | 200; 5 runs each |
| Category `/catalogue/femme` | 1,274 ms | 418 ms | 1,324 ms warm | 418 ms | 200; 5 runs each |
| Product detail | 1,430 ms | 506 ms | 1,587 ms warm | 506 ms | 200; 5 runs each |
| Cart | 1,042 ms | 416 ms | 1,169 ms warm | 416 ms | 200; empty synthetic cart |
| Checkout URL | 1,670 ms | 582 ms | 4,389 ms including redirect* | 582 ms | Empty cart redirects to cart; checkout form covered by order tests |
| Owner login | 580 ms | 226 ms | 2,652 ms first compile | 226 ms | 200; 5 runs each |
| Admin dashboard URL | 899 ms | 288 ms | 3,164 ms first compile | 288 ms | Redirect to login; see authenticated suite |
| Product management URL | 979 ms | 182 ms | 3,837 ms first compile | 182 ms | Redirect to login; see authenticated suite |
| Homepage CMS URL | 954 ms | 303 ms | 4,999 ms first compile | 303 ms | Redirect to login; see authenticated suite |
| Actual home → catalogue click | 3,136 ms | 384 ms | 3,533 ms, single sample | 384 ms | 5 runs; medians, no browser errors |

`*` Earlier checkout baseline was a stale-cart redirect and is not directly comparable. Warm development medians/worst samples (ms) were: homepage 1,360/1,737; catalogue 1,477/1,610; category 1,274/1,431; product 1,430/1,728; cart 1,042/1,773; checkout redirect 1,670/1,767; login 580/690; admin redirect 899/940; product-admin redirect 979/1,623; CMS redirect 954/1,011. Production medians/worst were respectively 411/962, 531/571, 418/622, 506/748, 416/505, 582/599, 226/327, 288/305, 182/290, and 303/318 ms. Production click-to-heading samples were 496, 282, 312, 526, 384 ms (median 384, worst 526); development samples were 3,045, 3,033, 3,596, 3,136, 3,418 ms (median 3,136, worst 3,596).

The production `/catalogue` navigation timing entry reported TTFB 147–232 ms across samples; product detail 150–276 ms; homepage 104–245 ms. Direct development warm TTFB was generally 700–1,450 ms. E2E route-click diagnostic samples ranged 146–643 ms on the optimized server. These are local measurements, not field Web Vitals. Main-thread long-task attribution and full resource waterfall byte accounting were not successfully captured.

### Bottleneck findings

- **Dominant observed difference: development server/RSC response overhead.** With identical database fixture and browser conditions, warmed development TTFB remained roughly 0.7–1.45s and real home-to-catalogue readiness about 3.1s. Optimized production page medians were 0.18–0.58s and the same real link click 0.28–0.53s. Development route logs additionally show per-route compilation on first visit (about 1.1–3.1s in this follow-up); earlier cold routes logged 1.3–2.7s compilation. This explains the development indicator and most measured slow navigation, but not every development warm delay.
- **PostgreSQL is not the dominant route bottleneck in this local test.** Prisma query-event probes on the synthetic schema measured catalogue count at 2 ms median; representative product-query SQL events were generally 0–7 ms each after the initial connection, with ORM operations around 6–32 ms elapsed after warmup. These probes isolate DB calls and do not measure pool saturation or production-network latency. No evidence supports adding indexes or changing query plans.
- **No critical App Router destination failure reproduced.** Rapid-navigation and mobile E2E cases completed. Browser diagnostics observed aborted speculative `?_rsc=` prefetches when navigation moved on, but no failed destination requests, page exceptions, or failed HTTP requests. They are reported as cancelled stale prefetches, not concealed as runtime errors.
- **No confirmed production React/client bottleneck.** Production bundle report shows 103 kB shared first-load JS (116 kB homepage first load, 115 kB catalogue, 118 kB product); this is not unusually large enough, by itself, to explain the measured seconds. Main-thread long tasks and mobile device throttling were not measured.
- **No application-data optimization was applied.** The product route source contains separate product reads for metadata and page render, but measured production response time and direct SQL durations do not show that query as the dominant bottleneck. Combining them would enlarge/complicate request caching and require invalidation review; it is deferred absent a measurable benefit. CMS, stock, price and optical rules remain unchanged.

### Interaction, checkout, and regression verification

- E2E: **36 PASS / 0 FAIL / 0 SKIP / 0 TIMEOUT**. Includes navigation destination readiness, rapid route changes, mobile menu, guest COD checkout/confirmation, admin navigation, and invalid-product 404.
- Acceptance: **41 PASS / 0 FAIL / 0 SKIP / 0 TIMEOUT** after correcting the synthetic owner identity. Includes one-order idempotency under simultaneous checkout, exact server-side price checks, stock movement and restoration, compatibility approval flow, product publication/depublication, and CMS write/revalidation without rebuild.
- Vitest: **90 PASS / 0 FAIL / 0 SKIP / 0 TIMEOUT** across 11 files, including six PostgreSQL integration cases, with `TEST_DATABASE_URL` set to the isolated schema.
- TypeScript: `npm run typecheck` PASS (exit 0). Production build: PASS (exit 0) into `.next-perf-prod`; E2E's isolated production build also passed before 36 tests.
- The guest checkout flow created and rendered COD confirmations; duplicate submission test asserted a single order. No payment provider was enabled. Synthetic changes remain inside `agharas_test/agharas_perf_20261104_a`.
- The E2E navigation diagnostics recorded no browser errors or failed destination requests; `ERR_ABORTED` speculative prefetch requests were recorded when tests rapidly navigated elsewhere.

### Files and final status

- `next.config.ts`: optional isolated `NEXT_DIST_DIR`, preserving default `.next` behavior.
- `.gitignore`: ignores the isolated profiling/build output folders.
- `tsconfig.json`: Next.js typegen added generated `types` includes for isolated build directories.
- `docs/PERFORMANCE_RUNTIME_AUDIT.md` and `docs/IMPLEMENTATION_PROGRESS.md`: measurements, conclusions, and regression status.

**Outcome:** the severe navigation delay is demonstrated primarily in development mode; production on the same synthetic data is sub-second in the sampled routes and click. The repeatable production navigation freeze was not reproduced, and checkout/CMS/optical regressions passed. No application runtime optimization was warranted by the measured database/client evidence. Development warm latency remains above production and is an unresolved local-dev experience; production has not been tested under real network/load conditions. This is not a deployment or full production-readiness claim.

Final server identity check: both `http://127.0.0.1:3002/` (development) and `http://127.0.0.1:3102/` (optimized local production, synthetic schema) returned HTTP 200, the Agharas title/hero, and no browser console/runtime errors. The unrelated port-3000 listener remained unchanged.
