# Pre-Production Functional Acceptance Audit — AGHARAS VISION OPTIQUE

| | |
|---|---|
| **Audit date** | 2026-10-29 |
| **Scope** | Existing application (`D:\PROJETs\e-agharass-vision`), full functional acceptance: verification, customer purchase journey, admin CRUD, security/privacy, UX/responsive |
| **Method** | Execution-based verification (typecheck, unit/integration tests, production build, end-to-end browser tests, direct database assertions, HTTP probes, static review). Results in this document come from executed commands, not from project documentation. |
| **Application version** | `0.1.0` (Next.js 15.5.28, React 19.1.10, Prisma 6.19.3, PostgreSQL) |
| **VCS state** | **No Git repository** (`.git` absent). `git status` could not be inspected, no commit/branch/diff exists, and this audit's changes are therefore unversioned. See limitation L-01. |
| **Environment** | Windows (win32), Node.js v23.1.0, npm 10.9.0, Chrome/Chromium via Playwright 1.64.1, local PostgreSQL on `localhost:5432` |
| **Audit database** | Dedicated `agharas_test` (separate from the demo database `agharas`), wiped and reseeded before each authoritative run |
| **Databases not touched** | The main demo database `agharas` was used only by the pre-existing E2E suite, as designed |

---

## 1. Executive summary

The application was audited by execution, not by reading its documentation. A total of **145 automated checks** were executed against a production build (34 pre-existing E2E tests, 31 new acceptance tests, 80 unit/integration tests), plus a TypeScript check, a production build, 24 HTTP route probes, direct PostgreSQL assertions and static review of every page, server action and library involved.

**Headline results**

- TypeScript: **0 errors**.
- Unit/integration (Vitest): **80/80 passed**.
- Production build (`next build`): **success**.
- Pre-existing E2E suite (Playwright, 34 tests): **34/34 passed**.
- New functional acceptance suite (Playwright, 31 tests, dedicated database): **31/31 passed**.
- Route probe (24 routes, anonymous + authenticated): **no 5xx**, no unhandled exception.
- No P0 defect was found **in the application code itself**. The P0 items below are *production gates* (configuration, data, legal compliance, operational safety), not broken features.

**What works well (verified, not assumed)**

The commercial core is solid: server-side price recomputation, atomic stock decrement (`updateMany` with `gte` guard), idempotent checkout, guest order access tokens, signature-validated prescription uploads stored outside `public/`, hashed session tokens, bcrypt cost 12, permission checks on 18/18 admin pages and 26/26 admin server actions, and a complete order state machine that rejects forged transitions even when the server action is replayed directly.

**Main risks (all documented in §8)**

1. No versioned database migrations and no backup/restore procedure (P0).
2. Production URL still `http://localhost:3000`, which corrupts canonicals, sitemap, Open Graph and JSON-LD (P0).
3. Legal identifiers (ICE, RC, IF, Patente, CNDP), store contact details and the whole catalogue are demo placeholders (P0).
4. Health data (prescriptions) stored on the application server's local disk with no retention, encryption-at-rest or backup policy (P0).
5. Rate limiting is in-memory and keyed on the submitted e-mail address, which allows targeted lockout and is ineffective in a multi-instance deployment (P1).

**Verdict** — **READY FOR CONTROLLED STAGING**, with the production gates of §8 to be closed before any public launch. See the final verdict block.

**Limitations of this audit** — stated explicitly so results are not over-claimed: no pixel-level comparison with the Stitch designs (structural and copy comparison only), no load/performance testing, no penetration test, no real payment gateway, no real e-mail delivery, Windows-only execution, and no version control (L-01).

---

## 2. Exact test results

### 2.1 Commands and outcomes

