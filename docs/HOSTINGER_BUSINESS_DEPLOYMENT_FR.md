# Déployer AGHARAS VISION sur Hostinger Business (guide préparatoire)

> **Aucune mise en ligne n'a été effectuée.** Ce guide décrit le déploiement futur de l'application Next.js gérée par hPanel, pas une validation de votre compte, domaine, base Neon ou stockage.

## 1. Prérequis et limites du plan

Hostinger documente les **Web Apps Node.js** sur Business Web Hosting et les plans Cloud. Le preset **Next.js** démarre l'application en mode serveur (SSR), pas en export statique. Les versions documentées sont Node 18, 20, 22 et 24. Ce projet cible Node **22.x**, au moins 22.23, car les dépendances actuelles l'exigent; le réglage hPanel est `22` et `package.json`/`.nvmrc` vérifient la version minimale.

Hostinger publie actuellement, pour le groupe Business/Unlimited, jusqu'à 5 sites Node.js, une limite de processus NPROC de 120 et 60 processus d'entrée; les requêtes sont limitées à 120 secondes. Les ressources CPU/RAM/disque dépendent de la version et du compte. L'app ne demande ni workers permanents, WebSockets entrants, Docker, VPS, PM2, ports HTTP personnalisés, Redis, PHP ni MySQL. **Avant de choisir les ressources, consultez hPanel → Hébergement → Détails** : le nom de l'offre, les quotas et les fonctions peuvent différer pour un ancien plan Business/Unlimited ou selon la région.

## 2. Créer l'application dans hPanel

1. Dans **Sites Web → Ajouter un site → Application Web Node.js**, choisissez le domaine fourni par le propriétaire. Ne créez/modifiez pas le DNS avant l'autorisation de lancement.
2. Choisissez **GitHub** (dépôt privé, branche explicitement convenue) ou **Téléverser vos fichiers** et fournissez `dist/hostinger-business-package-20261109.zip` après vérification locale. Le ZIP a `package.json` à sa racine, pas un dossier parent englobant.
3. Vérifiez les paramètres détectés avant de construire :

   | Réglage hPanel | Valeur du projet |
   | --- | --- |
   | Type / framework | Web App Node.js / **Next.js** (`next`, SSR) |
   | Racine du projet | `/` (racine qui contient `package.json`) |
   | Node.js | **22** |
   | Gestionnaire | npm (`package-lock.json`) |
   | Commande de build | `npm run build` |
   | Sortie | `.next` si le formulaire l'exige; conserver le mode serveur Next.js |
   | Fichier d'entrée | **Vide / non applicable** : Hostinger indique que ce champ est ignoré pour Next.js |
   | Démarrage | Preset Next.js géré par Hostinger; le projet expose aussi `npm run start` → `next start` |

   Ne configurez pas `server.js`, un port fixe ou un export statique. Hostinger documente une limite de 15 minutes pour l'installation et pour la commande de build; consultez les journaux dans **Déploiements**. La doc indique que les variables hPanel sont disponibles pendant le build et au runtime.

## 3. Préparer Neon PostgreSQL

Neon n'a pas été créé. Après autorisation du propriétaire, créer un projet/base et un rôle à privilèges minimaux dans une région proche de l'hébergement, puis conserver les deux chaînes dans le coffre de secrets/hPanel — jamais dans Git, tickets, URL ou bundle navigateur.

