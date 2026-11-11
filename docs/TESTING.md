# Tests — AGHARAS VISION OPTIQUE

Trois niveaux : **unitaire** (logique pure), **intégration** (PostgreSQL dédié),
**E2E** (parcours navigateur sur build de production). Aucun test ne touche la
base de développement.

---

## 1. Commandes

```bash
npm run typecheck   # TypeScript strict
npm test            # Vitest : 8 fichiers, 80 tests
npm run test:e2e    # Playwright : 34 tests (build + serveur port 3100)
```

Résultats de référence (dernière exécution, 28/10/2026) :

| Suite | Fichiers | Tests | Résultat |
| --- | --- | --- | --- |
| Unitaires | 7 | 74 | ✅ |
| Intégration | 1 | 6 | ✅ |
| E2E Playwright | 5 specs + setup | 34 | ✅ |

`npx tsc --noEmit` et `npm run build` passent également.

---

## 2. Tests unitaires (Vitest)

Configuration : `vitest.config.ts`, environnement `node`, alias `@ → src`.
Modules **purs uniquement** (aucun import de `server-only`, de `db.ts`, de
`settings.ts` ou d'`audit.ts`).

| Fichier | Couverture |
| --- | --- |
| `tests/unit/money.test.ts` | Centimes → DH, espace insécable, arrondis, formats négatifs/limites |
| `tests/unit/pricing.test.ts` | Prix verres, remises `PERCENT`/`FIXED`, seuils, dates, frais de port offerts |
| `tests/unit/validation.test.ts` | Schémas Zod (inscription, adresse, commande, contact, produit, coupon…) |
| `tests/unit/permissions.test.ts` | `hasPermission`, wildcards, super-admin, refus par défaut, `canGrantPermissions` |
| `tests/unit/orders.test.ts` | Machine à états des commandes (transitions autorisées/interdites) |
| `tests/unit/content.test.ts` | Parseur de contenu (`##`, listes, citations, gras), ancres uniques, placeholders |
| `tests/unit/utils.test.ts` | Utilitaires (slug, initiales, troncature, formatage) |

### Ajouter un test unitaire

1. Créer `tests/unit/mon-sujet.test.ts`.
2. Importer la fonction depuis `@/lib/...`.
3. Éviter tout module marqué `server-only` (Vitest ne résout pas cet alias).

---

## 3. Tests d'intégration (PostgreSQL)

Fichier : `tests/integration/order-snapshot.test.ts`.

Ils vérifient les garanties **structurelles** du schéma :

- la commande conserve ses snapshots (nom, slug, SKU, prix, configuration) après
  modification/suppression du produit ;
- `OrderItem.productId` passe à `NULL` (`SetNull`) sans perdre la ligne ;
- les contraintes d'unicité (`reference`, `accessToken`, `idempotencyKey`,
  `CouponRedemption.orderId`) sont réellement appliquées ;
- les suppressions en cascade attendues (commande → lignes) fonctionnent.

### Préparer la base de test

```bash
# PostgreSQL local
$env:DATABASE_URL='postgresql://agharas:agharas_dev_local@localhost:5432/agharas_test?schema=public'
npx prisma db push --skip-generate
```

Avec Docker Compose, la base `agharas_test` est créée automatiquement
(`docker/initdb/01-create-test-db.sql`).

Le test lit `TEST_DATABASE_URL`, sinon retombe sur l'URL locale
`agharas_test` écrite en dur. **Vitest ne charge pas `.env`** : exportez la
variable dans le shell si vous utilisez une autre instance.

Chaque exécution crée ses propres lignes (suffixe aléatoire) et les supprime
dans `afterAll` ; la base de test n'est pas réinitialisée globalement.

---

## 4. Tests E2E (Playwright)

Configuration : `playwright.config.ts`.

- Le serveur de test est un **build de production** :
  `npm run build && npm run start -- --port 3100` (pas de HMR pendant les traces).
- `workers: 1` : les scénarios partagent la base de démonstration (stock,
  commandes) et doivent s'exécuter en série.
- Projet `setup` : connexion réelle des comptes de démo, sauvegarde des états de
  session dans `tests/e2e/.auth/{client,admin}.json` (ignorés par Git).
- Projet `chromium` : dépend du setup, viewport 1440×900, locale `fr-MA`,
  fuseau `Africa/Casablanca`.
- Trace et capture uniquement en cas d'échec.
- Les limites de débit étant en mémoire, elles repartent de zéro à chaque
  campagne (le serveur est recréé).

### Scénarios couverts

| Spec | Scénarios |
| --- | --- |
| `smoke.spec.ts` | Accueil (hero, nav, lien d'évitement), catalogue + recherche, fiche produit + panier, configurateur, pages institutionnelles, 404 française, `robots.txt`, `sitemap.xml`, ordonnance protégée, en-têtes de sécurité |
| `checkout.spec.ts` | Panier vide, ajout au panier, commande invitée complète, confirmation par jeton, puis annulation admin (restauration du stock) |
| `account.spec.ts` | Tableau de bord, historique + détail, sous-pages protégées, favoris, refus admin pour un client, redirections visiteur, message d'erreur générique |
| `admin.spec.ts` | Dashboard + navigation, ouverture des modules, détail commande et transitions autorisées, refus RBAC (opticien), redirection avec retour |
| `responsive.spec.ts` | Accueil, catalogue et menu mobile sans débordement horizontal en 390 / 768 / 1440 px |

### Prérequis E2E

1. Base de démonstration seedée (`npm run db:seed`).
2. Application buildable (`npm run build` — fait par Playwright).
3. Port 3100 libre.

```bash
npm run db:seed
npm run test:e2e
```

Rapport HTML : `playwright-report/` (ouvert manuellement).

### Nettoyage

Le test de commande annule la commande créée via l'administration, ce qui
réintègre le stock. Des commandes annulées peuvent subsister après des runs
interrompus ; `npm run db:seed` remet la base de démonstration à zéro.

---

## 5. Ce qui n'est pas testé

| Sujet | Raison / statut |
| --- | --- |
| Comparaison pixel avec les exports Stitch | Pas d'ingestion d'images disponible ; fidélité vérifiée sur le HTML |
| Envoi réel d'e-mails | Aucun transport configuré |
| Paiement en ligne (CMI) | Volontairement désactivé |
| Téléversement HEIC de bout en bout | Signature testée en unitaire, pas de fixture navigateur |
| Concurrence réelle sur le stock | Décrément conditionnel couvert par la logique, pas par un test de charge |
| Accessibilité automatisée (axe) | Non branchée ; structure sémantique et navigation clavier vérifiées manuellement |
| Performance (Lighthouse/CI) | Non mesurée en continu |
| Multi-instances (rate limit partagé) | Non applicable en mono-instance |

---

## 6. Intégration continue (proposition)

```yaml
# .github/workflows/ci.yml (à créer)
- npm ci
- npm run typecheck
- npm test
- npm run build
- npm run test:e2e   # avec un service PostgreSQL et npm run db:push + db:seed
```

Points d'attention CI :

- fournir `DATABASE_URL`, `TEST_DATABASE_URL` et `AUTH_SECRET` ;
- créer la base de test puis `prisma db push` ;
- conserver `playwright-report/` et les traces comme artefacts ;
- ne jamais exécuter le seed contre une base de production.
