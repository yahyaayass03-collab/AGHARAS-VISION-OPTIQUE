# Architecture — AGHARAS VISION OPTIQUE

Ce document décrit l'organisation du code, les flux métier et les décisions
techniques structurantes. Il s'adresse aux développeurs qui reprennent le
projet.

---

## 1. Vue d'ensemble

Application **Next.js 15 (App Router)** monolithique, rendue côté serveur, avec
une base **PostgreSQL** via **Prisma**. Aucune API REST publique : les mutations
passent par des **Server Actions** typées, les lectures par des composants
serveur.

```
Navigateur
   │  HTML/RSC + <form action={serverAction}>
   ▼
Next.js (Node runtime)
   ├── app/(site)        vitrine + espace client
   ├── app/(auth)        connexion / inscription / mot de passe
   ├── app/admin         back-office (RBAC)
   ├── app/api/…         route handlers privés (ordonnances)
   ├── app/actions/*     Server Actions (mutations)
   ├── components/*      UI (serveur et client)
   └── lib/*             domaine, accès données, sécurité
   │
   ├── Prisma ──────────► PostgreSQL
   └── fs (storage/) ───► ordonnances privées (hors /public)
```

### Pourquoi ce découpage

- **Server-first** : le catalogue, les prix, le stock et les permissions sont
  calculés côté serveur ; le client ne reçoit que ce qu'il peut voir.
- **Server Actions** : moins de surface d'API, validation et autorisation au
  même endroit que la mutation, pas de endpoints JSON à sécuriser un par un.
- **Librairie de domaine pure** (`money`, `pricing`, `orders`, `permissions`,
  `validation`) : testable sans base ni runtime Next.
- **Pas de bibliothèque d'auth opaque** : sessions lisibles, révocables,
  auditables, et compatibles avec les Server Actions.

---

## 2. Arborescence

```
prisma/
  schema.prisma          modèle de données (source de vérité)
  seed.ts                données de démonstration idempotentes par réinitialisation
public/images/stitch/    visuels issus des exports Stitch + manifeste
storage/ordonnances/     fichiers privés (ignoré par Git, hors public)
src/
  app/
    (site)/              vitrine, panier, commande, compte, pages de contenu
    (auth)/              écrans d'authentification (coquille dédiée)
    admin/               back-office (layout + modules)
    api/ordonnances/     téléchargement privé des ordonnances
    actions/             Server Actions (client, panier, auth, admin)
    layout.tsx           polices, métadonnées, lien d'évitement
    sitemap.ts robots.ts not-found.tsx error.tsx
  components/
    site/ auth/ account/ admin/ ui/
  lib/
    db.ts                singleton Prisma
    auth/                password, session, guards
    money.ts pricing.ts  centimes, remises, livraison
    cart.ts wishlist.ts  panier/favoris invité ↔ connecté
    orders.ts            machine à états des commandes (pure)
    permissions.ts       catalogue de permissions + wildcards
    validation.ts        schémas Zod partagés
    uploads.ts           stockage privé des ordonnances
    settings.ts audit.ts rate-limit.ts content.ts …
tests/
  unit/ integration/ e2e/
docs/
```

---

## 3. Rendu et navigation

- `src/app/(site)/layout.tsx` : en-tête, navigation, panier, pied de page.
  Les données de navigation (catégories, réglages) sont lues côté serveur.
- `src/app/(auth)/layout.tsx` : coquille `AuthShell` autonome (pas de chrome
  vitrine) pour les écrans de connexion.
- `src/app/admin/layout.tsx` : coquille sombre, navigation filtrée par
  permissions ; un compte sans aucune permission admin voit une vue
  « accès refusé » au lieu d'une redirection en boucle.
- Les pages admin appellent `requirePermission(...)` **avant** toute lecture,
  puis les actions admin revérifient la permission (défense en profondeur).
- Les pages produit/catégorie sont générées dynamiquement depuis la base ;
  `sitemap.ts` et `robots.ts` exposent les routes publiques.

### Convention de nommage des routes

Routes et libellés en français (`/panier`, `/commande`, `/compte`,
`/configurateur`), y compris côté admin (`/admin/produits`,
`/admin/commandes`). Les identifiants techniques (modèles Prisma, actions,
permissions) restent en anglais pour rester lisibles dans l'écosystème.

---

## 4. Authentification et sessions

```
POST /connexion (Server Action)
  ├── validation Zod
  ├── rate limit (par e-mail + IP)
  ├── bcrypt.compare(password, user.passwordHash)
  ├── createSession(user.id)
  │     ├── token = 32 octets aléatoires (base64url)
  │     ├── Session.tokenHash = sha256(token)
  │     └── cookie agharas_session (httpOnly, SameSite=Lax, Secure en prod, 30 j)
  └── redirect (retour demandé ou /compte)
```

- Le jeton en clair n'existe que dans le cookie : la base ne contient que son
  empreinte SHA-256.
- `getSessionUser()` est mis en cache par requête (`react.cache`) et vérifie
  l'expiration **et** `user.isActive`.