| # | Command | Environment | Result | Notes |
|---|---|---|---|---|
| 1 | `npm run typecheck` (`tsc --noEmit`) | project | **0 errors** | Includes the 5 new audit specs and `prisma/seed.ts` |
| 2 | `npm test` (`vitest run`) | project | **80/80 passed** (8 files) | unit + integration (`order-snapshot`, pricing, validation, content, orders, utils) |
| 3 | `npm run build` (`prisma generate && next build`) | project | **success** | App Router build, static + dynamic routes generated |
| 4 | `npm run test:e2e` | `agharas` demo DB, production server `:3100` | **34/34 passed** | Pre-existing suite, re-run after the fixes of §7 as a regression check |
| 5 | `npx playwright test --config playwright.audit.config.ts` | `agharas_test`, freshly seeded, production server `:3100` | **31/31 passed (2.1 min)** | New acceptance suite, 1 worker, serial |
| 6 | Route inventory probe (24 routes) | production server | **24/24 acceptable status, 0 × 5xx** | public, account and admin routes |
| 7 | Database inventory | `agharas_test` | **35 models, 13 enums** | Prisma schema introspection |
| 8 | `npm audit` | project | **9 vulnerabilities** (2 critical, 5 high, 2 moderate) | see S-10 |
| 9 | `prisma/seed.ts` production guard | `NODE_ENV=production` | **refused (exit 1)** | New guard, verified both ways |
| 10 | Seed on development DB | `agharas_test` | **success** | Guard does not hinder legitimate dev/test seeding |

### 2.2 Acceptance suite composition (31 tests)

| File | Tests | Coverage |
|---|---|---|
| `tests/audit/01-purchase.spec.ts` | 4 | guest purchase with progressive lenses + prescription + COD, price tampering, invalid input, concurrent double submission |
| `tests/audit/02-admin.spec.ts` | 7 | product create/edit/variant, stock adjustment, promotion, settings, order transitions + forged transition, customer deactivation, Opticien RBAC |
| `tests/audit/03-security.spec.ts` | 11 | anonymous admin access, guest order token, prescription API 401/404, fake PDF upload, security headers, login rate limit, XSS in search, Client-role admin denial, session cookie flags, foreign order access |
| `tests/audit/04-business.spec.ts` | 3 | coupon discount, cancellation restoring stock, out-of-stock rejection |
| `tests/audit/05-ux.spec.ts` | 6 | horizontal overflow at 1440/768/390 px, mobile drawer + Escape, account pages, admin pages |

### 2.3 Test isolation and reproducibility

- Dedicated database: `postgresql://…/agharas_test`, wiped with `npx tsx prisma/seed.ts` before the authoritative run.
- Dedicated synthetic accounts created by `tests/audit/global-setup.ts` (`audit.admin@audit.local`, `audit.staff@audit.local`, `audit.client@audit.local`) so runs are not blocked by the login rate limiter and never disturb demo accounts.
- Separate Playwright config (`playwright.audit.config.ts`, 1 worker, serial, 120 s timeout) so `npm run test:e2e` behaviour is unchanged.
- Session storage states written to `tests/audit/.auth/` (git-ignored).
- The suite is opt-in: `npm run test:audit`.

### 2.4 Database evidence (after the final run)

```
orders by status: PENDING 2 | DELIVERED 2 | CANCELLED 1
users 7 | products 13 | variants 26 | prescriptions 1 | couponRedemptions 1
inventoryMovements 32 | settings 22 | contentPages 6
```

Guest order inspected directly in PostgreSQL:

```
subtotal 365000 | shipping 0 | total 365000 | standard shipping
payment CASH_ON_DELIVERY / PENDING / 365000
items[0].configuration = {
  lensTypePriceCents 120000, lensIndexPriceCents 25000,
  treatments [{Anti-reflet 0}, {Filtre BlueProtect 35000}],
  lensIndexValue "1.60", prescriptionMethod "MANUAL",
  prescriptionId <cuid>, summary "Verres progressifs individualisés • indice 1.60 • Anti-reflet • Filtre BlueProtect"
}
prescription = MANUAL, R -2.50 / -0.75 × 90, L -2.00 / -0.50 × 85, PD 62, userId null
history = PENDING → CANCELLED ; shipment = RETURNED
```

Frame 185 000 + lens type 120 000 + index 25 000 + BlueProtect 35 000 = **365 000 centimes (3 650,00 DH)**, shipping waived by the free-shipping threshold.

---

## 3. Verified customer workflows

All items below were exercised through the browser with the production build, then confirmed by direct SQL assertions.

