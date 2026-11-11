# Navigation Freeze Investigation and Fix

## Current outcome — verified for this stabilization scope

The global loading boundary was removed after live testing showed it could stream an HTTP 200 shell for a missing dynamic product even though the page eventually rendered French 404 content. The route now returns HTTP 404 and the regression asserts both status and rendered text. The complete production E2E suite (36/36) and a focused checkout/navigation rerun (8/8) passed after recovery of the isolated build/server environment.

The mobile drawer's standard same-origin links remain in place. Production-mode browser suites covered catalogue/category/product/cart and admin navigation, direct access, refresh, rapid navigation, back/forward, mobile Contact, and missing-product 404. There were no unexpected browser errors or failed requests. Next's obsolete speculative RSC prefetches were aborted during fast navigation; destination navigations completed and rendered. This is not evidence that the underlying prior intermittent cancellation trigger has been identified.

## Evidence and limits

- Runtime inventory: Next.js 15.5.28, React/React DOM 19.3.1, Prisma 6.19.3. Node 22.23.0 was explicitly used for build and Playwright (PATH Node is 23.1.0). The project-owned dev server on port 3000 was identified (Next CLI PID 8036 / server PID 14896) and stopped with SIGTERM before build to avoid shared `.next` and Prisma engine contention; PostgreSQL on 5432 remained running.
- Before removal, `GET /produit/__navigation_probe_missing__` returned 200 while displaying the not-found page. After removal, browser navigation returned 404. Adding `notFound()` to metadata alone did not change the response while the root loading boundary remained.
- Manual development-browser navigation after the correction rendered homepage, catalogue, Homme category, product, cart, FAQ, Contact, legal/content, login/admin entry, and 404 paths; back/forward returned to rendered destinations. No unexpected page errors/request failures were recorded in the completed pass. An earlier manual-script attempt used an incorrect selector and is not counted as an application failure.
- Previous traces were unavailable. Fresh production traces were configured as `retain-on-failure`; the passing runs produced no failure trace. Diagnostic logs are in the temp paths listed in `NAVIGATION_CHECKOUT_STABILIZATION.md`.
- The previous temporary-clone/junction workaround failed Next client-module resolution using an absolute Windows path and later exhausted memory. It was abandoned. Running the actual project in place, after stopping only the identified dev server, built successfully.

## Corrections in this stabilization

- Removed `src/app/loading.tsx`: the root streaming boundary was associated with the confirmed missing-product HTTP status regression. No replacement global fallback is claimed as a fix.
- `tests/e2e/navigation.spec.ts`: added a regression requiring an actual 404 response and the French not-found message.
- `src/app/actions/cart.ts`, `src/app/actions/checkout.ts`, and `src/app/actions/admin/system.ts`: removed broad/redundant revalidation from the relevant action success paths. Their redirects/forms already use dynamic database/cookie-backed pages. The current flows passed fresh production browser tests; whether removing revalidation alone caused the improvement is not established.
- `src/components/site/MobileMenu.tsx`: standard anchors remain limited to the drawer; there was no blanket replacement of `Link` components.

## Verification snapshot

- TypeScript: PASS (`npm run typecheck`).
- Vitest: PASS, 90/90 across 11 files.
- Production build: PASS (exit 0, Prisma generation + `next build`).
- Focused production checkout/navigation: 8/8 PASS. Full E2E: 36/36 PASS. Full acceptance: 41/41 PASS, no skips.
- Earlier manual development-browser run also passed its selected route/history/mobile/404 paths; it is supplementary, not the basis for production verification.

The previous intermittent App Router cancellation trigger remains unproven, but it was not reproduced as a failed destination in the fresh full or focused production-browser suites. See [`NAVIGATION_CHECKOUT_STABILIZATION.md`](NAVIGATION_CHECKOUT_STABILIZATION.md) for environment diagnosis, historical failure analysis, exact counts, logs, and scope limitations. This verification is not a production-readiness declaration.
