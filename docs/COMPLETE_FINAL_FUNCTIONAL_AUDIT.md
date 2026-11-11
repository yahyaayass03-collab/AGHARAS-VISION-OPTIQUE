# Complete final functional audit — customer and owner

**Audit date:** 8 November 2026  
**Scope:** local Agharas customer storefront and owner dashboard, using real Chromium interactions and persistence checks. Audit only; no application business logic or UI was changed for this report.  
**Verdict:** local software workflows are broadly functional, but the site is **not approved for real corrective-lens commerce or business launch**. See separate verdicts below.

## Executive summary

| Area | Result | Basis |
|---|---|---|
| Customer storefront | **PASS** (local software workflows) | Public routes and 4 key catalogue states; cart/favorites/contact/checkout interactions; pricing, inventory, outbox and synthetic order persistence; responsive checks. |
| Owner dashboard | **PASS** (local software workflows) | 22 admin routes returned 200; selected pages checked at 390/768/1024/1440; acceptance suite and additional UI-driven CRUD/persistence/public-propagation checks. |
| Optical workflows | **PARTIAL** | Rules are enforced and test-only exact approvals allow the synthetic pathway; no professional approval or actual clinical readiness is asserted. |
| Overall local functional status | **PARTIAL** | Core local workflows work; content/marketing limitations and professional/owner approvals remain. |

The acceptance Playwright suite passed **44/44** and the separate production E2E suite passed **36/36**. Vitest passed **122/122**. These are supporting evidence, not a claim that every control or business decision has been accepted. No real email, online payment, hosting or deployment was used.

## Safety, environment and data integrity

- Both audit schemas were created only inside the local `agharas_test` database after checking database, host, schema and pre-create state. Migrations were applied to the newly created schemas only.
- Acceptance schema: `agharas_test.agharas_audit_20261108_01`; E2E/manual schema: `agharas_test.agharas_audit_e2e_20261108_01`. Synthetic approval fixtures exist only in the acceptance schema and are test-only.
- Presentation demo schema: `agharas_test.agharas_demo_refresh_20261108_01`. Final observed counts remained **12 products, 1 order, 0 compatibility rules**. Port **3106** was restored and confirmed listening after an environment restart. No migration, seed or audit mutation was run on it.
- The E2E schema contains only synthetic test data and audit-created records. Customer confirmation preference was restored through owner UI to `false`; temporary lens prices, shipping settings and content-page edits were restored and checked. The synthetic store, FAQ, contact, newsletter-evidence absence, orders and audit fixtures remain in this disposable schema.
- Email transport was discard-only; no external email was delivered. Cash on delivery was the only exercised payment; no real payment gateway was enabled. No deployment or hosting connection occurred.
- Existing uncommitted implementation work was preserved.

## Coverage matrix

`YES` means exercised in this audit or the cited suite on the isolated synthetic schemas. “Security” is scoped to the listed route/action or data path; it is not a general penetration test.

