# Owner admin and CMS — acceptance status

> **Latest phase — WhatsApp integration verified; optical engine still partially implemented, not accepted.** The official number **+212 628-889950** is centralized in `store.whatsapp`, editable in Paramètres, propagated to every public surface and covered by unit and acceptance tests. A versioned exact-combination decision model and owner interface exist, but the optical migration has only been applied to isolated test schemas and no real professional decisions were supplied. Technical gaps and the latest 90/31/41 test results are documented in `docs/OPTICAL_COMPATIBILITY_ENGINE_ACCEPTANCE.md`. Older statements below are historical where inconsistent.

## Latest targeted verification — WhatsApp COMPLETE, optical engine PARTIALLY COMPLETE

- **IMPLEMENTED AND VERIFIED (WhatsApp):** `src/lib/whatsapp.ts` normalizes the configured number, builds every `wa.me` URL and holds French contextual messages. The official number `+212 628-889950` / `212628889950` / `https://wa.me/212628889950` is the seed/default and fallback in `src/lib/settings.ts`, `prisma/seed.ts`, `.env.example` and `src/lib/constants.ts`. Links exist in the header, footer, homepage, product page, configurator, cart, checkout, order confirmation, contact, FAQ, boutiques and content pages, with accessible labels and encoded messages that contain no prescription values or customer data. The owner edits the number in `/admin/parametres`; invalid values are rejected server-side. The development database setting was updated non-destructively and no business record was deleted.
- **IMPLEMENTED AND VERIFIED (admin/CMS core):** the synthetic product lifecycle covers creation, publication, guest purchase, price edit, archive and untouched historical order. Homepage category selection and section ordering persist and render without a rebuild; stale-cart unpublish blocks ordering with no order or stock movement; owner-edited lens prices are snapshotted in integer cents.
- **IMPLEMENTED BUT REQUIRES BUSINESS VALIDATION:** exact optical decisions and all treatment combinations are recorded and enforced by the owner, but these are assertions of professional review, not independent verification. `docs/OPTICAL_COMPATIBILITY_REVIEW.md` provides the review table.
- **BLOCKED BY EXTERNAL DECISION:** an optician must establish and document which combinations are professionally approved, incompatible or conditional, with identity and evidence. Do not claim the configurator provides professional approval.
- **PARTIALLY IMPLEMENTED:** the optical engine lacks a complete pending-combination report/filter/export, live effective-status display in the configurator, dedicated multi-treatment/stale-rule E2E and broader concurrency hardening. The optical migration is not applied to the development database.

Files changed in this phase include `src/lib/whatsapp.ts`, `src/lib/optical-status.ts`, `src/lib/optical-compatibility.ts`, `src/components/site/SiteChrome.tsx`, `src/components/site/LensWizard.tsx`, `src/components/site/CheckoutForm.tsx`, `src/components/site/ContentArticle.tsx`, the public pages under `src/app/(site)`, `src/app/actions/admin/system.ts`, `src/lib/settings.ts`, `src/lib/constants.ts`, `prisma/seed.ts`, `.env.example`, `tests/unit/whatsapp.test.ts` and `tests/audit/10-whatsapp.spec.ts`. The project is **not functionally accepted or production-ready**.

## Current closure phase — PARTIALLY COMPLETE (historical — see the latest sections above)

- **FUNCTIONALLY COMPLETE (tested):** the owner can choose and order homepage categories and reorder existing sections via `/admin/apparence`; changes are persisted and immediately rendered in actual DOM order. Existing visibility controls remain in Paramètres. A dedicated stale-cart test verifies that a guest cannot order a product unpublished after it was added, with no order, payment or stock movement. Another test changes a lens price in admin, purchases a configured lens as a guest, verifies integer-cent snapshots and checks a historical order remains unchanged.
- **PARTIALLY COMPLETE:** existing lens-type/product-type and product-level compatibility checks remain in place. Detailed frame/treatment and treatment/treatment configuration and full server enforcement are not implemented. Price-change tests do not yet cover stale optical carts, negative-price rejection, or all unsupported combinations. Seed guards remain intact, but legacy staff/customer test fixtures have not been simplified because active historical and security tests depend on them. The homepage preview shows the saved public version, not an unpublished draft.
- **BLOCKED:** an optical professional must specify supported frame, lens and treatment combinations and the required handling of unreviewed combinations. Production remains blocked by legal, HTTPS, backup, private-health-data retention, email, dependency and operational requirements.
- **NOT IMPLEMENTED:** per-frame treatment compatibility and treatment-to-treatment rule administration; combined create-product → purchase → archive → historical-order scenario.

The closure phase adds `src/lib/home-layout.ts`, `src/app/actions/admin/home-layout.ts`, `src/app/admin/apparence/page.tsx`, `src/components/admin/HomeLayoutForm.tsx`, `tests/unit/home-layout.test.ts`, `tests/audit/06-home-layout.spec.ts`, `tests/audit/07-stale-cart.spec.ts` and `tests/audit/08-optical-price.spec.ts`, and updates homepage and admin navigation. No schema migration was added; configuration uses existing `Setting` records. Existing modifications are preserved; `git status` gives the complete file list.

