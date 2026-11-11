# Modèle de données — AGHARAS VISION OPTIQUE

Source de vérité : [`prisma/schema.prisma`](../prisma/schema.prisma).
Base cible : PostgreSQL 16+ (développé et testé sur PostgreSQL 18).

---

## 1. Principes

1. **Identifiants opaques** : `cuid()` pour toutes les clés primaires ; aucun
   identifiant incrémental exposé.
2. **Argent en entiers** : tous les montants sont des `Int` de **centimes**
   (`priceCents`, `totalCents`, `shippingCents`…). Aucun `Float` monétaire.
3. **Snapshots** : une commande ne dépend pas de l'état courant du catalogue
   (nom, prix, image, configuration sont recopiés dans `OrderItem`).
4. **Traçabilité** : stock via `InventoryMovement`, statuts via
   `OrderStatusHistory`, actions staff via `AuditLog`.
5. **Défense en profondeur** : les contraintes SQL (unicité, index) doublent les
   validations applicatives.

### Conventions

- Tables au singulier, `PascalCase` (Prisma).
- Champs en `camelCase`, montants suffixés `Cents`.
- Dates `createdAt` / `updatedAt` sur les entités mutables.
- Suppressions en cascade uniquement pour les dépendances fortes
  (panier → lignes, commande → lignes) ; sinon `SetNull` pour préserver
  l'historique.

---

## 2. Domaines

### 2.1 Identité et RBAC

| Modèle | Rôle | Champs clés |
| --- | --- | --- |
| `User` | Client **ou** membre du staff | `email` unique, `passwordHash`, `isActive`, `roleId` |
| `Role` | Rôle + permissions | `permissions String[]`, `isSystem`, `isSuperAdmin` |
| `Session` | Session opaque | `tokenHash` unique (SHA-256), `expiresAt`, `userId` |
| `PasswordResetToken` | Réinitialisation | `tokenHash` unique, `expiresAt`, `usedAt` |
| `Address` | Carnet d'adresses client | `isDefault`, champs postaux |

- Un seul modèle `User` pour les clients et le staff ; le rôle distingue les
  usages. Un client a un rôle sans permission admin.
- `Session` et `PasswordResetToken` ne stockent **jamais** le jeton en clair.
- Les sessions sont supprimées en cascade avec l'utilisateur ; les commandes
  sont conservées (`userId → SetNull`).

```
Role 1 ─── n User 1 ─── n Session
                 1 ─── n Address
                 1 ─── n PasswordResetToken
```

### 2.2 Catalogue

| Modèle | Rôle | Champs clés |
| --- | --- | --- |
| `Category` | Catégorie de navigation | `slug` unique, `imageUrl`, `sortOrder`, `isActive` |
| `Brand` | Marque / atelier | `slug` unique, `imageUrl` |
| `Product` | Monture, solaire, clip, lentille, accessoire | `slug`/`sku` uniques, `priceCents`, `compareAtCents`, type, genre, forme, dimensions |
| `ProductImage` | Galerie ordonnée | `url`, `alt` obligatoire, `sortOrder` |
| `ProductVariant` | Coloris vendable | `sku` unique, `(productId, colorName)` unique, `priceCents` optionnel |
| `InventoryItem` | Stock d'une variante | `variantId` unique, `quantity`, `lowStockThreshold` |
| `InventoryMovement` | Journal de stock | `delta`, `reason`, `note`, `userId` |

```
Category 1 ─── n Product n ─── 1 Brand
                    │
                    ├── n ProductImage
                    └── n ProductVariant 1 ─── 1 InventoryItem
                                     └── n InventoryMovement
```

- Le prix effectif d'une ligne = `variant.priceCents ?? product.priceCents`.
- Le stock décrémente de façon **conditionnelle** (`quantity >= demandée`) pour
  éviter les surventes concurrentes.
- `InventoryReason` : `INITIAL`, `RESTOCK`, `SALE`, `ADJUSTMENT`, `RETURN`,
  `CANCELLATION`.

### 2.3 Verres correcteurs