- `DATABASE_URL` : chaîne **pooled** Neon dont l'hôte comprend `-pooler`, TLS `sslmode=require`, paramètres Prisma recommandés dans `.env.example` (`pgbouncer=true`, `connection_limit=5`, `connect_timeout=15`, `pool_timeout=10`). Elle sert au runtime Next/Prisma; le client Prisma global est réutilisé.
- `DIRECT_URL` : chaîne **directe non poolée** (sans `-pooler`), TLS, même base et même schéma. Réservée aux migrations et opérations d'administration contrôlées. Le schéma Prisma 6 utilise `directUrl`; ne pas recopier les exemples de configuration Prisma 7.
- Le code utilise Prisma **6.19.3** et son moteur natif Linux, sans adapter Neon. Les transactions interactives et verrous transactionnels existants sont conservés; la chaîne pooled doit rester compatible PgBouncer/transaction pooling.
- Neon peut réveiller un compute suspendu; la première connexion peut être plus lente. Les limites de connexion et délais sont configurés, mais aucune connexion, reprise après veille ni transaction n'a été testée sur Neon réel. N'ajoutez pas de retry applicatif aveugle à une commande : contrôlez d'abord son idempotency key et son résultat.

Avant toute migration : choisir le bon projet/base, vérifier l'identité et le schéma avec les chaînes de connexion, prendre et vérifier une sauvegarde restaurable, puis inspecter le statut Prisma. Depuis un environnement d'administration autorisé avec `DIRECT_URL`, définir temporairement :

```text
MIGRATION_EXPECTED_DATABASE=<nom exact de la base>
MIGRATION_EXPECTED_SCHEMA=public
MIGRATION_CONFIRM_TARGET=<nom exact de la base>.public
MIGRATION_BACKUP_VERIFIED=true
```

Puis exécuter `npm run db:deploy` une seule fois. Le garde-fou compare confirmation, identité réellement connectée, base/schéma des URL pooled/direct et TLS, affiche le statut, puis applique les migrations versionnées. Il refuse une cible inconnue ou une sauvegarde non confirmée. Lancer l'application **après** vérification du statut, du schéma et d'un smoke test. Le build et le démarrage ne lancent ni migrations ni seed. Ne jamais utiliser `db:push`, `migrate reset` ou les seeds contre la base business.

## 4. Médias publics et ordonnances privées

Les photos statiques approuvées restent versionnées sous `public/`; le ZIP les inclut. Les nouvelles images de catalogue/CMS téléversées par le propriétaire peuvent utiliser la nouvelle table BLOB MariaDB (`PUBLIC_MEDIA_STORAGE_DRIVER=mariadb`) avec quota cumulatif configuré d'après hPanel. Les trois migrations image/quota/suppression sont additives. Les fichiers clients/ordonnances restent hors de cette table publique : leur adaptateur existant est S3 compatible. Aucun bucket ni secret n'a été créé; si le flux de prescription reste actif, il faut un stockage privé durable vérifié ou un service S3 compatible réellement provisionné.

Variables images : `PUBLIC_MEDIA_STORAGE_DRIVER=mariadb` et `PUBLIC_MEDIA_MAX_TOTAL_BYTES` (octets, plafond choisi sous le quota réellement alloué). Variables d'objet privé actuellement attendues par le runtime production si les ordonnances restent activées : `OBJECT_STORAGE_DRIVER=s3`, `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_REGION`, éventuellement `OBJECT_STORAGE_ENDPOINT` HTTPS, et une paire de clés ou une identité fournisseur. Le bucket doit rester privé. `/api/media` ne sert que des médias publics; les ordonnances ont une route distincte propriétaire-only avec `no-store`. Les images sont validées et réencodées WebP (entrée 5 MiB, 40 MP, sortie 2 MiB, côté 2 400 px). Les sauvegardes MariaDB incluent les BLOB et doivent être testées. **Ne comptez pas sur le filesystem hPanel comme persistant** : aucune persistance Hostinger n'est confirmée. Voir `HOSTINGER_MARIADB_IMAGE_STORAGE.md` pour le test réel staging/redéploiement.

## 5. Authentification, e-mail et variables

Importer les valeurs utiles de `.env.example` dans **Variables d'environnement** hPanel, sans y téléverser le fichier complet de développement. Renseigner l'origine HTTPS seulement quand le propriétaire fournit le domaine réel. Les variables `NEXT_PUBLIC_*` sont incluses dans le build navigateur : seules URL publique, WhatsApp et adresse de contact non secrètes y sont admises. Tous les secrets, bases, SMTP, stockage et cron restent serveur.

