# Déploiement Hostinger Business + MariaDB — Guide français

**Aucune mise en production n'a été effectuée.** Le statut local est `MARIADB LOCAL ACCEPTANCE COMPLETE` : acceptance **44/44**, E2E **38/38**, Vitest **143/143**, Prisma, TypeScript, build Node 22.23.0, courses de concurrence et audits (0 vulnérabilité) réussis. Un nouveau paquet candidat est créé et inspecté, mais **n'a pas été déployé**. Hostinger n'a pas été contacté; sa version MariaDB, ses accès, privilèges, limites et runtime restent à vérifier. Détails dans `HOSTINGER_MARIADB_TEST_RESULTS.md`.

## 1. Vérifications hPanel indispensables

Dans hPanel, relever sans deviner :

- version exacte de MariaDB, nom d'hôte et port communiqués pour l'application;
- nom de base et nom d'utilisateur complets, y compris les préfixes de compte;
- méthode de création du mot de passe et droits accordés;
- charset/collation (`utf8mb4` / collation compatible), limites de connexions et d'exécution;
- accès depuis le processus Node hébergé et privilèges nécessaires aux migrations Prisma;
- méthode officielle Hostinger pour définir les variables d'environnement et lancer une application Next.js SSR Node 22.23.x.

Ne pas confondre la valeur d'exemple ci-dessous avec un endpoint vérifié. Ne jamais partager ni committer le mot de passe.

```dotenv
DATABASE_URL=mysql://USER:PASSWORD@127.0.0.1:3306/DB_NAME?connection_limit=5&connect_timeout=15&pool_timeout=10
```

Remplacer l'hôte, le port, l'utilisateur et le nom par les valeurs hPanel. Encoder les caractères spéciaux du mot de passe pour URL. Utiliser un utilisateur limité à la base de l'application; ne pas utiliser `root`.

## 2. Préparer l'application

1. Ne pas déployer le présent workspace tant que les contrôles « Bloquants » du rapport de conversion ne sont pas levés, que toutes les régressions requises ne passent pas sous Node 22.23.x et que la conversion n'a pas été adoptée dans le dépôt source. Ne pas utiliser l'ancien ZIP comme paquet des sources modifiées.
2. Conserver une copie récupérable du code et de l'historique PostgreSQL archivé. Aucune donnée PostgreSQL historique n'est requise pour le nouveau départ.
3. Créer une base MariaDB vide dans hPanel, puis renseigner les secrets dans l'interface Hostinger, jamais dans un fichier `.env` livré.
4. Configurer `NODE_ENV=production`, `APP_ENVIRONMENT=production`, `DATABASE_URL`, `AUTH_SECRET`, `OWNER_EMAIL`, les URL publiques et les fournisseurs/chemins de stockage et d'e-mail approuvés. Ne pas définir les secrets de seed ou `OWNER_PASSWORD` dans le runtime.
5. Construire le paquet Hostinger uniquement après validation complète; vérifier son manifeste et son SHA-256 avant transfert.

### Images propriétaire et CMS

Pour les images téléversées par le propriétaire, la solution locale ajoutée utilise les BLOB MariaDB : `PUBLIC_MEDIA_STORAGE_DRIVER=mariadb` et `PUBLIC_MEDIA_MAX_TOTAL_BYTES` configuré d'après le quota hPanel réellement confirmé. Deux migrations additives créent la table dédiée et son compteur; elles ne remplacent pas une sauvegarde ni la vérification de cible. Les images ne sont pas exposées comme fichiers dans `public_html`; la route applicative ne sert que les identifiants d'images publiques.

Le volume filesystem Hostinger n'a pas été vérifié. Ne pas compter sur un chemin de File Manager, `hbuilds` ou `public_html` pour la persistance. Voir [`HOSTINGER_MARIADB_IMAGE_STORAGE.md`](HOSTINGER_MARIADB_IMAGE_STORAGE.md) pour les variables runtime complètes, quotas/impact sauvegarde et le test obligatoire de redémarrage puis de vrai redéploiement sur staging. Ce test Hostinger reste à effectuer.

## 3. Initialiser la base vide

La procédure utilise exclusivement la migration versionnée :

```powershell
npm run db:generate
$env:MIGRATION_EXPECTED_DATABASE = "<nom exact hPanel>"
$env:MIGRATION_CONFIRM_TARGET = "<nom exact hPanel>"
$env:MIGRATION_TARGET_EMPTY_CONFIRMED = "true"
npm run db:deploy
```

La garde vérifie l'identité de la base réellement connectée avant d'exécuter `prisma migrate deploy`. Ne jamais utiliser `prisma migrate dev`, `prisma migrate reset`, `db push` ou le seed sur la production. Si les droits hPanel empêchent Prisma de créer sa table d'historique ou d'appliquer une migration, arrêter. Obtenir du support Hostinger les privilèges requis ou demander une procédure manuelle qui exécute exactement les SQL revus **et** maintient un état de migration Prisma vérifiable; ne pas marquer arbitrairement une migration comme appliquée.

Provisionner le compte propriétaire hors bande avec le flux approuvé et un secret unique. Ne pas exécuter le seed de démonstration en production.