| Module / feature | Implemented | Browser tested | Persistence verified | Security verified | Expected and observed result / evidence | Status / severity |
|---|---:|---:|---:|---:|---|---|
| Public shell, homepage, banners, collections, featured products, footer and contact links | YES | YES | N/A | N/A | Homepage and primary public routes 200; optimized images separately observed loaded. See `artifacts/complete-functional-audit/customer/`. | PASS |
| Public catalogue: search, category, brand, sort, pagination, empty/invalid query | YES | YES | N/A | N/A | Known/empty search, category routes, invalid sort/page and selected filters returned usable 200 states; no horizontal overflow at tested widths. `customer-baseline.json`, screenshots. | PASS |
| Product detail, variants, gallery, price/stock, configurator entry | YES | YES | YES via checkout suite | YES via server-side acceptance | Seed product route 200; images loaded; unknown product returned expected 404. Purchase and server-price/tampering checks in acceptance suite. | PASS |
| Optical inputs and compatibility decisions | YES | YES | YES | YES | Synthetic compatibility evaluator and exact match flows covered by acceptance; pending/incompatible combinations are blocked, test-only approved combinations are allowed; technical parsing does not assert clinical plausibility. Progressive/ADD/EP are unavailable as required. | PARTIAL — OPTICIAN APPROVAL REQUIRED |
| Cart add, quantity, totals, refresh and remove | YES | YES | YES | YES via acceptance | Manual browser add→quantity 2→reload retained state; removal emptied UI and database. `customer-cart-interactions.json`. | PASS |
| Cart stock/publication/stale optical snapshot guards | YES | YES | YES | YES | Stale cart and forged/stale requests exercised by acceptance tests; unsafe products/rules are revalidated server-side. | PASS |
| Guest checkout, COD, totals, duplicate submission, failure handling | YES | YES | YES | YES | Acceptance covers COD, authoritative prices, validation and simultaneous duplicate submission. Manual order `AVO-2026-964F1994` persisted as PENDING/COD with correct arithmetic. | PASS |
| Inventory sale and stock integrity | YES | YES | YES | YES | Checkout created a `SALE` movement and decremented the ordered variant; acceptance covers atomic stock/idempotency and nonnegative stock. | PASS |
| Guest favorites | YES | YES | YES | YES via acceptance | Added in browser, persisted and appeared on `/favoris`; no customer account required. | PASS |
| Contact form and owner inbox | YES | YES | YES | YES via acceptance | Synthetic contact appeared as NEW in database and owner inbox. UI promises a response within 24 business hours; no automated contact email is sent. See defect/gap register. | PARTIAL — OWNER OPERATIONAL APPROVAL |
| Newsletter | PARTIAL | YES (absence) | N/A | N/A | Homepage explicitly states signup is unavailable; no form is mounted. A standalone action/component exists in source but is not an entry point. No registration was attempted. Existing inventory/copy around benefit/unsubscribe must not be treated as an active service. | PARTIAL — OWNER APPROVAL REQUIRED |
| Public legal, delivery, return, privacy and about pages | YES | YES | YES through CMS | N/A | Routes returned 200. The content values and factual/business/legal assertions are not validated by a software audit. | OWNER APPROVAL REQUIRED |
| Store directory | YES | YES | YES | YES via owner permission checks | Synthetic store created through owner UI, persisted and appeared publicly. Real locations/hours/contact must be owner-supplied. `owner-additional-crud.json`. | PASS technically / OWNER APPROVAL REQUIRED |
| Owner authentication and route access | YES | YES | YES | YES | Synthetic owner signed in; protected route suite and unauthorized-action coverage passed. 22 admin routes returned 200 as authenticated owner. | PASS |
| Owner dashboard, metrics, navigation and empty states | YES | YES | N/A | YES | Dashboard route and primary controls rendered; route and acceptance coverage passed. No full accounting reconciliation against real business data is claimed. | PASS locally |
| Product CRUD, variant/stock, image upload/reorder, publication/archive | YES | YES | YES | YES | Acceptance CRUD/image/publication/archive and stock movement checks passed; persistence assertions ran against acceptance schema. | PASS |
| Category/brand CRUD and assignment | YES | YES | YES | YES | Manual browser created category and brand, assigned both to a product; catalogue category and brand views showed it. Category edit persisted. `owner-crud-interactions.json`. | PASS |
| Lens types, index, treatment and price management | YES | YES | YES | YES | UI edited and restored one of each price; database values confirmed. Progressive remained inactive. `owner-additional-crud.json`. | PASS technically / OPTICIAN APPROVAL REQUIRED |
| Compatibility review/search/status and decision workflow | YES | YES | YES (synthetic fixtures) | YES | Acceptance covers review controls and exact rule persistence; no real approval was created. | PARTIAL — OPTICIAN APPROVAL REQUIRED |
| Prescription upload, validation, private persistence, authorized retrieval and denial | YES | YES | YES | YES | Synthetic prescription roundtrip/security tests passed in acceptance suite; private storage and unauthorized/public access checks are synthetic only. Retention/deletion policy is not established. | PASS technically / OWNER & OPTICIAN APPROVAL REQUIRED |
| Order list/detail, status/payment/stock history | YES | YES | YES | YES | Owner routes passed; transition, cancellation stock restoration, privacy and duplicate/action guards covered by suites. No real payment capture occurred. | PASS |
| Transactional order email / retry / ambiguous SENDING | YES | YES | YES | YES | Checkout queued owner and optional customer rows; discard transport persisted both as DISCARDED. Synthetic FAILED row retried to DISCARDED (attempts 2); SENDING remained SENDING and displayed “En cours”. `email-outbox-interactions.json`. | PASS locally; real SMTP HOSTING DEFERRED |
| CMS page edit and public propagation | YES | YES | YES | YES | About-page marker appeared publicly after owner save without rebuild; content restored via UI and compared to baseline (line endings normalized). `owner-content-page.json`. | PASS |
| CMS FAQ and store public propagation | YES | YES | YES | YES | Synthetic FAQ saved and appeared publicly; synthetic store saved and appeared publicly. | PASS |
| CMS banners, homepage ordering/visibility and featured state | YES | YES | Acceptance assertions | YES | Route/forms and suite coverage passed; broad manual mutation of every banner/layout control was not performed. | PARTIAL (control-by-control manual verification not exhaustive) |
| Store settings, shipping options, threshold, COD and email preference | YES | YES | YES | YES | Threshold and standard delivery method changed through owner UI, appeared at checkout, then restored. COD remained visible. Email confirmation preference restored to false. `owner-shipping-settings.json`, `customer-email-checkout.json`. | PASS locally |
| Responsive storefront and owner UI | YES | YES | N/A | N/A | Customer homepage/catalogue/product/configurator at 390/768/1024/1440; no measured horizontal overflow. Owner route sweep: 22 routes at desktop and selected core routes at all 4 widths; no overflow. | PASS for tested widths/routes |
| Keyboard, modal accessibility and assistive tech | PARTIAL | PARTIAL | N/A | N/A | Keyboard interaction has targeted coverage, but no complete keyboard-only/axe/screen-reader audit was performed. | NOT TESTED comprehensively |
| Hosting, remote storage, production SMTP, external payment | NO / deferred | NO | NO | NO | Explicitly out of audit scope; local discard/filesystem and COD only. | HOSTING DEFERRED |