Configurer une seule fois `AUTH_SECRET` aléatoire (au moins 32 octets) et `OWNER_EMAIL`. Créer/provisionner l'utilisateur propriétaire via la procédure contrôlée `npm run owner:provision` après migration, avec `OWNER_PASSWORD` à usage ponctuel; retirer cette variable immédiatement. Ne pas laisser des identifiants `SEED_*` ou `OWNER_PASSWORD` dans hPanel/runtime. Le cookie d'authentification est HttpOnly, SameSite=Lax et Secure sous production. Les rôles non propriétaires ne peuvent pas administrer.

Les courriels restent **discard** en tests et staging. En production, le runtime refuse discard : ne passer à `EMAIL_TRANSPORT=smtp` qu'après approbation du propriétaire et configuration de `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, ainsi que `SMTP_USER`/`SMTP_PASSWORD` si requis; tester sur un destinataire autorisé, SPF/DKIM/DMARC et la livraison avant d'activer la confirmation client. Aucun SMTP ni envoi réel n'a été testé.

## 6. Cron transactionnel borné

Hostinger documente les cron Node.js en UTC, les arrête après 30 minutes et ne leur transmet pas automatiquement les variables Web App. La commande est limitée à 255 caractères et `%` est interdit. Le traitement AGHARAS n'est pas un worker permanent : le script `scripts/run-email-outbox-cron.mjs` fait un POST HTTPS à `/api/internal/cron/email-outbox` avec `Authorization: Bearer …`; le secret n'est jamais dans la query string. La route traite au plus **2 commandes** par invocation, est sans cache, et les lignes `SENDING` anciennes (>15 min) sont parquées en `FAILED/AMBIGUOUS_SENDING` pour revue propriétaire, sans renvoi automatique. Les erreurs retournées/loguées n'incluent pas les adresses, corps d'e-mail ou secrets.

Après déploiement, dans **Application → Avancé → Cron Jobs**, commencer par une fréquence prudente (p. ex. toutes les 5 minutes après validation métier) et vérifier le coût/quotas du plan. La doc Hostinger donne ce modèle de commande Node 22; remplacer les deux chemins avec les valeurs exactes affichées dans hPanel et vérifier que la ligne complète reste ≤255 caractères :

```sh
/opt/alt/alt-nodejs22/root/bin/node --env-file=/home/<UTILISATEUR>/domains/<DOMAINE>/hbuilds/config/.env /home/<UTILISATEUR>/domains/<DOMAINE>/hbuilds/current/nodejs/scripts/run-email-outbox-cron.mjs
```

`--env-file` est pris en charge par Node ≥20.6. Le chemin de configuration et le layout `hbuilds/current/nodejs` sont ceux documentés pour les déploiements récents; redéployer d'abord une application ancienne et confirmer les chemins réels dans le tableau de bord. Effectuer un test manuel avec `EMAIL_TRANSPORT=discard`; activer SMTP seulement après autorisation. Contrôler le code de sortie et l'onglet de sortie cron. Une invocation HTTP n'a pas été testée sur Hostinger.

## 7. Domaine, HTTPS, indexation et smoke tests

Le domaine de production n'est pas fourni. Après validation propriétaire : associer le domaine dans hPanel, configurer DNS uniquement avec son autorisation, attendre le certificat HTTPS et définir `NEXT_PUBLIC_SITE_URL=https://<origine-officielle>` avant le build. L'environnement `staging` ajoute la protection `noindex`; `production` permet l'indexation. Vérifier logo officiel, nom **AGHARAS VISION**, adresse approuvée `N° 13 Imm 08 , Lot 4 Al kheir,Cité Essalam,AGADIR`, pages françaises, sitemap/robots, canonical/OG et données structurées.

