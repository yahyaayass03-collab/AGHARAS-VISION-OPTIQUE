# Déployer agharasvision.com par import Git Hostinger

Ce guide concerne la version MariaDB actuelle et la méthode **Import Git Repository**.
Le dépôt contient le code et les migrations; les données locales, les fichiers privés
et les secrets ne sont pas transférés par Git.

## 1. Préparer les services

Dans hPanel, vérifier que l'abonnement Unlimited propose **Web App / Node.js App**.
Le projet exige Node **>=22.23.0 <23**; vérifier la version réelle dans les logs.

Créer une base MariaDB/MySQL vide et son utilisateur dans **Databases → Management**.
Noter leurs noms complets préfixés. Le guide Hostinger indique `127.0.0.1:3306`
pour la connexion depuis l'application gérée; une connexion depuis votre ordinateur
utilise le nom externe fourni par **Remote MySQL**.

Préparer également :

- une boîte e-mail et ses paramètres SMTP;
- un bucket S3 compatible privé pour les ordonnances, avec clés de lecture/écriture;
- un budget d'images publiques compatible avec le quota de la base MariaDB.

Les images publiques peuvent être stockées dans la base avec
`PUBLIC_MEDIA_STORAGE_DRIVER=mariadb`. `PUBLIC_MEDIA_MAX_TOTAL_BYTES` doit être
un nombre entier d'au moins `2097152` octets et inférieur au budget réellement
disponible dans la base. Les ordonnances continuent à utiliser S3.

## 2. Initialiser la base et le propriétaire

Cette opération se fait une fois avant l'ouverture du site. Le build normal
génère Prisma Client mais n'applique pas les migrations et ne crée pas de compte.

Sur votre ordinateur Windows, utiliser Node 22.23+ dans la version majeure 22.
Autoriser votre IP dans **Remote MySQL**, puis ouvrir PowerShell à la racine du dépôt.
Exécuter les commandes séparément et arrêter à la première erreur :

```powershell
npm ci --include=dev
$env:DATABASE_URL = Read-Host 'URL MySQL distante de la base Hostinger'
npm run db:generate
$env:MIGRATION_EXPECTED_DATABASE = 'NOM_COMPLET_DE_LA_BASE'
$env:MIGRATION_CONFIRM_TARGET = 'NOM_COMPLET_DE_LA_BASE'
$env:MIGRATION_TARGET_EMPTY_CONFIRMED = 'true'
npm run db:deploy
npx prisma migrate status
```

L'URL distante est de la forme :

```text
mysql://UTILISATEUR:MOT_DE_PASSE_ENCODE@HOTE_DISTANT:3306/NOM_BASE?connection_limit=5&connect_timeout=15&pool_timeout=10
```

Utiliser les options TLS demandées par Hostinger. Encoder les caractères spéciaux
du mot de passe dans l'URL. Le drapeau de base vide ne s'applique qu'à une base
intentionnellement vide. Pour une mise à jour, vérifier la sauvegarde et utiliser
`MIGRATION_BACKUP_VERIFIED=true` à la place.

Créer le propriétaire dans la même session :

```powershell
$env:OWNER_EMAIL = 'VOTRE_EMAIL_PROPRIETAIRE'
$password = Read-Host 'Mot de passe administrateur' -AsSecureString
$env:OWNER_PASSWORD = [System.Net.NetworkCredential]::new('', $password).Password
npm run owner:provision
Remove-Item Env:OWNER_PASSWORD
Remove-Variable password
```

Le mot de passe doit comporter au moins 8 caractères, une majuscule, une minuscule,
un chiffre et un symbole. Ne pas lancer le seed de démonstration en production.
Fermer cette session après les opérations et retirer l'autorisation IP distante
si elle n'est plus nécessaire.

Hostinger ne permet pas les commandes npm de l'app gérée via le SSH ordinaire.
Si Remote MySQL n'est pas disponible, faire confirmer une méthode d'exécution
ponctuelle par son support avant de poursuivre.

## 3. Importer le dépôt

1. Dans hPanel : **Websites → Add website / Create site → Web App / Node.js App**.
2. Choisir **Import Git Repository**.
3. Connecter GitHub et autoriser l'accès à
   `yahyaayass03-collab/AGHARAS-VISION-OPTIQUE`.
4. Sélectionner la branche **main**.
5. Choisir le domaine **agharasvision.com**, selon le processus d'association hPanel.
6. Vérifier les réglages :

| Champ | Valeur |
| --- | --- |
| Framework | Next.js, mode serveur SSR |
| Racine | `/`, dossier contenant `package.json` |
| Node | 22.x, patch >=22.23.0 |
| Gestionnaire | npm |
| Installation, si modifiable | `npm ci --include=dev` |
| Build | `npm run build` |
| Start | `npm run start` |
| Output, si demandé | `.next` |
| Entry file | Preset Next.js, aucun serveur personnalisé |

Prisma CLI, TypeScript et Tailwind sont des dépendances de build : elles doivent
être installées avant la construction. Le lockfile est versionné.

## 4. Configurer les variables hPanel avant le build

