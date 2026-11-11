# AGHARAS VISION OPTIQUE

Plateforme e-commerce d'optique haut de gamme pour le Maroc : vitrine, catalogue,
configurateur de verres correcteurs, ordonnances, panier, commande en ligne
(paiement à la livraison), espace client et back-office protégé par permissions.

L'interface (vitrine **et** administration) est intégralement en français.
Le code, les commentaires et la documentation technique sont en français
également ; ce README résume l'essentiel.

> Cette version utilise **MariaDB / MySQL avec Prisma**. Les résultats locaux
> figurent dans le [rapport de tests](docs/HOSTINGER_MARIADB_TEST_RESULTS.md).
> Le compte Hostinger et ses services doivent encore être configurés et vérifiés.

## Déployer depuis GitHub sur Hostinger

Suivre le **[guide d'import Git Hostinger](docs/HOSTINGER_GIT_DEPLOYMENT_FR.md)**.

| Réglage | Valeur |
| --- | --- |
| Dépôt | `https://github.com/yahyaayass03-collab/AGHARAS-VISION-OPTIQUE` |
| Branche | `main` |
| Framework | Next.js (SSR) |
| Racine | `/` (dossier contenant `package.json`) |
| Node | `22.x`, au minimum `22.23.0` |
| Installation, si personnalisable | `npm ci --include=dev` |
| Build | `npm run build` |
| Démarrage | `npm run start` |
| Sortie, si demandée | `.next` |

Configurer les variables de [`.env.example`](.env.example) dans hPanel avant le
build. Les médias publics peuvent être stockés dans MariaDB; les ordonnances
privées nécessitent le stockage S3 configuré. Les migrations et le compte
propriétaire sont initialisés séparément selon le guide.

---

## Sommaire

- [Stack](#stack)
- [Démarrage rapide](#démarrage-rapide)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Scripts](#scripts)
- [Cartographie des routes](#cartographie-des-routes)
- [Sécurité en un coup d'œil](#sécurité-en-un-coup-dœil)
- [Tests](#tests)
- [Documentation](#documentation)
- [Limites connues](#limites-connues)

---

## Stack

| Domaine | Choix | Version épinglée |
| --- | --- | --- |
| Framework | Next.js (App Router, Server Actions, RSC) | `15.5.28` |
| UI | React | `19.3.1` |
| Langage | TypeScript (`strict`, `noUncheckedIndexedAccess`) | `5.9.3` |
| Styles | Tailwind CSS (tokens CSS `@theme`, plugin `@tailwindcss/postcss`) | `4.3.5` |
| Base de données cible | MariaDB (`provider = "mysql"`) | 11.4.8 local; Hostinger non vérifié |
| ORM | Prisma | `6.19.3` |
| Validation | Zod | `4.6.7` |
| Mots de passe | bcryptjs | `3.0.3` |
| Tests unitaires/intégration | Vitest | `5.1.0` |
| Tests E2E | Playwright (Chromium) | `1.64.1` |

Aucune bibliothèque d'authentification tierce : sessions opaques en base,
cookie `httpOnly`, jeton haché en SHA-256 côté serveur.

## Démarrage rapide

Prérequis : **Node.js 22.23.x**, **npm**, une base MariaDB/MySQL configurée dans `DATABASE_URL`.

```bash
npm install
cp .env.example .env          # puis renseigner AUTH_SECRET
```

Générer un secret :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Pour le développement local, un serveur MariaDB est requis. L'option Docker Compose (si Docker est déjà installé) écoute sur le port 3308; sinon configurez une instance MariaDB dédiée. Ne pointez jamais le seed vers la production.

**Option A — Docker Compose (développement uniquement) :**

```bash
docker compose up -d
```

Le conteneur MariaDB 11.4 crée `agharas_dev` et écoute sur `127.0.0.1:3308`.

**Option B — MariaDB local déjà installé :**

```sql
CREATE DATABASE agharas_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'agharas'@'localhost' IDENTIFIED BY '<mot-de-passe-local>';
GRANT ALL PRIVILEGES ON agharas_dev.* TO 'agharas'@'localhost';
```

Puis :

```bash
npm run db:deploy    # migrations MySQL/MariaDB versionnées (garde explicite requise)
npm run db:seed      # données de démonstration synthétiques en base locale vide seulement
npm run dev          # http://localhost:3000
```

Pour un rendu proche de la production :

```bash
npm run build
npm run start -- --port 3000
```

### Variables d'environnement

Toutes les variables sont documentées dans [`.env.example`](.env.example).

| Variable | Rôle | Obligatoire |
| --- | --- | --- |
| `DATABASE_URL` | Connexion MariaDB/MySQL applicative | oui |
| `TEST_DATABASE_URL` | Base isolée pour les tests d'intégration | tests |
| `AUTH_SECRET` | Secret d'application (sessions, diversification) | oui |
| `NEXT_PUBLIC_SITE_URL` | URL publique canonique (SEO, liens e-mail) | oui |
| `PRESCRIPTION_STORAGE_DIR` | Répertoire privé des ordonnances, **hors `public/`** | oui |
| `SEED_ADMIN_*`, `SEED_STAFF_*`, `SEED_CUSTOMER_*` | Comptes créés par le seed uniquement | non |
| `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_CONTACT_EMAIL` | Coordonnées affichées (placeholders) | non |

> `AUTH_SECRET` et les identifiants du seed sont des **valeurs de
> développement**. Ne jamais réutiliser ces valeurs en production.

### Stockage des ordonnances

Les ordonnances sont écrites hors du dossier `public/` :

```
./storage/ordonnances/<timestamp>-<random>.<ext>
```

Le dossier est créé automatiquement, ignoré par Git, et servi uniquement par
une route privée (`/api/ordonnances/[id]`) qui vérifie le propriétaire ou la
permission `prescriptions.view`. Sauvegardez ce volume séparément de la base.

## Comptes de démonstration

Créés par `npm run db:seed` (à ne jamais conserver en production) :

| Rôle | E-mail | Mot de passe |
| --- | --- | --- |
| Super Administrateur | `admin@agharas.local` | `Agharas!2026` |
| Opticien | `opticien@agharas.local` | `Agharas!2026` |
| Client | `client@agharas.local` | `Client!2026` |

Le seed inclut 12 produits, 6 catégories, 5 marques, le catalogue de verres,
3 modes de livraison, le coupon `CERCLE10`, une commande livrée
`AVO-2026-0001`, les pages de contenu, la FAQ et 2 salons de démonstration.

## Scripts

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | `prisma generate` + build Next.js de production |
| `npm run start` | Serveur de production (après `build`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (unitaire + intégration) |
| `npm run test:e2e` | Playwright : build + `next start` sur le port 3100 |
| `npm run db:generate` | Régénère le client Prisma |
| `npm run db:deploy` | Exécute la garde puis applique uniquement les migrations relues via `migrate deploy` |
| `npm run db:migrate` | Prisma `migrate dev` pour le développement (jamais en production) |
| `npm run db:seed` | Seed synthétique non destructif en base vide; refus en production |

## Cartographie des routes

### Vitrine

| Route | Contenu |
| --- | --- |
| `/` | Accueil éditorial, sélections, nouveautés, services |
| `/catalogue` | Catalogue filtrable (type, genre, forme, prix, tri, recherche) |
| `/catalogue/[slug]` | Catégorie |
| `/produit/[slug]` | Fiche produit, variantes, galerie, JSON-LD |
| `/configurateur/[slug]` | Configurateur de verres en 4 étapes |
| `/panier` | Panier (invité ou connecté) |
| `/commande` | Commande, livraison, paiement à la livraison |
| `/commande/confirmation/[reference]` | Confirmation (propriétaire ou jeton d'accès) |
| `/favoris` | Liste de souhaits |
| `/contact`, `/faq`, `/boutiques` | Contact, questions fréquentes, salons |
| `/livraison`, `/retours`, `/confidentialite`, `/cgv`, `/mentions-legales`, `/a-propos` | Pages de contenu rendues depuis la base |

### Compte client

`/connexion`, `/inscription`, `/mot-de-passe-oublie`,
`/reinitialiser-mot-de-passe/[token]`, `/compte`, `/compte/commandes`,
`/compte/commandes/[reference]`, `/compte/adresses`, `/compte/ordonnances`,
`/compte/profil`.

### Administration (`/admin`, permissions requises)

Tableau de bord, produits (liste, création, édition), stock, commandes (liste,
détail, transitions), ordonnances, clients, promotions, contenu, messages,
paramètres, utilisateurs, rôles, journal d'audit.

## Sécurité en un coup d'œil

- Sessions opaques : jeton aléatoire 256 bits, **haché SHA-256 en base**, cookie
  `httpOnly` + `SameSite=Lax` + `Secure` en production, expiration 30 jours.
- Mots de passe hachés avec bcrypt (coût 12) ; politique de longueur minimale.
- Autorisation **refus par défaut** : permissions `module.action` avec wildcards
  (`products.*`) et super-administrateur ; vérification côté serveur sur chaque
  action et chaque page (`requirePermission`).
- Autorisation objet sur les ordonnances, commandes et adresses (le client ne
  voit que ses propres ressources).
- Ordonnances : stockage privé, validation par signature binaire (PDF/JPEG/PNG/
  HEIC), 10 Mo max, `Content-Disposition: attachment`, `nosniff`, `no-store`,
  téléchargements staff audités.
- Paiement en ligne (CMI) **désactivé côté serveur** ; seul le paiement à la
  livraison peut être sélectionné.
- En-têtes `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy` ; `poweredByHeader` désactivé.
- Limitation de débit en mémoire sur connexion (6 essais / 5 min par e-mail),
  inscription, contact, newsletter, commande et réinitialisation.

Détails et limites : [`docs/SECURITY.md`](docs/SECURITY.md).

## Tests

```bash
npm run typecheck
npm test          # Vitest unitaire + MariaDB d'intégration
npm run test:e2e  # Playwright Chromium, serveur de production local
npm run test:audit # acceptance sur base MariaDB synthétique isolée
```

Les tests d'intégration utilisent une base MariaDB **séparée**. Voir
[`docs/TESTING.md`](docs/TESTING.md) pour la préparation de la base de test, les
scénarios couverts et les limites (pas de comparaison pixel, pas d'envoi
d'e-mail réel).

## Documentation

| Document | Contenu |
| --- | --- |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Couches, flux (panier, commande, ordonnances), RBAC, choix techniques |
| [`docs/DATABASE_DESIGN.md`](docs/DATABASE_DESIGN.md) | Modèle de données, invariants, snapshots de commande |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Menaces, contrôles, limites et durcissement restant |
| [`docs/TESTING.md`](docs/TESTING.md) | Stratégie, commandes, couverture, CI |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Environnements, migrations, volumes, checklist go-live |
| [`docs/IMPLEMENTATION_PROGRESS.md`](docs/IMPLEMENTATION_PROGRESS.md) | Avancement par jalon, preuves, blocages |
| [`docs/HOSTINGER_MARIADB_CONVERSION.md`](docs/HOSTINGER_MARIADB_CONVERSION.md) | Implémentation et limites de la conversion MariaDB |
| [`docs/HOSTINGER_MARIADB_TEST_RESULTS.md`](docs/HOSTINGER_MARIADB_TEST_RESULTS.md) | Résultats exacts des vérifications MariaDB |
| [`docs/HOSTINGER_MARIADB_DEPLOYMENT_FR.md`](docs/HOSTINGER_MARIADB_DEPLOYMENT_FR.md) | Procédure hPanel en français, sans déploiement effectué |
| [`docs/STITCH_DESIGN_INVENTORY.md`](docs/STITCH_DESIGN_INVENTORY.md) | Correspondance écrans Stitch → routes, actifs, écarts |

## Limites connues

1. **Logo officiel absent.** Aucun fichier logo n'était fourni ; le
   logotype typographique Stitch (« AGHARAS VISION OPTIQUE » + « Haute
   Lunetterie ») est utilisé tel quel. Aucun logo n'a été inventé.
2. **E-mails non configurés.** Aucun transport SMTP/fournisseur n'est branché :
   la réinitialisation de mot de passe affiche le lien uniquement en
   développement. La livraison réelle des e-mails reste à intégrer.
3. **Paiement en ligne indisponible.** CMI n'est pas intégré et reste marqué
   indisponible ; seul le paiement à la livraison est actif.
4. **Contenus légaux et coordonnées fictifs.** ICE/RC/IF, téléphones, adresses,
   e-mails et horaires sont des placeholders explicitement signalés ; ils
   doivent être remplacés par le propriétaire.
5. **Images Stitch incomplètes.** 13 visuels de l'export d'origine ne sont plus
   téléchargeables (l'URL renvoie une page HTML) ; ils ont été retirés et
   consignés dans le manifeste. Aucun visuel de substitution n'a été inventé :
   les pages concernées utilisent des visuels Stitch valides du même export.
6. **Pas de politique de rétention automatisée** des ordonnances (suppression
   manuelle par le client / le staff). À cadrer avec le CNDP avant mise en
   production.
7. **Limitation de débit en mémoire** : suffisante pour une instance unique,
   à remplacer par Redis (ou équivalent) en multi-instances.
8. **Pas de CSP stricte** ni de MFA pour les comptes staff à ce stade.
9. **Comparaison pixel impossible avec les exports** : les captures PNG n'ont
   pas pu être analysées visuellement pendant le développement ; la fidélité a
   été reconstruite depuis le HTML (`code.html`) de chaque écran.

Aucune donnée réelle n'est inventée : avis clients, notes, chiffres légaux et
coordonnées sont soit absents, soit des placeholders identifiés.
