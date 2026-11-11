# Hosted infrastructure readiness — AGHARAS VISION OPTIQUE

**Assessment:** 5 November 2026  
**Verdict:** **NOT READY — BLOCKERS REMAIN. Do not deploy.**  
**Scope:** local hosted-readiness review and regression only. No provider credentials, external services, domains, real messages, online payments, or hosting resources were used.

## Executive summary

The application already has a server-side filesystem/S3-compatible storage adapter, separate private prescription and public-media areas, an owner-authorized prescription download route, an SMTP transport plus non-sending discard mode, runtime configuration validation, public cache invalidation, and a prior successful local PostgreSQL backup/restore rehearsal. These are useful components, not evidence that an external provider is configured or operational.

Changes in this phase are deliberately small:

- Storage reads now return “missing” only for missing-object errors; infrastructure/permission failures propagate as operational failures instead of being silently presented as 404s.
- Prescription and public-image uploads check the actual byte length after reading the payload as well as the declared file size.
- Staging builds add `X-Robots-Tag: noindex, nofollow, noarchive`. This discourages indexing but is **not access control**; restrict staging at the host/edge or with an approved access-control mechanism before it is reachable publicly.
- Checkout transaction failures emit a structured JSON event with a generated operation ID, error class and safe error code only; exception message, checkout contents, email, password, secret and prescription values are not serialized.
- Synthetic tests verify storage-area separation, traversal rejection, missing-vs-backend failure handling and reads after a fresh storage-module instance.

No automated retention policy, hosted backup, SMTP provider delivery, provider-specific S3 test, centralized log pipeline, error-monitoring SDK, alerting, or staging access gate is implemented/configured. Order email workflows now exist locally but remain unverified against a real provider.

## Component status

| Component | Classification | Evidence / remaining work |
|---|---|---|
| Local filesystem object adapter | **READY LOCALLY** | Isolated synthetic write/read/delete and module-reload persistence checks pass. POSIX private permissions are requested as `0700` directory/`0600` files. These mode bits are not a substitute for volume encryption/access controls and may behave differently on Windows. |
| Hosted persistent object storage | **REQUIRES HOSTED CONFIGURATION** | S3-compatible client exists and sends objects without public ACLs. No bucket, endpoint, identity, credentials, policy, encryption, versioning, lifecycle or provider integration was available/tested. Provider must enforce private access; public media is proxied through `/api/media`, not direct bucket URLs. |
| Private prescriptions | **REQUIRES EXTERNAL APPROVAL** | Upload validation, private namespace, safe generated keys, legacy-path containment, owner-auth check, attachment download, `no-store`, `nosniff`, CSP and audit event exist. No actual provider test; no policy/automation for retention, legal hold, export, purge, or deletion request. Owner/legal approval and storage security controls are blockers. |
| Public product media | **REQUIRES HOSTED CONFIGURATION** | JPEG/PNG/WebP signatures and 5 MiB size limit; app route serves only generated image names. Choose durable storage and verify hosted caching/CDN behavior without making prescriptions public. |
| SMTP transport | **REQUIRES HOSTED CONFIGURATION** | Nodemailer uses TLS (implicit TLS on 465, required STARTTLS otherwise), certificate verification, finite connection timeouts, header/address validation; test/discard sink never sends. SMTP host was not contacted and no sender/provider is approved. |
| Customer confirmations / owner notifications | **REQUIRES EXTERNAL APPROVAL** | Transactional outbox, owner notice and optional French customer receipt now exist locally. Owner setting defaults enabled; customer confirmation defaults disabled and is owner-toggleable. No real delivery was tested; approved SMTP sender/provider, business contact details and customer-notification approval are still required. See [`docs/ORDER_EMAIL_NOTIFICATIONS.md`](ORDER_EMAIL_NOTIFICATIONS.md). |
| Operational error logging | **READY LOCALLY** | Checkout failure safe structured event and operation ID are implemented/tested. Other server failures rely on Node/Next host logs; no universal request ID, structured logging policy, centralization, rotation or retention configured. |
| Error monitoring / alerting | **REQUIRES EXTERNAL APPROVAL** | `ERROR_MONITORING_DSN` is only a documented placeholder; no SDK or service configured. Choose host-native diagnostics or an approved integration and review data redaction/region/retention before sending events. |
| Local database backup / restore | **READY LOCALLY** | Previously verified custom PostgreSQL archive, `pg_restore --list`, restore into a newly created disposable clone, and aggregate comparisons are recorded in `docs/TECHNICAL_STAGING_PREPARATION.md`. This phase did not repeat or overwrite that rehearsal. |
| Hosted backup and recovery | **BLOCKED** | No hosted database/filesystem/bucket exists or credentials were provided. Cross-consistency of database references plus prescription objects, encryption, access, schedule, retention and real restore are unverified. |
| Runtime environment guard | **READY LOCALLY** | Startup validates HTTPS public origin, remote PostgreSQL/TLS, strong unique auth secret, owner identity, absence of seed credentials, storage and explicit email transport in staging/production. Actual host environment remains unconfigured. |
| Staging privacy/indexing | **BLOCKED** | Staging build gets `X-Robots-Tag` noindex directives, and private routes have local auth/no-store controls. A robots/header directive does not prevent access; host/edge authentication or network restriction must be approved/configured before staging has a public route. |
| Cache invalidation | **READY LOCALLY** | Admin mutations call Next `revalidatePath` for affected catalog, sitemap, checkout/admin and content routes. Prescription downloads are `private, no-store`; public media is short-lived public cache. CDN/reverse-proxy rules have not been tested and must bypass admin, API/private, cart, checkout, session and prescription routes. |
| Online payments | **BLOCKED / DISABLED** | Existing COD-only behavior is preserved. No payment provider or online payment was enabled. |