Latest sequential verification: typecheck **PASS**; Vitest **90 PASS / 0 FAIL / 0 SKIP**; production build **PASS**; full E2E **31 PASS / 0 FAIL / 0 SKIP**; full acceptance **41 PASS / 0 FAIL / 0 SKIP**. Independent fresh synthetic schemas were migrated and seeded; no development database reset. The owner checklist is `docs/OWNER_BUSINESS_ACCEPTANCE_CHECKLIST.md`.

The earlier sections below are historical and superseded where inconsistent.

**Verdict: PARTIALLY COMPLETED — not ready for production or full functional acceptance.** No public deployment or online payment was enabled. The existing storefront, logo, checkout, order snapshots, product archiving and historical records have been preserved.

## Status by area

| Area | Status | Evidence and remaining scope |
| --- | --- | --- |
| Owner authentication and guest checkout | COMPLETED | Existing sessions and owner guards; retired customer account UI; guest COD and token confirmation tested. |
| Product management | COMPLETED | Draft, photos, variants, prices, stock, preview, publish/unpublish, non-destructive archive/restore. The combined new-product → guest purchase → edit → archive → historical-order scenario and stale-cart unpublish are covered by acceptance tests. |
| Homepage and content | COMPLETED | Hero, banners, banner ordering, section visibility, featured product flags, FAQ, content, stores, contact, settings and homepage category/section ordering are editable and render without a rebuild. Contact/store content is not a general page editor. |
| Optical configuration | PARTIALLY COMPLETED | Exact product/variant/lens-type/index/treatment-set decisions are recorded by the owner and enforced on cart add/update/render, checkout and order transaction. Pending is the default; conflicts never approve. Pending reporting/filters/export, configurator effective-status display, dedicated multi-treatment/stale-rule E2E and broader concurrency hardening remain open, and real professional decisions are missing. |
| WhatsApp support | COMPLETED | Official `+212 628-889950` centralized in `store.whatsapp`, editable by the owner, rejected when malformed, propagated to every public surface with encoded French messages and accessible labels. Link-only; it cannot approve a combination. |
| Seed safety | PARTIALLY COMPLETED | Normal seed refuses populated schemas; explicit test reset is narrowly guarded. Demo seed still creates historical staff/customer fixtures and has not been simplified to owner-only. |
| Production operations | BLOCKED | Requires actual business details/legal approval, HTTPS/canonical configuration, backups and restore validation, private prescription retention/storage, real email, dependency review and deployment security review. |

## Owner interfaces and synchronization

Routes include `/connexion`, `/admin`, `/admin/produits`, `/admin/categories`, `/admin/marques`, `/admin/stock`, `/admin/commandes`, `/admin/verres`, `/admin/verres/compatibilite`, `/admin/apparence`, `/admin/ordonnances`, `/admin/promotions`, `/admin/contenu`, `/admin/salons` and `/admin/parametres`. Server actions use owner permission checks. Dynamic storefront rendering and path invalidation make supported changes visible without redeploying; historical order prices remain snapshots. Public media is separate from private prescriptions. `store.whatsapp` is the single editable source for every WhatsApp link.

## Schema and files

The existing baseline migration and `20261029120000_product_archive` add non-destructive product archive support; no new schema migration was required for this continuation. Main continuation files include `prisma/seed.ts`, `package.json`, `src/app/(site)/page.tsx`, `src/components/site/SiteChrome.tsx`, `src/components/admin/SettingsForm.tsx`, `src/components/admin/ContentForms.tsx`, `src/components/admin/LensOptionForm.tsx`, `src/app/actions/admin/system.ts`, `src/app/actions/admin/lenses.ts`, `src/app/actions/cart.ts`, `src/app/actions/checkout.ts`, `src/lib/settings.ts`, and `tests/audit/02-admin.spec.ts`. Earlier owner/CMS work remains in the working tree; consult `git status` for the complete file list.

## Latest executed verification

- TypeScript: passed.
- Vitest: **90 passed**, 0 failed, 0 skipped.
- Production build: passed.
- Complete Playwright E2E: **31 passed**, 0 failed, 0 skipped.
- Complete acceptance suite: **41 passed**, 0 failed, 0 skipped, including CMS visibility/order, product publication/archive, guest ordering, security checks, owner optical decision, WhatsApp public links, owner update propagation and invalid-number rejection.
- Separate fresh synthetic schemas were migrated and seeded in the local test database for the two browser suites. The populated development database rejected normal seeding before any deletion. No destructive reset was executed.

Passing suites do not prove real professional optical approval or production readiness. The optical migration is not applied to the development database; pending reporting, configurator status display and multi-treatment/stale-rule E2E remain open. See `docs/PRE_PRODUCTION_AUDIT.md` for the earlier operational backlog, noting that its test results describe a previous version.