Utiliser `.env.example` comme référence et remplacer tous les placeholders.
Ne pas importer les variables de tests ou de provisioning dans le runtime.

| Variable | Valeur / provenance |
| --- | --- |
| `NODE_ENV` | `production` (gérée par la plateforme si applicable) |
| `APP_ENVIRONMENT` | `staging` pendant la préparation, puis `production` |
| `NEXT_PUBLIC_SITE_URL` | `https://agharasvision.com` |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Adresse publique réelle |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Numéro professionnel réel |
| `DATABASE_URL` | URL MySQL pour l'app hébergée, généralement hôte `127.0.0.1:3306` |
| `OWNER_EMAIL` | Adresse du propriétaire créé à l'étape 2 |
| `AUTH_SECRET` | Secret aléatoire unique |
| `CRON_SECRET` | Un second secret aléatoire unique |
| `PUBLIC_MEDIA_STORAGE_DRIVER` | `mariadb` |
| `PUBLIC_MEDIA_MAX_TOTAL_BYTES` | Budget entier en octets validé contre le quota DB |
| `OBJECT_STORAGE_DRIVER` | `s3` |
| `OBJECT_STORAGE_BUCKET` | Nom du bucket privé |
| `OBJECT_STORAGE_REGION` | Région S3, ou `auto` pour R2 |
| `OBJECT_STORAGE_ENDPOINT` | Endpoint HTTPS S3 compatible; omettre pour AWS S3 |
| `OBJECT_STORAGE_ACCESS_KEY_ID` | Identifiant S3 |
| `OBJECT_STORAGE_SECRET_ACCESS_KEY` | Clé secrète S3 |
| `EMAIL_TRANSPORT` | `smtp`; `discard` uniquement si staging sans envoi réel |
| `EMAIL_FROM` | Adresse e-mail seule, sans nom d'affichage |
| `SMTP_HOST` | Paramètre de la boîte, souvent `smtp.hostinger.com` |
| `SMTP_PORT` | `465` pour TLS, ou `587` pour STARTTLS |
| `SMTP_USER` | Adresse complète de la boîte |
| `SMTP_PASSWORD` | Mot de passe de la boîte |

Pour générer les deux secrets, exécuter cette commande deux fois et utiliser
les deux résultats distincts :

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Ne pas définir `OWNER_PASSWORD`, `SEED_*`, `TEST_DATABASE_URL`,
`MIGRATION_*`, `NEXT_DIST_DIR` ou un port fixe dans le runtime hPanel.
Les variables `NEXT_PUBLIC_*` nécessitent un nouveau build lorsqu'elles changent.

## 5. Déployer et vérifier

Lancer **Deploy** et vérifier les logs : installation, génération Prisma, build
Next.js et démarrage. Configurer le domaine et HTTPS en suivant les valeurs hPanel,
en conservant les enregistrements DNS e-mail.

Se connecter à `https://agharasvision.com/admin/connexion` avec le compte créé.
Configurer les catégories, marques, produits, stock, paramètres et contenu réel.
Une base vide nécessite aussi l'initialisation des modes de livraison : le formulaire
actuel modifie les modes existants. Le
[guide détaillé](HOSTINGER_AGHARASVISION_STEP_BY_STEP_EN.md#initialize-a-shipping-method-on-a-fresh-database)
contient un modèle SQL pour le premier mode.

La vente de verres correcteurs nécessite aussi un import du catalogue de verres
et des compatibilités optiques validées. Les migrations et `owner:provision`
ne créent pas ce catalogue; l'administration des verres modifie les options existantes.

Tester une commande, son e-mail, les images et une ordonnance. Activer le cron
décrit ci-dessous. Passer ensuite `APP_ENVIRONMENT=production` et redéployer.

## 6. Cron des e-mails

Dans **Advanced → Cron Jobs**, commencer par `*/5 * * * *`. Adapter les chemins
au compte, en conservant la commande sur une seule ligne (maximum 255 caractères) :

```sh
/opt/alt/alt-nodejs22/root/bin/node --env-file=/home/UTILISATEUR/domains/agharasvision.com/hbuilds/config/.env /home/UTILISATEUR/domains/agharasvision.com/hbuilds/current/nodejs/scripts/run-email-outbox-cron.mjs
```

Vérifier la sortie `cron.email_outbox.completed`. Le traitement est limité à deux
commandes par invocation; adapter la fréquence si le volume augmente.

## 7. Mises à jour depuis GitHub

Pousser les changements sur `main`, puis déclencher **Redeploy** dans hPanel,
ou utiliser le déploiement automatique si activé dans le compte.
Pour une évolution du schéma, sauvegarder la base et appliquer les migrations
compatibles avant de publier le code qui en dépend. Les images MariaDB et les
ordonnances S3 restent dans leurs services de stockage entre les déploiements.

## Références

- [Import Git et déploiement Node.js Hostinger](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/)
- [Base MySQL de l'application Node.js](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [Remote MySQL](https://www.hostinger.com/support/1583546-how-to-set-up-remote-mysql-access-in-hostinger/)
- [Cron Node.js](https://www.hostinger.com/support/how-to-run-cron-jobs-for-node-js-websites-at-hostinger/)