| # | Workflow | Verified outcome |
|---|---|---|
| C-01 | Guest full purchase: frame + progressive lenses (index 1.60) + BlueProtect + manual prescription + cash on delivery | Order created; totals recomputed server-side (365 000 c); free shipping applied; payment `PENDING / CASH_ON_DELIVERY`; shipment created; history `PENDING`; stock decremented by 1 with a `SALE` movement; cart emptied |
| C-02 | Prescription capture (manual entry) | Persisted with sphere/cylinder/axis per eye and PD 62, `method=MANUAL`, `userId=null`, linked to the order item; freed from the cart |
| C-03 | Lens configuration snapshot | `OrderItem.configuration` stores lens type, index, treatment names and prices, prescription id and method, plus a human-readable summary — the order remains readable even if prices change later |
| C-04 | Price tampering | Client-side hidden/injected prices ignored; stored total equals the catalogue price (185 000 c), no discount granted |
| C-05 | Invalid checkout data | Browser validation bypassed with `novalidate`; server-side Zod validation returned field errors; **no order and no payment created** |
| C-06 | Duplicate submission (double click / retry) | Same idempotency key ⇒ **exactly one order**; the second request reuses the existing order |
| C-07 | Coupon `CERCLE10` | 10 % discount computed server-side (18 500 c), total 166 500 c, `CouponRedemption` row created, `usageCount` incremented |
| C-08 | Out-of-stock product | "Ajouter la monture seule" is not actionable ("Indisponible" / "Épuisé dans ce coloris"); **no cart item created** |
| C-09 | Order cancellation (admin, effect on customer data) | Order `CANCELLED`, stock restored per item, `CANCELLATION` inventory movement written, shipment set to `RETURNED`, history appended |
| C-10 | Guest order confirmation | Accessible **only** with the `?token=` access token: 404 without token, 404 with a wrong token, 200 with the legitimate token |
| C-11 | Customer account isolation | An authenticated client opening another customer's order reference receives **404** |
| C-12 | Prescription document access | Anonymous request to `/api/ordonnances/[id]` ⇒ **401**; authenticated non-owner ⇒ **404** (no filename leak) |
| C-13 | Malicious upload | A text file renamed `ordonnance.pdf` is rejected by the server (binary signature check) with a user-visible error; no cart, no order |
| C-14 | Empty cart / unauthenticated account | `/commande` with an empty cart redirects to `/panier`; `/compte` redirects to `/connexion` — no error page |
| C-15 | Reflected XSS in search | `<img src=x onerror=…><script>…` in `/catalogue?q=` is escaped; no dialog fired, no injected element in the DOM |
| C-16 | Responsive purchase surface | No horizontal overflow at 1440, 768 and 390 px on home, catalogue, product, cart, FAQ, contact, boutiques, login and signup |

---

## 4. Verified admin workflows

| # | Workflow | Verified outcome |
|---|---|---|
| A-01 | Product creation | Product created with slug, SKU, price; stored price 150 000 c |
| A-02 | Product edition | Price changed through the UI; database updated to 199 900 c |
| A-03 | Variant creation | Variant `AUD-…-01` created with initial stock 7 and inventory row |
| A-04 | Stock adjustment | +5 applied through `/admin/stock`; inventory updated and an `ADJUSTMENT` movement recorded |
| A-05 | Promotion management | Coupon created (PERCENT 15, active), then deactivated through the list action; database reflects both states |
| A-06 | Store settings | `store.phone` saved through `/admin/parametres`; value persisted in `Setting` |
| A-07 | Order lifecycle | PENDING → CONFIRMED → IN_PRODUCTION → SHIPPED → DELIVERED, each persisted; terminal state hides the transition form |
| A-08 | Forged order transition | Server action replayed with `DELIVERED → PENDING` (hidden `$ACTION_ID_*` field, direct POST) ⇒ **no 303, status unchanged, no history row** |
| A-09 | Customer deactivation | Account disabled, **all sessions purged** (verified with a synthetic session row), then reactivated |
| A-10 | RBAC — Opticien (7 view permissions) | `/admin/utilisateurs`, `/admin/parametres`, `/admin/promotions` redirect to `/admin/acces-refuse`; `/admin/stock` renders **without** the adjust input (`inventory.view` without `inventory.adjust`) |
| A-11 | RBAC — server action replay as Opticien | Customer toggle action replayed directly ⇒ **no 303, `isActive` unchanged** (permission enforced server-side, not only in the UI) |
| A-12 | RBAC — Client role | `/admin`, `/admin/commandes`, `/admin/clients`, `/admin/stock` render "Accès refusé" with no admin navigation |
| A-13 | Admin responsive surface | `/admin`, produits, commandes, stock, clients, promotions, paramètres: no horizontal overflow at 1440 px |
| A-14 | Static permission review | 18/18 admin pages call a permission guard; 26/26 admin server actions call `assertPermission` |