## Customer workflow findings

1. **Browse:** 18 normal customer/content routes returned HTTP 200; missing product returned 404. Catalogue included successful known search, explicit no-result, sort and invalid page/sort states. Homepage/catalogue/product/configurator screenshots exist at the widths listed above.
2. **Configure:** synthetic optical decisions are exact-match and server-enforced. Pending and incompatible paths fail closed; test-only approved combinations can complete. Progressive was inactive and absent; no ADD/EP fields are offered. No clinical plausibility or fit judgment is claimed.
3. **Cart:** actual browser add, quantity update, refresh, total display and remove were verified against persisted cart rows. Guest favorites also persisted.
4. **Checkout:** the acceptance suite tested the customer journey, invalid requests and duplicate submission; a separate synthetic order verified COD status, total arithmetic, sale movement and discard-only notification rows. No external delivery occurred.
5. **Contact and newsletter:** contact writes to the owner inbox; the promised response time is operational and not automated. Newsletter signup is explicitly unavailable on the current homepage; the standalone subscription action has no mounted customer entry point.

## Owner workflow findings

- All **22 enumerated admin paths** returned 200 in authenticated browser navigation. Core dashboard/catalogue/order/lens/CMS/settings surfaces were also checked at 390, 768, 1024 and 1440 pixels; no browser exception, failed destination request or overflow was recorded in that sweep.
- Automated acceptance includes owner product CRUD, image workflow, stock, order transitions, permissions, CMS, optical review, prescription access and email paths (44/44).
- Independent manual persistence checks confirmed category and brand creation/assignment, category edit, lens/index/treatment price changes and restoration, store creation/public listing, FAQ creation/public listing, shipping option/threshold propagation and restoration, and page edit/public propagation and restoration.
- A full manual click-through of every individual dashboard control (notably every banner ordering/visibility control, all filters/pagination combinations, and every upload/reorder permutation) was not exhaustive. These areas are covered in part by source review and automated assertions and are not represented as 100% control coverage.