## 4. Validation avant ouverture

- Vérifier `prisma migrate status` et la présence des tables, clés étrangères, contraintes, index, moteur InnoDB et charset attendus.
- Tester la connexion et les pages de lecture avec un jeu d'essai non commercial distinct avant toute ouverture.
- Confirmer l'accès propriétaire, les rôles, le stockage privé des ordonnances, le transport d'e-mail et les tâches cron dans l'environnement hPanel.
- Laisser le paiement à la livraison (COD); aucun paiement en ligne n'est activé par cette migration.
- Ne pas autoriser de vente de combinaison optique sans décision professionnelle exacte; aucun seed ne doit ajouter d'approbation fictive.

## 5. Retour arrière

Les migrations Prisma ne sont pas automatiquement réversibles. En cas d'incident :

1. arrêter le trafic applicatif ou activer la page de maintenance;
2. ne pas supprimer/recréer la base et ne pas appliquer de reset;
3. préserver les journaux, l'état `_prisma_migrations` et une sauvegarde hPanel vérifiée;
4. revenir à la version applicative précédente seulement si elle est compatible avec le schéma déjà migré;
5. si le schéma est incompatible, restaurer la sauvegarde de cette base selon la procédure Hostinger vérifiée, puis contrôler les comptes, commandes, inventaire et fichiers privés;
6. ne jamais tenter de « rollback » en exécutant les anciennes migrations PostgreSQL sur MariaDB.

La base PostgreSQL d'origine n'est pas une cible de rollback de ce guide et ne doit pas être modifiée par la procédure MariaDB.

## Historique de la récupération locale antérieure — 10 novembre 2026

La poursuite de la récupération a confirmé C: à **0,16 Go libres** et D: à **20,56 Go libres** au départ. Les processus de test ont utilisé `TEMP`/`TMP=D:\AGHARAS-TEMP`; les deux instances MariaDB isolées examinées déclaraient ce même `tmpdir`. Un navigateur Playwright a été installé séparément sur D: sans déplacer ni supprimer le cache Chromium existant sur C:.

Une instance MariaDB 11.4.8 entièrement isolée a été préparée sur `127.0.0.1:3311`, avec datadir `D:\AGHARAS-MARIADB-RECOVERY\data\db`; ses migrations et son seed synthétique ont réussi. Cela ne valide pas Hostinger. Le contrôle Prisma, le typecheck Node 22.23.0 et l'audit npm (0 vulnérabilité) ont réussi. Un build isolé s'est terminé avec avertissements d'accès DB parce que la DB était arrêtée pendant la collecte des pages.

À ce point de l'historique, le commit Windows était insuffisant et le résultat complet restait 33/3/8. L'owner a ensuite augmenté les ressources; l'addendum final ci-dessous remplace cet état local. Cette historique ne constitue pas une validation Hostinger.

## Résultat final de récupération locale — 10 novembre 2026

- Prévol avant tests : C: **0,25 Go libres**, D: **19,50 Go libres**, **5,70 Go de RAM disponible**, **1,96 Go de commit disponible**, pagefile déclaré **2 902 Mo**; Node **22.23.0**. Le redémarrage Windows en cours de session a porté le commit disponible à 10,16 Go. Après les tests : C: **1,57 Go libres**, D: **19,47 Go libres**, RAM disponible **8,86 Go**, commit disponible **6,11 Go**; pagefile alors déclaré **1 573 Mo**.
- Environnement isolé : `TEMP`/`TMP=D:\AGHARAS-TEMP` (processus uniquement), cache npm sur D:, Playwright Chromium/headless-shell revision 1248 sur D:. MariaDB 11.4.8 sur `127.0.0.1:3311`, datadir `D:\AGHARAS-MARIADB-RECOVERY\data\db`, `tmpdir=D:/AGHARAS-TEMP`. La base est restée disponible pendant le build et les suites. Aucun errno 28 / MariaDB 1021 n'a été observé dans cette campagne.
- Résultats Node 22.23.0 : Prisma validation **PASS**; TypeScript **PASS**; Vitest **143/143**; E2E **38/38**; acceptance MariaDB **44/44**; tests checkout et revue optique **PASS**; `npm run build` complet avec DB en ligne **PASS**; audits complet et production **0 vulnérabilité**.
- Nouveau candidat (non déployé) : `D:\PROJETs\e-agharass-vision-mariadb\dist\hostinger-mariadb-business-20261110-final-recovery.zip`, **214 entrées**, **2 564 768 octets**, SHA-256 **`C96DD002D3C2DC192874DC171B947B36A8FF94B592494019C353AECB2515A3F2`**. Le manifeste correspond; aucun secret `.env`, stockage privé, trace, base de données ou seed synthétique n'est inclus. `.env.example` contient seulement des placeholders. L'ancien ZIP est conservé.

**Verdict final local : `MARIADB LOCAL ACCEPTANCE COMPLETE`.** Cela ne confirme ni la connexion MariaDB Hostinger, ni ses droits, ni la compatibilité runtime. Ne pas déployer avant validation hPanel de l'hôte/version, utilisateur/base préfixés, grants/migrations, limites de connexion, runtime Node et stockage durable/privé.