---

## 5. Security findings

### 5.1 Controls verified as effective

| Control | Evidence |
|---|---|
| Password hashing | bcrypt, cost 12 (`ROUNDS = 12`), no plaintext storage |
| Session tokens | Random token, only its **SHA-256 hash** stored (`Session.tokenHash`) |
| Session cookie | `HttpOnly`, `SameSite`, `Secure` verified in a real browser context |
| Route protection | `/admin` unauthenticated ⇒ redirect to `/connexion`; Client role ⇒ access denied page without admin nav |
| Action-level authorization | Forged server-action POSTs rejected for both a lower-privilege role and an invalid transition |
| Price integrity | All totals recomputed from the database; client-supplied prices ignored |
| Stock integrity | Atomic `updateMany({ where: { quantity: { gte: n } } })`; concurrent purchases cannot oversell |
| Idempotency | Duplicate checkout submission produces one order |
| Guest order privacy | Access token required; wrong/absent token ⇒ 404 |
| Prescription documents | Binary signature validation, random filenames, stored outside `public/`, mode `0600`, served with `no-store`, `nosniff` and a sandbox CSP; API returns 401/404 |
| XSS | React escaping verified with a reflected payload in catalogue search; JSON-LD now escapes `<` (see F-03) |
| CSRF | Next.js Server Actions with same-origin enforcement; no custom cookie-auth mutation endpoints |
| Secrets | No secret in client bundles; `.env` and `.env.local` are git-ignored |
| Headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Powered-By` removed |
| Rate limiting | 7th failed login for the same e-mail ⇒ "Trop de tentatives…" (6 per 5 min); registration 3 per 10 min; password reset 3 per 10 min |
| Destructive seed | Now refuses to run with `NODE_ENV=production` (F-05) |

### 5.2 Findings

| ID | Severity | Finding | Status |
|---|---|---|---|
| S-01 | P0 | Production URL not configured: `NEXT_PUBLIC_SITE_URL=http://localhost:3000` and `SITE.url` fallback, propagated to canonical URLs, `sitemap.xml`, `robots.txt`, Open Graph and JSON-LD | Open (configuration) |
| S-02 | P0 | Legal/company identifiers are placeholders (`store.ice`, `store.rc`, `store.if`, `store.patente`, `store.cnss`, `store.cndp` = "À RENSEIGNER"), and legal pages state that no real CNDP authorisation is claimed | Open (business data) |
| S-03 | P0 | No versioned migrations (`prisma/migrations` absent; deployment relies on `db push`) and no backup/restore procedure documented as executed | Open |
| S-04 | P0 | Prescription files (health data) stored on the application server's local filesystem, without retention policy, encryption at rest, off-site backup or deletion workflow | Open |
| S-05 | P0 | `prisma/seed.ts` is destructive (wipes every table) and creates accounts with published passwords; it was undocumented-enforced only by prose. **Guard added** (F-05), remaining risk is operator error via `SEED_ALLOW_PRODUCTION` | Mitigated |
| S-06 | P1 | Rate limiter is in-memory (per instance) and keyed on the **submitted e-mail**: a known address can be locked out deliberately, and the limit is ineffective behind multiple instances | Open |
| S-07 | P1 | No rate limit or quota on prescription uploads (12 MB action body); a single actor can fill the disk | Open |
| S-08 | P1 | Coupon `usageLimit` is checked outside the checkout transaction (race), and `perCustomerLimit` is stored in the schema but never enforced | Open |
| S-09 | P1 | No e-mail transport: password reset tokens are created but the link is only returned in development; order notifications are manual | Open |
| S-10 | P1 | `npm audit`: 9 advisories — critical `tinypool` (dev), critical `vitest` (dev), high `zod` (runtime, memory exhaustion on oversized constrained collections, fix ≥ 4.6.6 = major bump), high `postcss` (build), high `deepmerge-ts` via Prisma CLI (dev), high/moderate transitive | Open |
| S-11 | P1 | No CSP and no HSTS header (staging must serve HTTPS; production should add both) | Open |
| S-12 | P1 | `dashboard.view` exposes revenue, recent orders and the prescription review queue to the Opticien role, which is otherwise view-only | Open (design choice to confirm) |
| S-13 | P2 | Guest prescriptions have `userId = null`, so a guest cannot retrieve their prescription later; no anonymisation/retention job | Open |
| S-14 | P2 | Idempotent checkout replay redirects with the guest `accessToken`; safe only because the key is an unguessable client value | Open |
| S-15 | P2 | `saveRoleAction` allows a Super Admin to grant permissions to the system "Client" role (all self-registered customers). No lower role holds `roles.manage` | Open (hardening) |
| S-16 | P2 | No `middleware.ts`: headers and authentication are enforced per route/layout, not centrally (defence in depth) | Open |
| S-17 | P2 | `secure` session cookie requires HTTPS: the app must be served over TLS (it is in any real deployment) | Documented |

