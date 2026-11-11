# Order email notifications

**Assessment:** 5 November 2026  
**Scope:** transactional order-notification outbox, French customer confirmation, owner notice, explicit admin retry, and local synthetic verification. **No real email or deployment was performed.**

## Implemented workflows

### Owner order notice

- A notification is queued for each newly committed order when `order.owner_email_enabled` is enabled (default **true**).
- Recipient is the already-configured `OWNER_EMAIL`; no owner address/domain is invented and the public `store.email` address is not silently used as a private recipient.
- French subject/body include reference, creation date, item names/variants/quantities and line totals, overall total, payment method, and an admin order-management link when a canonical URL is configured.
- Customer name, postal address, phone, email, prescription data and prescription attachments/links are omitted. The order link still requires the existing owner-only authentication.

### Customer confirmation

- The workflow is controlled by admin setting `order.customer_confirmation_enabled`, default **false**. The owner must explicitly enable it in **Administration → Réglages → Livraison & commandes**.
- A message is queued only when enabled and the order has a non-empty customer email address.
- French content confirms receipt only, lists the order summary and total, chosen delivery method and city, and uses configured store contact email/phone. It explicitly says this is not professional optical/prescription approval or fulfillment/shipping confirmation; no delivery date is promised.
- No prescription contents, attachment, private URL, access token, or health-data detail is included.

## Commit, delivery, retries and deduplication

- `OrderEmailNotification` rows are inserted in the same database transaction as the order. Rejected validation, stock, optical-review, or transaction paths therefore produce no committed outbox rows and cannot trigger mail.
- Only after the transaction resolves successfully does checkout invoke delivery. SMTP failure is caught and recorded; it cannot roll back or corrupt the order, inventory, payment (still COD), or cart transaction.
- A unique `(orderId, kind)` constraint allows at most one outbox row per owner/customer workflow per order. Conditional status updates claim a row (`PENDING`/eligible `FAILED` → `SENDING`), preventing concurrent replays from sending the same row at once. `SENT` and `DISCARDED` rows are terminal.
- A normal idempotent checkout replay attempts pending rows and explicitly retries recorded `FAILED` rows. The owner can also retry failed notifications from the authenticated order detail page (`orders.update` permission); the retry is audited without recording recipient/content.
- SMTP settings/connection failures are persisted as `FAILED` plus a bounded safe error code and logged with a generated operation ID, error class/code only. No message, customer address, credentials, SMTP response text or prescription data is logged. Email transport has finite connection/greeting/socket timeouts.
- `discard` creates no outbound connection and marks the row `DISCARDED`. A failed attempt is not automatically retried in a background loop; retry is triggered by an idempotent checkout replay or an explicit owner action. No queue service/worker is introduced.

**Delivery limitation:** database state and SMTP acceptance cannot be committed atomically. A process failure after the mail server accepts a message but before `SENT` is saved is inherently ambiguous; the row can remain `SENDING`. An SMTP timeout can also occur after remote acceptance. This implementation prevents duplicate sends on ordinary repeated requests and retries recorded failures, but cannot promise exactly-once delivery across ambiguous SMTP/network outcomes. Inspect provider delivery logs before manually addressing a stuck/ambiguous send. There is no automatic replay of `SENDING` rows.

## Configuration

Reuse the existing transport variables; no new mail service or credential has been added:

- `EMAIL_TRANSPORT=discard` for tests and non-sending staging, or `smtp` when authorized delivery is intended.
- `EMAIL_FROM`: business-approved sender address.
- `SMTP_HOST`, `SMTP_PORT` (default 587; 465 uses implicit TLS), optional `SMTP_USER` and `SMTP_PASSWORD` as a pair.
- `OWNER_EMAIL`: existing configured owner account and owner-notification recipient.
- `NEXT_PUBLIC_SITE_URL`: approved HTTPS origin used to construct owner admin links in hosted builds.
- Admin settings: `order.owner_email_enabled` (default true), `order.customer_confirmation_enabled` (default false).

The existing transport validates headers/addresses, requires TLS and certificate verification. Provider, sender/domain authorization, SPF/DKIM/DMARC and a controlled recipient mailbox remain external requirements. Do not set SMTP on production until the sender and recipient behavior are approved. Customer confirmation is off by default to avoid sending to real customers before business approval.

## Verification

Unit coverage (`tests/unit/order-email-notifications.test.ts`) uses mocked delivery and synthetic addresses, including `.invalid`; no SMTP host was contacted. It verifies owner/customer queue configuration, missing customer email, owner recipient configuration, French template wording and HTML escaping, privacy omissions, successful delivery state, failure recording, explicit retry, disabled workflow behavior, and no send for terminal sent rows.

The acceptance checkout campaign also verifies rejected checkout creates no outbox row and simultaneous duplicate checkout creates one order and one owner notification row, with one discard attempt. The local database was a freshly migrated and seeded synthetic schema `agharas_test_order_email_accept_20261105_b`; no development/business schema was reset or modified.

| Check | Result |
|---|---|
| Prisma schema validation + generated client | **PASS**, Prisma 6.19.3 |
| Additive migration chain on isolated schema | **PASS**, all 4 migrations applied to new `agharas_test` schema |
| TypeScript `npm run typecheck` | **PASS** |
| Full Vitest `npm test` | **118/118 PASS**, 17 files |
| Focused notification unit tests | **5/5 PASS** |
| Production build `npm run build` | **PASS** |
| Full Playwright E2E | **36/36 PASS** |
| Full acceptance suite | **41/41 PASS**, including invalid/rejected checkout and duplicate submission/outbox assertions |
| SMTP provider delivery | **NOT RUN** — intentionally no provider, credentials, or real recipient |

The end-to-end and acceptance app processes used `EMAIL_TRANSPORT=discard`; the mock notification unit tests never opened a transport. No external mail was sent.

## Files changed

- `prisma/schema.prisma`
- `prisma/migrations/20261105100000_order_email_notifications/migration.sql`
- `src/lib/email.ts`
- `src/lib/order-email-templates.ts`
- `src/lib/order-email-notifications.ts`
- `src/app/actions/checkout.ts`
- `src/app/actions/admin/system.ts`
- `src/app/actions/admin/commerce.ts`
- `src/components/admin/SettingsForm.tsx`
- `src/app/admin/commandes/[id]/page.tsx`
- `src/lib/settings.ts`
- `tests/unit/order-email-notifications.test.ts`
- `tests/audit/01-purchase.spec.ts`
- This report and hosted readiness/progress documentation.

## Remaining requirements

Choose an authorized SMTP provider; supply approved sender/domain and DNS authentication; set the real `OWNER_EMAIL`; approve customer email copy and sender, business contact details, and when to enable the customer confirmation toggle. Review email privacy/retention and perform a controlled provider test using an authorized synthetic mailbox. Establish operational handling for stuck `SENDING` and provider delivery-status monitoring. Until that provider test, transport readiness is local only and **production email delivery is unverified**.