| Modèle | Rôle | Champs clés |
| --- | --- | --- |
| `LensType` | Type de verre | `kind` (`SINGLE_VISION`, `PROGRESSIVE`, `NONE`), `priceCents`, `productTypes[]` |
| `LensIndex` | Indice de réfraction | `value` (« 1.60 »…), `priceCents`, `maxAbsSphere` |
| `LensTreatment` | Traitement optionnel | `priceCents`, `isDefault` |

Aucune table de configuration de commande : la combinaison choisie est figée en
JSON dans `CartItem.lensSnapshot` puis `OrderItem.configuration` (nom, prix et
résumé inclus), avec `Prescription` optionnellement liée.

### 2.4 Ordonnances

`Prescription` porte :

- la méthode : `UPLOAD`, `MANUAL`, `WHATSAPP`, `LATER` ;
- le statut de revue : `PENDING`, `RECEIVED`, `VERIFIED`, `REJECTED` ;
- les valeurs optiques : sphère/cylindre/axe/addition par œil, écart pupillaire
  (`Decimal`) ;
- le fichier privé : `filePath`, `originalFileName`, `fileMime`, `fileSize` ;
- la revue : `reviewedById`, `reviewedAt`, `reviewNote`.

Le fichier lui-même n'est **pas** en base : seul le chemin relatif au répertoire
privé est stocké. `userId → SetNull` conserve l'ordonnance liée à une commande
même si le compte est supprimé.

### 2.5 Panier et favoris

| Modèle | Rôle | Contraintes |
| --- | --- | --- |
| `Cart` | Panier invité ou utilisateur | `token` unique, `userId?`, `couponCode?` |
| `CartItem` | Ligne de panier | `(cartId, variantId, configKey)` unique ; `lensSnapshot Json?` ; `prescriptionId?` |
| `WishlistItem` | Favori | `(userId, productId)` et `(token, productId)` uniques |

`configKey` distingue deux configurations de verres pour la même variante.
Le panier invité est rattaché à l'utilisateur à la connexion, puis supprimé.

### 2.6 Commandes

| Modèle | Rôle | Champs clés |
| --- | --- | --- |
| `Order` | Commande | `reference` unique, `accessToken` unique, `idempotencyKey?` unique, montants, snapshot d'adresse |
| `OrderItem` | Ligne figée | nom, slug, variante, SKU, image, prix, verres, quantité, `configuration Json?` |
| `OrderStatusHistory` | Journal de statuts | `fromStatus?`, `toStatus`, `note`, `userId` |
| `Payment` | Paiement | `method`, `status`, `amountCents` |
| `Shipment` | Expédition | `method`, `carrier`, `trackingNumber`, `status` |
| `CouponRedemption` | Usage d'un code | `orderId` unique, `email` |

```
Order 1 ─── n OrderItem
      1 ─── n OrderStatusHistory
      1 ─── n Payment
      1 ─── n Shipment
      1 ─── 1 CouponRedemption
```

- `accessToken` (192 bits) permet l'accès à la confirmation sans session, sans
  rendre les références devinables.
- `idempotencyKey` empêche la double création d'une commande sur double clic ou
  rejeu réseau ; l'unicité est garantie par la base.
- Les statuts suivent la machine à états de `src/lib/orders.ts` :
  `PENDING → CONFIRMED → IN_PRODUCTION → SHIPPED → DELIVERED`, avec annulation
  possible depuis `PENDING`, `CONFIRMED` et `IN_PRODUCTION`.
- À l'annulation, le stock est réintégré par un `InventoryMovement`
  (`CANCELLATION`) — jamais par une écriture directe silencieuse.

### 2.7 Promotions et livraison

| Modèle | Rôle | Champs clés |
| --- | --- | --- |
| `Coupon` | Code promotionnel | `code` unique, `type` (`PERCENT`/`FIXED`), `value`, seuil, dates, limites d'usage |
| `CouponRedemption` | Traçabilité | `orderId` unique, `email` |
| `ShippingMethod` | Mode de livraison | `code` unique, `priceCents`, `freeFromCents`, `estimatedDays` |

`Coupon.value` est un pourcentage entier (`PERCENT`) ou un montant en centimes
(`FIXED`). La limite globale (`usageLimit`) et les dates de validité sont
vérifiées au calcul du panier. `perCustomerLimit` est présent dans le schéma
mais **n'est pas encore appliqué** : seule la limite globale est contrôlée.