---

## 6. UX / responsive findings

### 6.1 Verified

| Check | Result |
|---|---|
| Horizontal overflow, public pages, 1440 × 900 | none (≤ 2 px tolerance) |
| Horizontal overflow, public pages, 768 × 1024 | none |
| Horizontal overflow, public pages, 390 × 844 | none |
| Every public page has a visible `<h1>` | 9/9 pages |
| Mobile drawer | opens from "Ouvrir le menu", `role="dialog"` + `aria-modal`, closes on `Escape`, body scroll locked |
| Account pages at 390 px | no overflow; exactly one `<main>` landmark per page (after F-04) |
| Admin pages at 1440 px | no overflow, `<h1>` present on 7/7 screens |
| Design system fidelity | Tokens match the Stitch references (`primary #182c2d`, `secondary #705c1a`, `gold #cfb56a`, Bodoni Moda + Hanken Grotesk); home page copy, hero, trust badges, section titles and navigation match the design source |
| Empty states | empty cart offers alternatives; unauthenticated account redirects cleanly |

### 6.2 Observations (not blockers)

| ID | Observation | Severity |
|---|---|---|
| U-01 | No `loading.tsx`/Suspense boundaries: server-rendered navigation shows no pending state; the cart quantity buttons have no pending state (server-side guards prevent damage, but rapid clicks feel unresponsive) | P2 |
| U-02 | Catalogue filter form is rendered twice (desktop sidebar + mobile panel) with duplicated DOM ids, so some `label[for]` associations break on mobile | P2 |
| U-03 | Product gallery tab semantics incomplete (no roving `tabindex`, no `aria-controls` on thumbnails) | P2 |
| U-04 | Auth pages contain a skip link targeting a non-existent `#contenu` | P2 |
| U-05 | Lens wizard screen-reader labels are in English (`rightSphere`, `leftSphere`, `pd`) inside an otherwise French interface | P2 |
| U-06 | Mobile drawer has no focus trap (Escape and body lock work; tab can leave the dialog) | P2 |
| U-07 | Settings `shipping.free_threshold` and `order.prescription_required` are stored and editable but not read anywhere; `payment.online_enabled` is forced off | P2 |
| U-08 | Demo data left behind by the E2E suite (extra cancelled orders and sessions in the demo database) is not cleaned up automatically | P2 |

---

## 7. Bugs fixed

Only defects confirmed by execution were changed, and only with minimal, targeted edits. Nothing was redesigned and no feature was added.