- Déconnexion : suppression de la ligne `Session` + suppression du cookie.
- Réinitialisation : jeton aléatoire haché, à usage unique, expiration courte.
  Sans transport e-mail configuré, le lien n'est affiché qu'en développement
  (voir `docs/SECURITY.md`).

### Fusion invité → compte

Le panier et les favoris invités sont identifiés par des cookies contenant un
jeton opaque (`agharas_cart`, jeton favoris) ; les lignes correspondantes sont
stockées avec ce jeton. À la connexion, `mergeGuestCartOnLogin` et
`mergeWishlistOnLogin` rattachent les lignes au compte puis suppriment le
panier invité, sans doublon (clé `cartId + variantId + configKey`).

---

## 5. Catalogue, prix et stock

- Les prix sont des **entiers en centimes** (`priceCents`). Aucun flottant
  n'intervient dans les totaux ; le formatage (`1 850 DH`) est centralisé dans
  `lib/money.ts` avec espace insécable.
- `ProductVariant.priceCents` peut surcharger le prix produit.
- Le stock vit dans `InventoryItem` (un par variante) et **chaque mouvement**
  est journalisé dans `InventoryMovement` (`INITIAL`, `SALE`, `ADJUSTMENT`,
  `CANCELLATION`). Le stock n'est jamais modifié sans mouvement associé.
- Une ligne de panier peut porter une configuration de verres
  (`lensSnapshot`) et éventuellement une ordonnance liée.

---

## 6. Configurateur de verres

Parcours en 4 étapes (`LensWizard`, client) :

1. Type de verre (unifocal, progressif…) ;
2. Indice (prix et limites de sphère) ;
3. Traitements (anti-reflet, blue protect, photochromique…) ;
4. Correction : ordonnance téléversée, saisie manuelle, WhatsApp, ou plus tard.

Le prix est calculé en direct côté client **et recalculé côté serveur** au
moment de l'ajout au panier. La configuration est figée dans un JSON
(`LensSnapshot`) : type, indice, traitements (nom + prix), total verres, résumé
lisible. Aucune table dédiée : le snapshot est la source de vérité pour la
ligne de panier puis pour la ligne de commande.

---

## 7. Panier et commande

### Panier

`lib/cart.ts` résout le panier courant (utilisateur connecté sinon cookie),
charge les lignes avec produit/variante/image/stock, puis calcule :

```
lineTotal = (prixVariante + prixVerres) × quantité
sousTotal = Σ lineTotal
remise    = coupon applicable (type, seuil, dates, limites)
livraison = mode choisi (gratuit au-delà d'un seuil éventuel)
total     = max(0, sousTotal − remise) + livraison
```

Le calcul est refait à chaque lecture : aucun total n'est stocké dans le panier.

### Commande (`placeOrderAction`)

1. Validation Zod de l'adresse, du mode de livraison, du paiement et du
   consentement aux CGV.
2. Contrôle de la méthode de paiement : **seul `CASH_ON_DELIVERY` est accepté**,
   CMI est refusé côté serveur même si le formulaire est modifié.
3. Idempotence : `idempotencyKey` unique ; une clé déjà utilisée renvoie vers la
   confirmation existante (sans double débit de stock).
4. Vérification de disponibilité (produit/variante actifs) et de stock.
5. Transaction PostgreSQL :
   - décrément conditionnel du stock (`quantity >= demandée`) : si 0 ligne
     modifiée → `StockError` et rollback ;
   - `InventoryMovement` de vente ;
   - création de `Order` + `OrderItem` (snapshot complet) + historique +
     `Payment` (COD, en attente) + `Shipment` (en préparation) ;
   - incrément du coupon et enregistrement de `CouponRedemption`.
6. Redirection vers `/commande/confirmation/[reference]?token=…`.

### Snapshot de commande

`OrderItem` conserve nom, slug, variante, SKU, image, prix unitaire, prix des
verres, quantité, total de ligne et configuration JSON. `Order` conserve
l'adresse, le nom du mode de livraison et tous les montants. Une modification
ultérieure du catalogue **ne change jamais** une commande passée.

### Machine à états

`lib/orders.ts` (pur, testé) :

```
PENDING ──► CONFIRMED ──► IN_PRODUCTION ──► SHIPPED ──► DELIVERED
   │            │                │
   └────────────┴────────────────┴──► CANCELLED
```

Toute transition est validée côté serveur ; l'annulation restaure le stock
(`InventoryMovement` raison `CANCELLATION`) et journalise l'événement dans
`OrderStatusHistory`.

### Accès à la confirmation

Deux voies : session propriétaire **ou** jeton `accessToken` non devinable
(192 bits) passé en query. La page est `noindex` et non mise en cache.

---

## 8. Ordonnances (données sensibles)

```
Navigateur ──upload──► Server Action
                         ├── taille ≤ 10 Mo
                         ├── type réel détecté par signature binaire
                         ├── nom aléatoire, écriture 0600 hors public/
                         └── Prescription (statut PENDING)
Staff ──► /admin/ordonnances ──► revue (valider/refuser) + audit
Client ──► /compte/ordonnances ──► suppression (fichier + ligne)
Téléchargement ──► /api/ordonnances/[id]
                     ├── session requise
                     ├── propriétaire OU permission prescriptions.view
                     ├── Content-Disposition: attachment
                     └── Cache-Control: no-store + nosniff
```