### 2.8 Contenu, réglages, opérations

| Modèle | Rôle |
| --- | --- |
| `Banner` | Bannière éditoriale par emplacement (`home`, etc.) |
| `FaqItem` | Question/réponse catégorisée |
| `ContentPage` | Pages informationnelles/légales (corps texte balisé) |
| `Store` | Salon : adresse, horaires, services |
| `Setting` | Réglages clé/valeur (`payment.*`, `shipping.*`, `store.*`…) |
| `NewsletterSubscriber` | Inscription newsletter (`email` unique) |
| `ContactMessage` | Message de contact (`NEW`, `IN_PROGRESS`, `CLOSED`) |
| `AuditLog` | Journal des actions staff |

- `ContentPage.slug` est restreint aux six pages connues par l'action admin.
- `Setting` n'a qu'une clé primaire (`key`) : c'est un magasin clé/valeur
  volontairement simple, avec des invariants applicatifs
  (`payment.online_enabled = "false"`, `payment.cod_enabled = "true"`).
- `AuditLog` conserve `userId → SetNull` et une copie de `actorEmail` pour ne
  pas perdre l'historique si un compte staff est supprimé.

---

## 3. Index et contraintes notables

| Table | Contrainte / index | Raison |
| --- | --- | --- |
| `User` | `email` unique | Connexion |
| `Product` | `slug`, `sku` uniques ; index `(type, isActive)`, `(isActive, isFeatured)`, `priceCents`, `gender` | Filtres catalogue |
| `ProductVariant` | `sku` unique ; `(productId, colorName)` unique | Pas de doublon de coloris |
| `InventoryItem` | `variantId` unique | Un stock par variante |
| `CartItem` | `(cartId, variantId, configKey)` unique | Fusion de panier sans doublon |
| `Order` | `reference`, `accessToken`, `idempotencyKey` uniques ; index `(status)`, `(createdAt)`, `(userId)` | Suivi, idempotence, back-office |
| `OrderItem` | index `orderId` | Affichage détail |
| `CouponRedemption` | `orderId` unique | Une utilisation par commande |
| `Session` | `tokenHash` unique ; index `expiresAt` | Lecture rapide, purge |
| `AuditLog` | index `(createdAt)`, `(entityType, entityId)` | Consultation et recherche du journal |

---

## 4. Cycle de vie d'une commande (données)

```
Cart (invité)
  └─ CartItem [lensSnapshot, prescriptionId]
        │  placeOrderAction (transaction)
        ▼
Order PENDING ──► OrderItem [snapshot complet]
  ├─ Payment CASH_ON_DELIVERY / PENDING
  ├─ Shipment PREPARING
  ├─ OrderStatusHistory (→ PENDING)
  └─ CouponRedemption (si remise)
        │
        ├─ stock −n + InventoryMovement(SALE)
        ▼
CONFIRMED → IN_PRODUCTION → SHIPPED → DELIVERED
        └─ CANCELLED → stock +n + InventoryMovement(CANCELLATION)
```

---

## 5. Migrations et exploitation

- Le schéma est actuellement appliqué avec `prisma db push` en développement et
  pour la base de test.
- **Avant la production**, générer un historique versionné :
  `npx prisma migrate dev --name init` sur une base vierge, puis
  `npx prisma migrate deploy` en CI/CD (voir `docs/DEPLOYMENT.md`).
- Sauvegardes : base PostgreSQL **et** répertoire `storage/ordonnances/` doivent
  être sauvegardés ensemble pour rester cohérents.
- Purge : les sessions expirées et jetons de réinitialisation peuvent être
  supprimés périodiquement (`DELETE FROM "Session" WHERE "expiresAt" < now()`).
  Aucune purge automatique n'est planifiée à ce jour.

---

## 6. Limites connues du modèle

- Pas de table d'avis/notes : aucune donnée fictive n'est publiée ; à ajouter
  avec modération si le propriétaire le souhaite.
- Pas de gestion multi-entrepôt : un seul `InventoryItem` par variante.
- Pas de facturation/numérotation légale : à prévoir avec la comptabilité.
- Pas de versionnage des ordonnances : une révision remplace la précédente.
- Pas de rétention automatisée des ordonnances (voir `docs/SECURITY.md`).