## Confirmed defects and actionable gaps

No reproducible software defect was confirmed in the tested customer or owner workflows. The following are functional/commercial gaps or approval blockers, not permission to invent copy or bypass safeguards:

| Priority | Finding | Classification / severity | Reproduction / evidence | Required action |
|---|---|---|---|---|
| P0 before corrective-lens sales | No real exact compatibility approvals from a qualified optician. A “test-only approved” rule is not a business decision. | OPTICIAN APPROVAL REQUIRED; launch blocker, not a software defect | Attempt an unapproved product/variant/lens/index/treatment combination; UI/action/cart/checkout reject it. Acceptance fixtures are isolated and labelled test-only. | Qualified professional supplies/approves exact rule set and review process; retain fail-closed behavior until then. |
| P1 before legal/business launch | Legal/commercial pages, warranty, delivery, insurance, store/contact details and customer-facing claims are not validated against real business facts. | OWNER APPROVAL REQUIRED; launch blocker | Inspect `/livraison`, `/retours`, `/mentions-legales`, `/confidentialite`, `/cgv`, `/a-propos`, homepage and `/boutiques`. Browser availability is not factual/legal validation. | Owner/legal reviewer approves exact data and terms; no agent-generated facts. |
| P1 operational | Contact page says the team responds within 24 business hours, but contact submission only persists the message; it does not queue an automatic acknowledgement or create an SLA mechanism. | PARTIAL; operational risk, not broken persistence | Submit synthetic contact at `/contact`, then inspect owner inbox and outbox: NEW message exists, no contact notification is queued. | Owner must either staff/monitor the inbox and own the SLA, or approve a real notification workflow and wording. |
| P2 marketing | Newsletter is not available from homepage; the form/action component exists but is not mounted. No signup, one-click unsubscribe or benefit fulfillment was exercised. | PARTIAL / OWNER APPROVAL REQUIRED | Open `/`; no `#newsletter-email` field; page states signup is unavailable. | Decide whether to launch newsletter; approve consent, privacy, unsubscribe, benefit/coupon and delivery operations before mounting it. |
| P1 privacy/compliance | Prescription retention/deletion period and operating procedure remain unresolved. | OWNER / PRIVACY APPROVAL REQUIRED | Technical synthetic private-storage/access tests pass; this audit did not invent retention policy or inspect any real prescription. | Set and implement approved retention, deletion, access review and incident procedures before real use. |
| P2 reliability | Outbox `SENDING` is inherently ambiguous after a worker/process interruption and is not automatically reconciled; current UI correctly shows “En cours”. | Known limitation; not a reproduced defect | Synthetic SENDING notification remained SENDING after FAILED retry was processed. | Before unattended hosted delivery, define timeout/reconciliation and operator recovery policy; avoid claiming exactly-once delivery. |
| P2 test coverage | The full set of admin controls and all keyboard/assistive-technology flows were not exhaustively exercised manually. | NOT TESTED comprehensively | See scope above; route sweep and suites are not a substitute for full control-by-control/axe testing. | Complete owner UAT and accessibility pass before final acceptance. |

## Optical safety and prescriptions