Le chemin stocké est relatif au répertoire privé ; `resolveStoredPath` refuse
toute sortie du répertoire configuré (protection contre le path traversal).

---

## 9. RBAC administration

- `Role.permissions: string[]` contient des codes `module.action`
  (`products.view`) ou des wildcards (`products.*`, `*`).
- `Role.isSuperAdmin` court-circuite l'évaluation ; `hasPermission` refuse par
  défaut.
- `requirePermission(code)` dans les pages, `requirePermissionAction` dans les
  actions ; les deux lèvent une redirection/erreur explicite.
- `canGrantPermissions` empêche un gestionnaire d'accorder des droits qu'il ne
  possède pas lui-même (y compris via wildcard).
- Les rôles système ne peuvent pas être supprimés et le rôle super-administrateur
  n'est pas modifiable ; un compte super-administrateur ne peut être désactivé
  ni par un autre membre du staff ni par lui-même.
- Toute action sensible (stock, commandes, ordonnances, réglages, comptes) écrit
  une ligne `AuditLog` avec acteur, action, cible et métadonnées.

---

## 10. Contenu, réglages et pages légales

- `ContentPage` stocke un corps en **texte simple balisé** (`##`, `###`, `-`,
  `>`, `**gras**`). `lib/content.ts` le transforme en HTML sûr (échappement
  puis mise en forme), avec ancres uniques et table des matières.
- Six slugs autorisés : `livraison`, `retours`, `confidentialite`, `cgv`,
  `mentions-legales`, `a-propos`. L'admin ne peut créer que ces pages.
- `Setting` (clé/valeur) porte les réglages boutique. Deux invariants sont
  imposés côté serveur : `payment.online_enabled = "false"` et
  `payment.cod_enabled = "true"`.
- Les bannières, la FAQ et les salons sont également en base pour être
  modifiables sans redéploiement.

---

## 11. Design system et fidélité Stitch

- Tokens Tailwind 4 définis par `@theme` dans `src/app/globals.css` : vert profond
  `#2E4243`, or `#CFB56A`, blanc, off-white `#F7F8F6`, typographies Bodoni Moda
  (titres) et Hanken Grotesk (texte).
- Les écrans ont été reconstruits depuis les `code.html` des exports Stitch
  (15 écrans, voir `docs/STITCH_DESIGN_INVENTORY.md`).
- Les captures PNG n'ont pas pu être comparées visuellement (pas d'ingestion
  d'images côté outil de développement) : la fidélité repose sur le HTML, les
  classes et les tokens, pas sur une comparaison pixel.
- Le logo officiel n'existant pas, le logotype typographique Stitch est
  conservé.

---

## 12. Erreurs, SEO, performance

- `not-found.tsx` et `error.tsx` en français, avec retour vers la vitrine.
- Métadonnées par page, `sitemap.xml` dynamique, `robots.txt` interdisant
  `/admin`, `/compte`, `/api`, `/commande`.
- Images via `next/image` (AVIF/WebP, tailles 390→1920), polices via
  `next/font`, composants serveur par défaut, client uniquement pour les
  interactions (menu mobile, wizard, formulaires à état).
- En-têtes de sécurité globaux dans `next.config.ts`.

---

## 13. Décisions et compromis

| Décision | Raison | Conséquence |
| --- | --- | --- |
| Sessions maison en base | Contrôle, révocation, pas de dépendance bêta | Pas de SSO/OAuth prêt à l'emploi |
| Snapshot JSON des verres | Évite une table de configuration rigide | Pas de requête analytique fine sur les options |
| `Int` centimes | Exactitude monétaire | Conversion explicite pour l'affichage |
| `db push` en développement | Rapidité d'itération | Migrations versionnées à générer avant production |
| Limitation de débit en mémoire | Zéro dépendance externe | Non partagée entre instances |
| Images produit par URL | Pas d'upload produit pour l'instant | Dépend de l'hébergement des fichiers |
| Jamais d'avis fictifs | Exigence éditoriale/légale | Pas de note structurée avant collecte réelle |

---

## 14. Points d'extension prévus

- Transport e-mail (réinitialisation, confirmation de commande) : brancher un
  fournisseur dans `actions/auth.ts` et `actions/checkout.ts`.
- Paiement CMI : ajouter un provider, un webhook idempotent et activer
  `payment.online_enabled` (aujourd'hui forcé à `false`).
- Upload d'images produit : réutiliser le pipeline de `uploads.ts` avec un
  répertoire public ou un stockage objet.
- Rétention automatisée des ordonnances : tâche planifiée (suppression +
  audit) selon la durée validée avec le CNDP.
- Rate limiting distribué : remplacer `lib/rate-limit.ts` par Redis.
- Migrations versionnées : `prisma migrate dev` puis `migrate deploy` en CI/CD.
