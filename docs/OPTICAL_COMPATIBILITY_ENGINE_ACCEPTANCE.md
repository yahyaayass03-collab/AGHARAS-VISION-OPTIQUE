# Optical compatibility engine — implementation status

**Technical implementation incomplete. Professional approval pending. Not approved for production.**

## Implemented

- `OpticalCompatibilityRule` stores an exact product, variant, lens type, index and complete treatment set, a three-state decision, reviewer, review date, optional note and administrative actor. A unique SHA-256 signature provides a canonical exact key, independent of treatment order. The database has a unique index, referenced product/variant/type/index foreign keys, and a check requiring reviewer and date for non-pending decisions.
- No general frame/category rule is implemented, so there is no broad-versus-specific precedence: the exact combination is the only lookup. No matching rule means pending. Separate treatment subsets do not approve a larger set. The pure status helper resolves an incompatible conflict as incompatible and all other ambiguous cases as pending.
- `/admin/verres/compatibilite` lets the owner record a combination and a decision. Approved/incompatible decisions require a reviewer, date and explicit confirmation. Actions use existing owner permission checks and record changes in the audit log. These records capture the owner's assertion of a professional review; they do not independently verify professional identity or qualifications.
- The server checks exact decisions on configured-cart addition, quantity changes, cart rendering, checkout and again inside the order transaction. Owner rule changes and the final checkout check share a PostgreSQL transaction advisory lock. Ordinary frame-only purchases are not subject to these rules. Existing orders and snapshots are not rewritten.
- `20261029130000_optical_compatibility` creates the new table and enum without inserting approvals. It was applied only to fresh isolated synthetic schemas in `agharas_test`; **it has not been applied to the existing development database**. The new code requires this migration before the new admin/cart/checkout paths can run against that database. Back up and review the rollout before applying it. No destructive reset was performed.

## Effects and outstanding technical work

- Once the migration is applied, **all previously purchasable correction combinations without an explicit matching approval are blocked**. Existing order snapshots remain intact; previous availability does not constitute evidence of professional review. On the freshly seeded synthetic catalogue, ten active products are flagged lens-compatible: Le Marais N°04, L'Hivernal Vert Émeraude, Titane Minimaliste Noir Mat, Amalfi Translucide Champagne, Amalfi Solaire Havana Polar, Silhouette Pure Pantos, L'Hivernal Écaille Classique, Urban Rectangulaire Ultra-Thin, Atelier Titane Découpé and Clip Solaire Magnétique 2-en-1. This is not an inventory of the untouched development database; inspect its actual products and decisions before rollout.
- The UI only lists the 100 latest saved decisions. It does not enumerate all missing combinations, offer filters or a complete export, nor display effective decisions live in the configurator. The form resets fields after submission; correcting an error may require reselecting the combination. Quantity changes are refused when invalid and the cart displays an explanatory message, but the quantity action itself has no individual feedback.
- Treatment IDs are stored as an array validated by the application rather than relational foreign keys. The existing data model and checkout need further review for concurrent product, variant, lens-price and availability edits: the advisory lock currently serializes compatibility decisions against checkout, **not every other catalogue or price mutation**. Full transaction-boundary revalidation of all authoritative prices and concurrent mutation tests remain outstanding.
- There is no broad-scope or treatment-pair decision model; exact combinations can require many reviews. Product/frame availability is checked, but the interface has no per-rule edit shortcut or complete pending report. Further safeguards and usability work are needed before claiming all requested administration and enforcement points complete.
- Dedicated integration/E2E coverage for pending and missing rules, stale rule changes after cart addition, multiple treatments including incompatible combinations, direct forged actions, concurrent updates and post-rule-change historical order preservation is still required. Existing audit setup inserts **synthetic approvals only** into an explicitly guarded local test schema; these are not professional approvals.

## WhatsApp support channel (technical, verified)

- The official number **+212 628-889950** (`212628889950`, `https://wa.me/212628889950`) is centralized in `src/lib/whatsapp.ts` and stored in the existing `Setting` key `store.whatsapp`. The owner edits it in **Paramètres de la boutique**; malformed values are rejected server-side, and changes propagate to the storefront without a rebuild.
- Every public `wa.me` link (header, footer, homepage, product, configurator, cart, checkout, order confirmation, contact, FAQ, boutiques, content pages) is built by one helper with French contextual messages that are URL-encoded. Messages contain no prescription values (sphere, cylinder, axis, addition), no customer identity and no order reference. Blocked optical selections expose a WhatsApp help link from the French error state.
- `store.whatsapp` is the authoritative source; the official number is the seed/default and the fallback when the setting is empty. The existing development database value was updated non-destructively by SQL; no business record was deleted. The previous placeholder number is no longer present in source, seed defaults or public links.
- This is a **link-only support channel**, not an approval mechanism: a WhatsApp conversation cannot approve a combination, change a rule or override the pending-by-default server check.

## Verification

Latest complete run (29 October 2026):

- TypeScript: PASS.
- Vitest: **90 PASS / 0 FAIL / 0 SKIP** (including two pure compatibility tests and five WhatsApp tests).
- Production build: PASS.
- Full E2E: **31 PASS / 0 FAIL / 0 SKIP** on a fresh isolated test schema.
- Full acceptance: **41 PASS / 0 FAIL / 0 SKIP** on a separate fresh isolated test schema, including the owner-decision test, the synthetic approved purchase and three WhatsApp tests (public links, owner update propagation, invalid-number rejection).
- One first-run failure in the new WhatsApp spec was a Playwright selector strictness issue: the app returned the expected invalid-number alert, but Next.js also renders an empty `role="alert"` route announcer. The selector was scoped to the settings form feedback; the assertion itself was not weakened. The focused rerun and the complete 41-test rerun both passed.

## Technical completeness vs professional vs production readiness

| Dimension | Status | Basis |
| --- | --- | --- |
| Technical implementation | PARTIALLY COMPLETE | Exact-combination model, owner workflow, server enforcement at all requested points and WhatsApp wiring are implemented and tested. Pending-combination reporting/filters/export, effective-status display in the configurator, dedicated multi-treatment/stale-rule E2E and broader concurrency hardening remain open. |
| Professional validation | BLOCKED | No real optician has supplied approved, incompatible or conditional combinations, nor qualifications, dates or evidence. Synthetic test approvals are test fixtures only. |
| Production readiness | BLOCKED | Optical migration is not applied to the development database; legal data, HTTPS/canonical, backup/restore, prescription retention, email and dependency/security reviews remain open. |

## Professional approval and operations

An optician must supply actual supported, incompatible and conditional combinations, qualifications, dates and supporting references. `docs/OPTICAL_COMPATIBILITY_REVIEW.md` contains the review checklist. No real combinations were approved by this work. HTTPS/canonical configuration, legal approval, backup/restore, prescription privacy/retention, email and other production gates remain open. No deployment or real payment activation occurred.