| ID | Defect | Fix | Files | Verification |
|---|---|---|---|---|
| F-01 | Rate-limit cleanup was dead code at module scope (executed once at import), so the in-memory bucket map could grow without bound | Purge moved into `rateLimit()` (lazy, on threshold) and bounded by evicting the entries with the nearest expiry when still above 10 000 keys | `src/lib/rate-limit.ts` | typecheck, unit tests, full E2E (rate-limit test still returns "Trop de tentatives") |
| F-02 | `toggleCustomerActiveAction` only blocked the Super Admin and the actor themselves: any staff member able to reach the form could deactivate another staff account through a forged action | Guard added: the target must have the `Client` role | `src/app/actions/admin/commerce.ts` | audit test A-09 (client toggle still works) + A-11 (Opticien replay still rejected) |
| F-03 | JSON-LD injected with `dangerouslySetInnerHTML` without escaping `<`, allowing a stored `</script>` break-out from admin-editable content | `JSON.stringify(...).replace(/</g, "\\u003c")` | `src/app/(site)/faq/page.tsx`, `src/app/(site)/produit/[slug]/page.tsx` | typecheck, build, E2E product/FAQ routes |
| F-04 | Account layout nested a second `<main>` inside the site layout's `<main>` (invalid landmark structure, screen-reader confusion) | Replaced by `<div>` | `src/app/(site)/compte/layout.tsx` | UX test asserts exactly one `<main>` per account page |
| F-05 | Destructive demo seed could wipe a production database and create known-password accounts | Refuses to run when `NODE_ENV=production` unless `SEED_ALLOW_PRODUCTION=1` | `prisma/seed.ts` | guard refused (exit 1) with `NODE_ENV=production`; normal seed still succeeds |
| F-06 | E2E helpers duplicated session-state logic and consumed the login rate limit, making repeated runs flaky | Single `globalSetup` creates three synthetic accounts and stores one session each, reused by all specs | `tests/audit/global-setup.ts`, `tests/audit/helpers.ts`, `tests/audit/02-admin.spec.ts`, `tests/audit/03-security.spec.ts`, `playwright.audit.config.ts` | 31/31 audit tests pass repeatedly |
| F-07 | No script to run the acceptance suite | `npm run test:audit`; `.gitignore` extended with `tests/audit/.auth/` and `audit-report/` | `package.json`, `.gitignore` | command executed (31/31) |

**Regression evidence after the fixes:** `npm run typecheck` 0 errors, `npm test` 80/80, `npm run build` success, `npm run test:e2e` 34/34, acceptance suite 31/31.

---

## 8. Unresolved issues

### P0 — must be closed before any production exposure

| ID | Issue | Impact | Recommended action |
|---|---|---|---|
| P0-1 | `NEXT_PUBLIC_SITE_URL` is `http://localhost:3000`; `SITE.url` falls back to the same value | Every canonical link, sitemap entry, `robots.txt` sitemap reference, Open Graph URL and JSON-LD `url` points to localhost; shared links and SEO break | Set the real HTTPS origin per environment; add a startup assertion that rejects `localhost` outside development |
| P0-2 | No `prisma/migrations` history; deploys use `db push` | No auditable, reversible schema changes; risk of divergence or destructive sync on the production database | Baseline a migration (`prisma migrate dev --name init`), deploy with `prisma migrate deploy`, test restore from backup |
| P0-3 | Legal and store data are placeholders (ICE, RC, IF, Patente, CNSS, CNDP, phone, e-mail, address, shipping origin), and the catalogue/orders are demo data | Legal non-compliance (Morocco, law 09-08 on personal data) and misleading public information if launched as-is | Fill identifiers in `/admin/parametres`, replace legal page content, load the real catalogue, and never migrate demo customers/orders |
| P0-4 | Prescription files live on the app server's local disk with no retention, at-rest encryption or backup | Loss of medical data on redeploy/scale-out; regulatory exposure | Move to private object storage with server-side encryption, define a retention/deletion policy, back up encrypted, and document the CNDP declaration |
| P0-5 | The seed script is destructive (mitigated, not eliminated) | A single wrong `DATABASE_URL` with `SEED_ALLOW_PRODUCTION=1` destroys production | Keep the guard, restrict DB credentials used for seeding, and never ship seed credentials to the production host |

### P1 — should be fixed before or immediately after staging

| ID | Issue | Impact |
|---|---|---|
| P1-1 | In-memory rate limiting keyed on the submitted e-mail (S-06) | Targeted account lockout; ineffective with more than one instance |
| P1-2 | No rate limit/quota on prescription uploads (S-07) | Disk exhaustion, denial of service |
| P1-3 | Coupon `usageLimit` race and unenforced `perCustomerLimit` (S-08) | A limited promotion can be over-redeemed under concurrency |
| P1-4 | No e-mail transport (S-09) | Password reset is unusable in production; order notifications remain manual |
| P1-5 | Vulnerable dependencies (S-10) | Runtime `zod` advisory (memory exhaustion) and dev-tool criticals |
| P1-6 | No CSP / HSTS (S-11) | Reduced defence in depth against XSS/MITM |
| P1-7 | `dashboard.view` exposes revenue and prescription queue to the Opticien role (S-12) | Least-privilege violation to confirm with the business owner |
| P1-8 | No version control (L-01) | No review, rollback or traceability of this audit's changes |