## Storage and private-document verification

### Existing design

- `src/lib/object-storage.ts` remains the server-only filesystem/S3 adapter for private prescription documents and legacy public media. New owner-managed public images may instead use MariaDB BLOB storage via `PUBLIC_MEDIA_STORAGE_DRIVER=mariadb`.
- `src/lib/uploads.ts` permits PDF/JPEG/PNG/HEIC prescriptions up to 10 MiB, checks file signatures, generates an opaque random filename, and sanitizes the display name.
- `src/lib/public-media.ts` decodes JPEG/PNG/WebP, caps source dimensions/bytes, re-encodes bounded WebP, and returns a versioned application route URL. MariaDB BLOB reads are isolated to the image route, not ordinary product queries; Hostinger durability remains unverified.
- `src/app/api/ordonnances/[id]/route.ts` requires an authenticated owner before looking up and reading the document. It responds as an attachment with `private, no-store, max-age=0`, `nosniff`, and a restrictive CSP. Anonymous access is covered by the acceptance suite.
- `src/app/api/media/[name]/route.ts` only serves strict generated image names and is intentionally public.
- Filesystem production paths must be absolute; durable persistence is an operator/host requirement. S3 key reads/writes use the configured bucket and private-by-default object commands.

### Changes and local synthetic tests

Read errors previously collapsed every exception—including connectivity and permission errors—into `null`, making outages indistinguishable from missing objects. Now only `ENOENT`/recognized S3 not-found responses return `null`; other errors propagate with a non-sensitive adapter message and original cause for host diagnostics. File payload byte lengths are rechecked after `arrayBuffer()`.

Storage test result: **5/5 PASS** (`tests/unit/object-storage.test.ts`). It covers private area write/read/delete, distinct public area, traversal rejection, compatibility fail-closed, backend failure distinction, and read after a fresh module instance using synthetic bytes. The restart test proves filesystem persistence across module reinitialization only; it does **not** prove a hosted volume survives container replacement. No S3 endpoint was contacted. Full E2E/acceptance additionally cover synthetic media uploads and anonymous prescription denial.

### Hosted integration steps

1. Choose a durable persistent volume or S3-compatible provider; do not use ephemeral application disk.
2. Create separate least-privilege access for this app/environment. Keep bucket private and block public access; public images still flow through the application route unless an explicitly approved design says otherwise.
3. Configure provider-side encryption at rest, TLS in transit, versioning/recovery and auditable access. Validate the provider's exact S3 API compatibility and permissions using a synthetic object.
4. For a filesystem-to-object migration, copy objects and update stored references in a separately rehearsed, integrity-checked process. **Do not switch the driver while existing references point to the old backend.** No migration utility is present.
5. Set a legally approved prescription retention/deletion policy and test deletion/restore, including legal holds and backup expiry. `deletePrescriptionFile` is a primitive, not a retention workflow.
6. Restore a synthetic backup and prove both DB references and object bytes are usable before any real documents are stored.

No actual provider integration can be verified until credentials and a target are authorized.

## Email

`src/lib/email.ts` is a server-only SMTP/discard transport, now called by the order notification outbox. In `discard` mode it validates the recipient/subject then returns `discarded` without sending message data. SMTP requires `EMAIL_TRANSPORT=smtp`, `EMAIL_FROM`, `SMTP_HOST`, optional `SMTP_PORT` (default 587; 465 uses implicit TLS), and either both `SMTP_USER` and `SMTP_PASSWORD` or neither. TLS certificate validation and finite transport timeouts are enabled. Header newlines and malformed recipient/sender addresses are rejected.