Après chaque lancement autorisé : tester accueil, recherche/catalogue, fiche produit, panier invité, commande COD synthétique autorisée, pages de confirmation, connexion propriétaire et chaque API admin; vérifier refus anonyme d'une ordonnance, logs sans données clients, headers/cookies, cache privé, réglages CMS, prix recalculés côté serveur et stock. Vérifier les quatre largeurs 390/768/1024/1440, les journaux build/runtime, les ressources CPU/RAM/I/O et les performances par région. Ne pas ouvrir le commerce de verres correcteurs sans approbation optique professionnelle exacte; Progressive reste exclu; PENDING/INCOMPATIBLE bloquent; aucun ADD/EP client; COD uniquement.

## 8. Sauvegardes, récupération et erreurs courantes

- **Base** : confirmer la rétention/PITR incluse dans l'offre Neon choisie; effectuer une sauvegarde avant toute migration et tester une restauration dans un projet/schema isolé. Définir propriétaire, RPO/RTO et preuve de restauration.
- **Objets** : activer versionnement/rétention et une copie indépendante; vérifier la récupération d'un média et d'une ordonnance avec contrôle owner-only.
- **Rollback application** : redéployer le commit/ZIP antérieur si le schéma reste compatible. Les migrations sont forward-only : ne pas rétablir un ancien code incompatible avec un schéma plus récent; préparer une migration corrective en avant. Une restauration DB peut perdre des commandes récentes : décision/autorisation propriétaire obligatoire.
- **Build Next/Prisma échoue** : sélectionner Node 22, installer avec lock npm, fournir les variables de build nécessaires, vérifier la génération Prisma et les logs. Pas de migration ou seed automatique.
- **`PrismaClientInitializationError`** : vérifier `DATABASE_URL` pooled TLS, endpoint Neon réveillé, mot de passe encodé, `connection_limit` et `DIRECT_URL` de migration distincte.
- **503 / limite de processus / réponse lente** : examiner les métriques Business et processus voisins; aucune capacité CPU/RAM n'est présumée. Réduire d'abord la concurrence/charge et vérifier limites account-specific.
- **Ordonnances/media non persistants** : vérifier bucket privé, policy/credentials et endpoint; ne pas basculer en filesystem sur le dossier de déploiement.
- **Cron absent ou silencieux** : vérifier UTC, chemin hbuilds courant, Node 22, `--env-file`, longueur 255, sortie cron, secret `CRON_SECRET`, origine HTTPS et statut de l'outbox. Ne jamais placer le secret dans l'URL.
- **hPanel demande un entry file** : pour le preset Next.js, la documentation Hostinger dit que le champ est ignoré; ne pas inventer un serveur custom.

### Documentation officielle consultée (état au 9 novembre 2026)

- [Créer une application Node.js / déploiement Git ou archive](https://docs.hostinger.com/node.js/creating-an-app.md)
- [Paramètres de build, version Node, sortie et entry file](https://docs.hostinger.com/node.js/build-settings.md)
- [Variables d'environnement hPanel](https://docs.hostinger.com/node.js/environment-variables.md)
- [Layout des fichiers de déploiement](https://docs.hostinger.com/node.js/file-structure.md)
- [Limites Node.js des plans Web/Cloud](https://www.hostinger.com/support/hostinger-node-js-limits-for-web-and-cloud-plans/)
- [Paramètres et limites de l'offre (valeurs du compte dans hPanel)](https://www.hostinger.com/support/6976044-parameters-and-limits-of-hosting-plans-in-hostinger/)
- [Cron Jobs Node.js, chemins, UTC, 255 caractères, 30 min](https://www.hostinger.com/support/how-to-run-cron-jobs-for-node-js-websites-at-hostinger/)
- [Neon + Prisma](https://neon.com/docs/guides/prisma)
- [Prisma ORM 6 / Neon](https://www.prisma.io/docs/orm/v6/overview/databases/neon)
- [Prisma ORM 6 / PgBouncer](https://www.prisma.io/docs/orm/v6/prisma-client/setup-and-configuration/databases-connections/pgbouncer)