- Progressive remains disabled for new sales; ADD and EP are absent from the customer form. Technical validation does not label unusual but technically parseable values as medically implausible.
- Compatibility is a precise product/variant/lens/index/treatment decision. Pending and incompatible combinations are blocked at server/cart/checkout boundaries. Only synthetic, explicitly test-only approved combinations were allowed in acceptance runs.
- Prescription tests used synthetic data only. The suite covered upload/file validation, private persistence and authorized owner retrieval versus unauthorized/public denial. This does not establish professional suitability, lawful retention, or production security readiness.
- **No real optical approval, real prescription, or corrective-lens commercial readiness is claimed.**

## Exact final regression results

| Check | Result |
|---|---|
| Prisma schema validation | **PASS** — `prisma validate`; schema valid (Prisma emitted only the existing `package.json#prisma` deprecation warning). |
| TypeScript | **PASS** — `tsc --noEmit`, no diagnostics. |
| Vitest | **PASS — 122/122 tests, 18/18 files.** |
| Isolated production build | **PASS** — Next production build to `.next-functional-audit-20261108`; generated static pages and production route manifest. |
| Playwright E2E | **PASS — 36/36** on `agharas_test.agharas_audit_e2e_20261108_01`. |
| Playwright acceptance | **PASS — 44/44** on separate `agharas_test.agharas_audit_20261108_01`. |
| Additional browser and persistence workflows | **PASS** for the specific workflows/evidence enumerated above; not a claim of exhaustive testing of every control. |
| Dependency audit | **PASS — 0 vulnerabilities** (`npm audit --audit-level=low`). |
| `git diff --check` | **PASS** — no whitespace errors; Git printed line-ending conversion notices only. |

## Evidence index

- Browser screenshots and route-state images: `artifacts/complete-functional-audit/customer/` and `artifacts/complete-functional-audit/owner-pages/`.
- Public routes and catalogue states: `artifacts/complete-functional-audit/customer-baseline.json`.
- Cart/favorites: `customer-cart-interactions.json`.
- Checkout/outbox/stock and preference restoration: `customer-email-checkout.json`.
- Contact and newsletter availability: `customer-contact-newsletter.json`.
- Owner route/responsive sweep: `owner-pages/owner-pages.json`.
- Category/brand and storefront propagation: `owner-crud-interactions.json`.
- Lens prices, store and FAQ: `owner-additional-crud.json`.
- Shipping settings: `owner-shipping-settings.json`.
- CMS page persistence/cache propagation/restoration: `owner-content-page.json`.
- Email retry and ambiguous SENDING: `email-outbox-interactions.json`.
- Full Playwright test output was observed in the terminal; traces/screenshots are retained by Playwright on failures in the configured test-results/output directories. Both final suites completed without failure.

## Required approvals and recommended order

1. **Professional optician:** approve exact compatibility rules and optical operating/review workflow. Keep unapproved configurations blocked until then.
2. **Owner/legal:** approve real legal terms, business facts, warranties/returns, fulfillment promises, contact/SLA and store details.
3. **Owner/privacy:** set prescription retention/deletion and access procedures.
4. **Owner/marketing:** decide whether to enable newsletter, including consent, unsubscribe and any promised promotion; do not mount the existing component until its actual operational meaning is approved.
5. **Owner/operations:** accept order-email wording, recipients, contact inbox monitoring, outbox recovery and hosted operational responsibilities.
6. **Separate hosted readiness:** only after explicit authorization, plan a controlled migration/storage/SMTP/payment review. Hosting, real email and online payment were not part of this audit and remain deferred.

## Final verdicts

- **CUSTOMER STOREFRONT: PASS** — tested local customer software workflows; business/legal copy approval remains outstanding.
- **OWNER DASHBOARD: PASS** — tested local route access, key mutations and persistence; manual control-by-control UAT is not exhaustive.
- **OPTICAL WORKFLOWS: PARTIAL** — technical safeguards behave as intended, but professional approvals are absent.
- **OVERALL LOCAL FUNCTIONAL STATUS: PARTIAL** — local workflows are functional, but real corrective-lens sales and business launch are not approved.

This verdict is strictly local and synthetic. It is not a production, legal, clinical, hosting, payment-provider, or real-customer acceptance.