Tests: transport **3/3 PASS**; notification workflows **5/5 PASS**. The transactional outbox records one owner/customer notification per order, sends only after commit, records safe failure codes, supports explicit owner retry and retry on idempotent checkout replay, and leaves sent/discarded records terminal. Customer confirmation is admin-toggleable and disabled by default. Delivery is never part of the order transaction. No real recipient was contacted. SMTP success and exactly-once delivery are not claimed; ambiguous SMTP outcomes can leave a `SENDING` record and require review (details in [`docs/ORDER_EMAIL_NOTIFICATIONS.md`](ORDER_EMAIL_NOTIFICATIONS.md)).

Required host variables: `EMAIL_TRANSPORT`, approved `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, optional paired `SMTP_USER`/`SMTP_PASSWORD`, and existing `OWNER_EMAIL`. Obtain the sender/domain from the business; configure SPF, DKIM and DMARC with the authorized mail/domain provider. Do not use the example business domain or a fabricated sender. The owner controls `order.owner_email_enabled` and `order.customer_confirmation_enabled` in admin settings.

## Monitoring, diagnostics and cache

- A new `src/lib/operational-log.ts` emits JSON with event, generated `operationId`, error class, optional safe code and timestamp. Checkout transaction failures use it; a unit test verifies message/customer data are not emitted (**1/1 PASS**).
- `ERROR_MONITORING_DSN` and `LOG_LEVEL` are not consumed by application code. There is no monitoring SDK, trace propagation, alerting or central log sink. Host-native stdout collection is the minimal option; establish log retention, access, alert thresholds, health endpoint checks, DB/storage/email error signals and a procedure for correlating an `operationId` before opening staging.
- Do not forward raw request bodies, credentials, prescription contents, contact details or unredacted database errors to a monitoring vendor. Review region, retention, access and subprocessors before approval.
- Server-rendering failures currently rely on platform/Next.js diagnostics; database failures surface through normal server errors. Storage backend failures now propagate rather than masquerading as 404. Email caller/workflow failure reporting remains absent because there is no email caller.
- Existing mutation actions explicitly revalidate relevant paths/sitemap. Staging adds `X-Robots-Tag: noindex, nofollow, noarchive` only when built with `APP_ENVIRONMENT=staging`. Keep this separate from access control: require host-level access restriction and check the actual response header after an approved staging build. Configure proxy/CDN to avoid caching private/dynamic paths.

## Backups and recovery

### Existing local evidence

`docs/TECHNICAL_STAGING_PREPARATION.md` records a local PostgreSQL custom-format dump, successful archive listing, restore into a newly created clone, and comparison of business aggregates. The source `agharas/public` was not overwritten by that restore. The local database had no prescription file records; thus that evidence did not test coordinated DB+file recovery. No project backup automation script or hosted backup job is present.

### Hosted requirements (proposal, owner approval required)

- Automate at least daily encrypted PostgreSQL backups and point-in-time recovery if the chosen provider supports it; retain an independently protected copy. The precise frequency/retention must be approved against business and legal obligations.
- Back up private objects consistently with database references; use provider versioning/immutable recovery where approved. Encrypt backups in transit and at rest, with separately controlled keys and a tested key-recovery procedure.
- Least-privilege backup/restore identities, MFA for human operators, audit records, restricted restore targets; never restore over production as a test.
- Restore drills into disposable isolated databases and storage prefixes; verify schema/migration status, order/stock aggregates, object checksums, private access controls and representative synthetic prescription retrieval.
- Owner must set RPO/RTO and retention values. A daily backup cadence alone implies at best a nominal 24-hour backup-point interval and does not guarantee that RPO; transaction-log/PITR and application/object consistency need provider-specific verification. No RTO is claimed.

No hosted schedule, retention, encryption keys, access policies or restore was tested because there is no authorized host/provider configuration.

## Environment and staging requirements

Use separate secret scopes and isolated staging/production databases. Required variables already recognized by the application/configuration include:

| Purpose | Variables / requirement |
|---|---|
| Environment and canonical origin | `APP_ENVIRONMENT=staging` (or production), `NEXT_PUBLIC_SITE_URL=https://<owner-provided-origin>` at build and runtime. No domain was supplied. |
| Database | `DATABASE_URL` remote PostgreSQL URL with `sslmode=require`, `verify-ca`, or `verify-full`; distinct staging credentials/schema/database. `TEST_DATABASE_URL` must not exist on host. |
| Authentication/owner | `AUTH_SECRET` at least 32 random bytes, unique, secret-manager-only; `OWNER_EMAIL` owner-approved; no `SEED_*` or `OWNER_PASSWORD` host variables. Provision account out of band. |
| Owner public images | `PUBLIC_MEDIA_STORAGE_DRIVER=mariadb` with a quota `PUBLIC_MEDIA_MAX_TOTAL_BYTES` chosen from the verified DB allowance; or the existing object mode. No Hostinger MariaDB quota/backup test has been run. |
| Private prescription files | Existing runtime currently requires `OBJECT_STORAGE_DRIVER=s3`, bucket/region, optional HTTPS endpoint and provider identity or paired credentials; alternatively a Hostinger private persistent filesystem must first be verified. This is separate from public image BLOBs. |
| Email | `EMAIL_TRANSPORT=discard` only for staging with no send workflows, or `smtp` plus approved `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, optional paired `SMTP_USER`/`SMTP_PASSWORD`. |
| Operations | `LOG_LEVEL` is presently unused; `ERROR_MONITORING_DSN` is presently unused. Do not treat either as an active integration. Configure host logging/monitoring only after approval. |
| Indexing/access | Build `APP_ENVIRONMENT=staging` to add noindex response header. Add host/edge authentication or network controls; robots/noindex alone does not keep staging private. |
| Payments | Keep COD only. No online payment credentials or activation. |

No secrets or domain values have been invented or added. The build performed in this phase used a local test origin/schema and does not constitute a staging build.

## Regression results

All database-backed verification used local `agharas_test` synthetic schemas. No development/business records were reset or modified in this phase. Playwright used dedicated ports **3110** and **3111**; unrelated port **3000** was not modified. Test emails used `.invalid`/synthetic data and `discard`; no message left the machine.

| Required check | Result |
|---|---|
| TypeScript `npm run typecheck` | **PASS** |
| Full Vitest `npm test` | **118/118 PASS**, 17 files, schema `agharas_test_order_email_20261105_a` |
| Production build `npm run build` | **PASS**, Prisma Client 6.19.3; local test configuration only |
| Storage security tests | **5/5 PASS**; synthetic filesystem only, no provider credentials |
| Email integration tests | **3/3 PASS**; discard/malformed configuration only, no SMTP contact |
| Full Playwright E2E `npm run test:e2e` | **36/36 PASS**, 0 fail/skip/timeout |
| Full acceptance `npm run test:audit` | **41/41 PASS**, 0 fail/skip/timeout on fresh `agharas_test_order_email_accept_20261105_b` |
| Operational logger test | **1/1 PASS**; sensitive exception text omitted |
| Order email workflow tests | **5/5 PASS**; mocked/discard only; no SMTP contact |
| Full storage/email/checkout workflow detail | [`docs/ORDER_EMAIL_NOTIFICATIONS.md`](ORDER_EMAIL_NOTIFICATIONS.md) |

No assertions were weakened. No deployment, online payment, external object write, SMTP delivery or hosted restore was attempted.

## Required decisions and blockers

1. **Owner/business:** real legal/business details and official domain, owner identity/provisioning, staging access policy, approved SMTP sender/domain and customer-confirmation decision, prescription retention/deletion rules, backup retention and RPO/RTO.
2. **Qualified optician:** exact approved/incompatible/pending product-variant/lens/index/treatment decisions and supporting authority; test fixtures are not professional approval.
3. **Infrastructure owner:** host/region and Node LTS, isolated PostgreSQL/TLS, secret manager, durable private storage provider/volume, IAM and encryption/versioning/lifecycle, DNS/TLS, provider-side backup and restore controls, host/edge staging restriction, log/monitoring/alerting and CDN cache rules.
4. **Operations:** implement and rehearse DB+object recovery, configure retention/purge, verify hosted `noindex` and access gate, and test provider storage/SMTP only with authorized synthetic targets.
5. **Security/release:** repeat dependency audit at release; review migrations and deployment/rollback plan; obtain explicit written go/no-go. Keep payments disabled.

### Final classification

- **READY LOCALLY:** filesystem adapter behavior; synthetic upload/read/delete and failure semantics; local email discard and mock notification workflow/outbox tests; runtime validation; local cache invalidation; prior local database backup/restore evidence; safe checkout diagnostic.
- **REQUIRES HOSTED CONFIGURATION:** persistent volume or S3-compatible provider, SMTP provider/sender and delivery test, host-native logs/alerts, secure CDN/proxy policy, canonical HTTPS origin, database, secrets and staging build.
- **REQUIRES EXTERNAL APPROVAL:** customer confirmation enablement/content and sender, prescription retention and purge, monitoring data handling/provider, backup retention/RPO/RTO, professional optical compatibility decisions.
- **BLOCKED:** any claim of real cloud storage/SMTP/monitoring operation; coordinated hosted backup/restore; private staging access control; production launch. No provider or external infrastructure was provisioned or verified.

**No deployment is authorized by this report.**