### P2 — backlog

| ID | Issue |
|---|---|
| P2-1 | No `loading.tsx`/Suspense pending states (U-01) |
| P2-2 | Duplicate DOM ids in the catalogue filter form (U-02) |
| P2-3 | Incomplete gallery tab semantics (U-03) |
| P2-4 | Skip link targeting a missing `#contenu` on auth pages (U-04) |
| P2-5 | English screen-reader labels in the lens wizard (U-05) |
| P2-6 | No focus trap in the mobile drawer (U-06) |
| P2-7 | Settings written but never read; online payment forced off (U-07) |
| P2-8 | Guest prescriptions are ownerless and never purged (S-13) |
| P2-9 | Idempotent replay returns the guest access token (S-14) |
| P2-10 | System "Client" role permissions editable (S-15) |
| P2-11 | No central `middleware.ts` (S-16) |
| P2-12 | Test data not cleaned from the demo database (U-08) |

---

## 9. Missing external integrations and data

| Area | Current state | Needed for production |
|---|---|---|
| Transactional e-mail | None (no SMTP/API client, no template) | Provider (SES/Resend/Postmark), SPF/DKIM/DMARC, templates for reset, order confirmation, shipping |
| Online payment | Cash on delivery only; `payment.online_enabled` forced off | CMI/PayZone (or Stripe) merchant account, webhook endpoint with signature verification, refund flow, PCI/3-D Secure scope |
| Shipping / carriers | Manual methods seeded (`standard`, `retrait-salon`, `express`) with static prices | Real rate table or carrier API, tracking numbers, label printing |
| WhatsApp / SMS | Link-only (`wa.me`) and placeholders in settings | WhatsApp Business API or SMS gateway for order status notifications |
| Prescription storage | Local disk (`PRESCRIPTION_STORAGE_DIR`) | Private object storage, encryption, lifecycle/retention policy, access audit |
| Error monitoring | None | Sentry (or equivalent), alerting, uptime checks |
| Analytics / consent | None; no cookie banner | Consent management (CNDP-compatible) and privacy-respecting analytics |
| Backups | No procedure | Automated PostgreSQL dumps, encrypted off-site copies, documented restore drill |
| Domain / TLS | Localhost | Production DNS, TLS certificate, HSTS, staging and production origins |
| Legal / tax | Placeholders (ICE, RC, IF, Patente, CNSS, CNDP) | Real identifiers, CNDP declaration, reviewed CGV/mentions/confidentialité |
| Catalogue content | 13 synthetic/demo products with Stitch imagery | Real products, prices, stock, manufacturer data, real photography rights |
| Maps / showroom | Static content for boutiques | Real addresses, opening hours, map embed (with consent) |

---

## 10. Production readiness checklist

### Build and quality gates

- [x] TypeScript: 0 errors
- [x] Unit/integration tests: 80/80
- [x] Production build succeeds
- [x] E2E suite: 34/34
- [x] Functional acceptance suite: 31/31 on a dedicated database
- [x] No 5xx on the route inventory
- [x] No critical runtime dependency vulnerability accepted without review (open: S-10)
- [ ] Version control in place with a tagged release (P1-8)

### Configuration

- [x] `.env` / `.env.local` excluded from version control
- [x] `AUTH_SECRET` required and non-default in the audited environment
- [ ] `NEXT_PUBLIC_SITE_URL` set to the real HTTPS origin (P0-1)
- [ ] Session cookie over HTTPS only (requires TLS termination) (S-17)
- [ ] CSP and HSTS enabled (P1-6)
- [ ] `allowedDevOrigins` not needed in production; dev-only warnings absent from the production build

### Database

- [ ] Versioned migrations applied with `prisma migrate deploy` (P0-2)
- [ ] Automated backups + tested restore (P0-2)
- [ ] Demo data **not** migrated; demo accounts removed
- [ ] Real settings, legal identifiers and catalogue loaded (P0-3)
- [ ] Prescription storage migrated to private object storage with retention policy (P0-4)

### Security

