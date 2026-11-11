# Owner administration and CMS implementation

Status: **in progress; not approved for production**. Existing French storefront and database are reused. No deployment or online payment has been enabled.

## Access and checkout

The existing session system is used for the owner at `/connexion` (`/admin/connexion` redirects there). Set `OWNER_EMAIL` in production and provision a strong `OWNER_PASSWORD` out of band with `npm run owner:provision`. Do not commit secrets. Admin guards and prescription downloads require the owner; legacy user and order records remain intact. Customer registration and account pages are retired, with redirects. Wishlist uses a browser token and checkout creates guest orders with cash on delivery and token-protected confirmation.

## Owner workflows

Products are created as drafts; add a photo and an active variant with stock before publishing. Product edits, publication, unpublication and non-destructive archive/restore use the existing database. Images can be uploaded, reordered and removed; the first is the main image. Archiving retains order and stock history and restoring returns the product to draft. Product, category and brand visibility affects storefront and checkout. Existing orders retain snapshots.

The existing banners manage the homepage hero and promotional content. Categories, brands, stores, settings, FAQ, content pages, promotions, shipping prices and existing lens-option prices have owner interfaces. Homepage and contact changes use database-backed rendering and path invalidation. Store contact, announcement, footer and social settings are editable. Product and category changes invalidate the sitemap.

## Data and storage

`prisma/migrations/0_init` is a baseline for the pre-existing schema; `20261029120000_product_archive` adds a nullable archive timestamp. For an existing database, **back up and verify schema equivalence first**, then mark the baseline applied with `prisma migrate resolve --applied 0_init` and run `prisma migrate deploy`. New empty databases can use `prisma migrate deploy` directly. Baseline and archive migration have been applied to local development and dedicated test databases. Normal `db:seed` refuses populated schemas without deleting records. The separate `db:seed:test-reset` remains destructive and requires `ALLOW_TEST_SEED_RESET=1`, a localhost URL and the exact `agharas_test` database and public schema; never use it on business data. No destructive reset was run in the latest verification.

Public JPEG/PNG/WebP uploads are stored under `storage/public-media` by default and served via `/api/media`; preserve and back up this directory across releases. Files are size and signature checked. Prescription files remain separate and private. Uploads are not automatically garbage-collected; plan retention and storage limits before production.

## Verification and outstanding work

### Latest CMS closure work

- `/admin/apparence` stores an ordered section list and selected category IDs in `Setting`, with server validation and audit logging. Public sections render in the saved DOM order; inactive or missing categories are skipped. The existing visibility settings remain separate under Paramètres; preview opens the already published homepage, not an unpublished draft.
- Latest controlled runs: typecheck and production build passed; Vitest **83 passed, 0 failed, 0 skipped**; complete E2E **31 passed, 0 failed, 0 skipped**; complete acceptance **37 passed, 0 failed, 0 skipped**. Separate fresh synthetic schemas were used without resetting existing databases.
- New acceptance scenarios cover homepage ordering and category selection, unpublishing a cart item before checkout, and an owner-edited lens price applied to a subsequent guest order while a historical order remains unchanged.
- Detailed frame-to-treatment and treatment-to-treatment compatibility is **not implemented**. An optical professional must specify supported combinations and how unreviewed combinations are handled before a safe rules model can be completed. Existing product-level and lens-type/product-type compatibility remains in force.
- Historical seed fixture simplification is **not completed**: the existing acceptance tests still explicitly depend on legacy staff/customer roles and a historical customer order. They were retained rather than removed without an equivalent preservation test.
- The combined full scenario from creating a brand-new product through guest purchase and then archiving that specific ordered product remains untested. The new pricing test does not exercise stale lens-price changes, negative-price rejection or every incompatible combination.

Historical results below describe the previous phase:

- Latest sequential verification: typecheck passed; 80/80 Vitest; production build passed; 31/31 E2E; 34/34 acceptance, with zero skipped. E2E and acceptance used separate freshly migrated and seeded schemas in `agharas_test`; no existing schema was reset.
- Homepage section visibility and banner ordering are now configurable. Lens types expose their existing product-type compatibility rules, with server checks on cart and checkout; the owner must have an optician validate any changes.
- The demo seed still creates staff/customer fixtures for historical regression tests, so owner-only fixture simplification is unfinished. Normal seeding does not replace data in a populated database.
- CMS controls are not yet comprehensive: homepage section ordering, featured category selection, some institutional content and complete optical frame/treatment compatibility management remain incomplete. Logo and navigation remain unchanged. Full combined owner-to-purchase, stale-cart unpublish and optical compatibility/price-change scenarios require additional dedicated tests.
- Legal texts and actual company details require owner review; production operations, backup, upload hardening and security review are outstanding. Do not treat the previous audit baseline as approval of these changes.