- [x] RBAC enforced on pages and server actions
- [x] Prices and totals recomputed server-side
- [x] Atomic stock control
- [x] Guest order tokens; prescription API access control
- [x] Upload signature validation and private storage path
- [x] Security headers (`nosniff`, `DENY`, referrer, permissions)
- [ ] Rate limiting shared across instances and not keyed solely on user input (P1-1)
- [ ] Upload quota/rate limit (P1-2)
- [ ] Coupon limits enforced transactionally (P1-3)
- [ ] Dependency upgrades (`zod` ≥ 4.6.6, `vitest`/`tinypool`, `postcss`) (P1-5)
- [ ] Penetration test on the staging deployment

### Operations

- [ ] E-mail provider configured and deliverability tested (P1-4)
- [ ] Monitoring, alerting and uptime checks
- [ ] Log retention and PII redaction verified
- [ ] Runbook: deploy, rollback, restore, incident
- [ ] Load test of catalogue and checkout paths
- [ ] CNDP declaration and privacy policy reviewed by counsel

### Business

- [ ] Payment method(s) contractually enabled (online payment or COD only, explicitly confirmed)
- [ ] Shipping prices, free threshold and delivery times confirmed
- [ ] Legal pages reviewed and completed
- [ ] Real showroom addresses, phone, WhatsApp and e-mail
- [ ] Product photography rights and manufacturer authorisations

---

## Verdict

> ### READY FOR CONTROLLED STAGING

**Rationale.** Every functional area in scope was verified by execution and behaves as intended: the complete purchase journey (including prescriptions, progressive lenses, coupons, stock, cancellation and idempotency), the admin CRUD and order lifecycle, server-side authorization, data isolation, upload validation and responsive layouts at 390/768/1440 px. The five defects found in the code itself were fixed and re-verified, and the full regression set (typecheck, 80 unit/integration tests, production build, 34 E2E tests, 31 acceptance tests) is green.

**This verdict is not a production clearance.** Controlled staging is appropriate because the remaining blockers are **operational, legal and configuration gates** rather than application defects:

1. real HTTPS origin and security headers (P0-1, P1-6);
2. versioned migrations plus a tested backup/restore (P0-2);
3. real legal identifiers, CNDP declaration and store data (P0-3);
4. production-grade storage and retention for prescription files (P0-4);
5. e-mail transport so password reset and notifications work (P1-4);
6. the P1 hardening items (rate limiting, upload quota, coupon limits, dependencies).

**Exit criteria for production:** all P0 items closed, all P1 items closed or explicitly accepted in writing by the business owner, the staging penetration test passed, and the production database provisioned from migrations — never from the demo seed.

---

### Appendix A — Files created or modified during the audit

```
docs/PRE_PRODUCTION_AUDIT.md              (this report)
package.json                              + "test:audit" script
.gitignore                                + tests/audit/.auth/, audit-report/
prisma/seed.ts                            + production guard
src/lib/rate-limit.ts                     bounded, lazily purged rate-limit store
src/app/actions/admin/commerce.ts         client-role guard on customer toggle
src/app/(site)/faq/page.tsx               JSON-LD escaping
src/app/(site)/produit/[slug]/page.tsx    JSON-LD escaping
src/app/(site)/compte/layout.tsx          nested <main> removed
playwright.audit.config.ts                new audit config (globalSetup)
tests/audit/helpers.ts                    new
tests/audit/global-setup.ts               new
tests/audit/01-purchase.spec.ts           new
tests/audit/02-admin.spec.ts              new
tests/audit/03-security.spec.ts           new
tests/audit/04-business.spec.ts           new
tests/audit/05-ux.spec.ts                 new
```

### Appendix B — Audit limitations (L)

- **L-01** No Git repository: no `git status`, no diff, no rollback point. All changes are listed in Appendix A by file.
- **L-02** No pixel-level UI comparison with the Stitch references: comparison was structural (design tokens, layout, copy). Visual regressions smaller than a layout break would not be caught.
- **L-03** No load, stress or soak testing; performance conclusions are therefore absent.
- **L-04** No penetration test, no dependency exploit reproduction, no TLS/hosting inspection.
- **L-05** Payment is COD-only by design; no gateway integration could be tested.
- **L-06** No real e-mail delivery path exists to test.
- **L-07** Execution was Windows-only; no verification on Linux containers, despite production likely targeting Linux.
- **L-08** The environment used a local PostgreSQL instance and a local filesystem for prescriptions; behaviour under managed PostgreSQL and object storage is untested.
