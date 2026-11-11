# Préparation technique du staging — AGHARAS VISION OPTIQUE

**Vérification : 5 novembre 2026**  
**Périmètre :** préparation technique locale uniquement. Aucun déploiement, aucune connexion à un hébergeur, aucun vrai e-mail, aucune activation de paiement en ligne. Les tests et fixtures nouveaux ont été isolés dans `agharas_test`.

## Verdict

# NOT READY — BLOCKERS REMAIN

Plusieurs blocages locaux ont été résolus et vérifiés : sauvegarde/restauration PostgreSQL, rehearsal de migration, application prudente de la migration optique sur le seul schéma de développement après réussite du rehearsal, stockage séparé fichiers publics/privés avec adaptateur S3, garde de configuration HTTPS/DB/identité et transport e-mail SMTP configurable avec sink sans envoi.

Le staging distant n'est pas prêt : aucun domaine, certificat, base, stockage objet, expéditeur SMTP, secrets d'hébergement, sauvegardes planifiées, monitoring ou rétention n'a été provisionné. L'audit npm a depuis été ramené à zéro vulnérabilité (voir le rapport de remédiation). Surtout, aucune décision professionnelle optique n'existe : les produits `lensCompatible` du catalogue local ne sont désormais pas achetables avec correction jusqu'à revue opticien et saisie de décisions exactes. Le header noindex ajouté en phase hosted ne remplace pas un contrôle d'accès réseau/host. Ce rapport ne constitue pas une autorisation d'ouverture commerciale.

## 1. Dépôt, configuration et checkpoint

- Avant intervention, `git status --short` montrait de nombreuses modifications et suppressions préexistantes, ainsi que des fichiers source/configuration non suivis. Aucun reset, checkout, commit, push ou suppression de code préexistant n'a été réalisé.
- Branche `master`, HEAD observé `23d7214` (`chore: baseline before owner-only admin and CMS changes`). Les changements courants restent non commités.
- Un checkpoint récupérable a été créé hors dépôt dans `C:\Users\admin\AppData\Local\Temp\opencode\agharas-techstaging-checkpoint-20261104` : `tracked-working-tree.patch` pour le diff suivi et copie des fichiers non suivis source/config/docs (artefacts, caches et stockage exclus). Ce checkpoint précède les changements de cette phase ; le diff de travail courant demeure l'état de référence pour les changements de phase.
- `vite.config.ts` et `cloudflare.config.ts` ne sont pas des artefacts : ils sont reliés aux scripts `dev:vinext`, `build:vinext`, `deploy:vinext` et aux dépendances Vinext/Cloudflare. L'intégration alternative est distincte du runtime Next.js retenu dans `docs/DEPLOYMENT.md`; aucune suppression ni publication n'a été faite. `.wrangler/deploy/config.json` est un fichier généré localement; il est maintenant ignoré.
- `.gitignore` protège désormais `.env.*` (avec exception explicite `.env.example`), `storage/`, `/backups/`, `*.dump`, `*.backup`, `*.bak`, artefacts Next isolés et `.wrangler/`. Vérifié par `git check-ignore` pour secrets locaux, ordonnances et archives. `storage/` ne doit jamais être forcé dans Git.
- Le dump PostgreSQL a été écrit dans le répertoire temporaire utilisateur, pas dans le dépôt. N'y déposer aucun secret de production; garder les archives avec ACL restreintes et chiffrement au repos selon la politique d'entreprise.

## 2. Backup, restauration et migration

### Sauvegarde/restauration locale vérifiée

- Source vérifiée avant backup : PostgreSQL local, base `agharas`, schéma `public`. Les paramètres d'identification n'ont pas été imprimés.
- Archive custom créée avec `pg_dump` PostgreSQL 18 : `C:\Users\admin\AppData\Local\Temp\opencode\agharas-public-20261104.dump`, **102 894 octets**, SHA-256 `24addf81a59a8f81a14aa59d32ac7c27a53cf5118f7109c15e04682685a7a76e`.
- `pg_restore --list` a lu l'archive et trouvé les entrées de tables et données attendues. Restauration complète avec `pg_restore --exit-on-error` vers une base neuve `agharas_clone_20261104_a`; aucune base existante écrasée.
- Sur source et clone restauré avant migration, les agrégats concordaient : **12 produits, 25 variantes, 4 commandes, 4 lignes de commande, 0 ordonnance, quantité de stock agrégée 125 et 31 mouvements**. Le clone, après migration, gardait ces mêmes valeurs.
- Le SQL `20261029130000_optical_compatibility` est additif (enum/table/index/FK/contrainte), sans insertion de règle ni approbation. `prisma migrate deploy` sur le clone n'a ajouté aucune règle; `OpticalCompatibilityRule` contenait 0 ligne. Les pages accueil, fiche et configurateur ont répondu HTTP 200 sur l'application connectée au clone. Le vrai fournisseur de stockage ou de production n'a pas été testé.
- Limite importante : cette preuve porte sur un backup/restauration PostgreSQL **local**. Aucun fichier d'ordonnance réel n'était référencé dans la base locale (0 ordonnance) ; la cohérence backup DB + volume de fichiers, le chiffrement, le RPO/RTO et la restauration sur l'hébergement cible restent à démontrer.

### Migration optique sur le développement

Après réussite et contrôle du backup et du clone, vérification de l'identité `agharas/public`, du caractère absent du tableau et du statut en attente, l'unique migration `20261029130000_optical_compatibility` a été appliquée avec `prisma migrate deploy` au **seul** schéma local `agharas/public`. Aucun `db push`, reset, seed ou approbation n'a été appliqué à cette base. Le statut final est **up to date**, trois migrations terminées. Les données et agrégats ci-dessus sont préservés.

Ce schéma local est un environnement de développement, pas une base de production. Aucune base de production n'a été identifiée ou touchée. La migration doit quand même être rejouée/revue sur une nouvelle base distante de staging après backup et approbation de changement.

### Impact métier optique constaté

- Après migration, le schéma local contient **0 règle**. L'inventaire local de démonstration comporte **9 produits actifs marqués compatibles**, **19 variantes actives** associées, plusieurs types de verre, 4 indices et 4 traitements actifs.
- Il n'existe donc aucune décision approuvée ou incompatible enregistrée. Toute configuration corrective exacte (produit + variante + type + indice + ensemble de traitements) sans décision correspondante est en attente et non achetable conformément au moteur. Aucune approbation synthétique ou professionnelle n'a été insérée dans `agharas/public`.
- Il s'agit du catalogue local de démonstration, pas d'un inventaire de production. L'opticien doit décider les combinaisons exactes de l'inventaire commercial réel avant toute ouverture à la vente corrective.

## 3. Stockage de médias et d'ordonnances

### Résolution implémentée

- Ajout de `src/lib/object-storage.ts`, abstraction serveur unique avec deux backends : `filesystem` pour volume persistant monté, et S3 compatible via `@aws-sdk/client-s3`. Choix par `OBJECT_STORAGE_DRIVER`; aucun fournisseur payant ou identifiant n'est requis pour le mode filesystem local.
- Les zones `public-media/` et `prescriptions/` sont séparées. Les clés sont générées côté serveur, limitées à des caractères sûrs, les collisions filesystem sont refusées (`wx`), et les deux racines de stockage ne sont pas confondues.
- Photos : limite 5 Mo, JPEG/PNG/WebP, vérification du type et de la signature de fichier. Elles restent accessibles via `/api/media/<nom-aléatoire>`; le bucket S3 peut rester privé et aucun lien S3 public n'est enregistré.
- Ordonnances : limite 10 Mo, PDF/JPEG/PNG/HEIC, détection de signature, nom aléatoire indépendant du nom transmis, mode fichier `0600` et nouveau répertoire privé `0700` sous filesystem. La route de lecture existante vérifie le propriétaire côté serveur, journalise le téléchargement, répond `private, no-store`, `nosniff` et `Content-Disposition: attachment`. Aucune URL publique d'ordonnance n'est créée.
- Les anciennes références filesystem restent lisibles si l'ancien chemin privé est configuré. Le passage filesystem → S3 nécessite une migration contrôlée des objets et des références; elle n'est ni automatisée ni exécutée. Ne pas basculer le driver avec des ordonnances existantes sans ce plan.
- En runtime `staging`/`production`, filesystem exige des chemins absolus `PRESCRIPTION_STORAGE_DIR` et `PUBLIC_MEDIA_DIR`; S3 exige bucket/région et paire d'identifiants ou identité IAM. L'endpoint S3-compatible doit être HTTPS. Les images publiques sont servies via le serveur; les documents médicaux demeurent privés.
- Des tests unitaires couvrent la résolution de chemin et l'isolation/read/write/delete filesystem. Les suites E2E/audit couvrent les limites/anonymat de la route d'ordonnance et les uploads d'images produits synthétiques.

### À configurer côté hébergeur

- Aucun volume distant ni bucket n'existe/vérifié dans ce travail. Fournir volume durable privé pour ordonnances ou bucket privé avec blocage d'accès public, IAM minimal, chiffrement au repos et en transit, versioning/récupération, sauvegarde, politique lifecycle/rétention approuvée et audit d'accès.
- Aucune politique de durée légale de conservation ni action d'effacement planifiée/utilisateur n'est implémentée. `deletePrescriptionFile` est une primitive, pas une procédure de rétention. L'entreprise doit fixer la durée et faire valider le processus de purge/export/litige avant de stocker des données réelles.
- Tester restaurations conjointes DB + fichiers, et une lecture d'image publique et un téléchargement autorisé d'ordonnance sur la cible. Tester explicitement le refus anonyme et les en-têtes privés avec un document fictif.

## 4. E-mail, auth, canonical, cache et supervision

### E-mail

- Ajout d'un transport serveur `src/lib/email.ts` avec Nodemailer SMTP configurable, TLS explicite (TLS direct port 465, STARTTLS requis autrement), validation des champs d'en-tête/adresses et rejet de certificats TLS invalides.
- `EMAIL_TRANSPORT=discard` est un sink de développement/test/staging sans transmission, journalisation ou persistance du corps du message. En production le guard refuse `discard` et exige le mode SMTP configuré.
- À la vérification de cette phase, aucun code n'appelait encore le transport et il n'existait pas de workflow de confirmation/notification. Une phase ultérieure a ajouté les notifications de commande via outbox; elles restent testées uniquement avec mock/discard. Voir [`docs/ORDER_EMAIL_NOTIFICATIONS.md`](ORDER_EMAIL_NOTIFICATIONS.md). Aucun e-mail réel n'a été émis.
- Manquent : fournisseur autorisé, domaine/expéditeur, hôte/port/identifiants SMTP dans un coffre, SPF/DKIM/DMARC, templates français et décisions sur contenu/déclencheurs/réessais. Ajouter les workflows seulement après validation métier; ne pas prétendre que les e-mails de commande existent.

### Origine publique et démarrage sécurisé

- `src/lib/runtime-config.ts` et `src/instrumentation.ts` valident le runtime Node de staging/production : origine publique HTTPS sans hôte local/chemin/credentials, PostgreSQL distant avec `sslmode=require|verify-ca|verify-full`, `AUTH_SECRET` d'au moins 32 octets et refus du secret d'exemple, `OWNER_EMAIL`, absence des identifiants `SEED_*`/`OWNER_PASSWORD`, stockage configuré et transport e-mail explicite.
- `next.config.ts` valide l'origine HTTPS dès le build si `APP_ENVIRONMENT=staging|production`, afin d'empêcher une URL localhost d'être compilée dans les métadonnées publiques. Le build hébergé doit recevoir l'origine définitive **avant** compilation; le domaine n'est pas fourni donc aucun build staging final n'a été produit.
- Le cookie de session existant est `HttpOnly`, `SameSite=Lax`, `Secure` lorsque `NODE_ENV=production`; le guard de production requiert aussi un propriétaire correctement configuré. Les commandes restent COD seulement.
- Le sitemap filtre déjà produits/catégories actifs et marques actives; les actions catalogue/collections revalident `/sitemap.xml`. Les confirmations et accès d'ordonnance sont privés/no-store. La config proxy/CDN réelle n'existe pas : ne jamais mettre en cache `/admin`, `/api` privé, panier/commande, sessions ou ordonnances.
- L'application écrit actuellement via les logs Node/console. `LOG_LEVEL` et `ERROR_MONITORING_DSN` sont des points de configuration documentés, pas une intégration opérationnelle : aucun SDK de monitoring, centralisation, alerte, redaction structurée ou rotation de logs n'a été provisionné. Éviter les prescriptions, secrets et données personnelles dans les logs.

## 5. Dépendances et compatibilité

### Correctifs ciblés appliqués

- `postcss` mis à jour à `8.5.32` avec override résolvant aussi la copie transitive utilisée par Next 15; le build optimisé a réussi après l'upgrade.
- `zod` mis à jour à `4.6.7` pour le conseil high de consommation mémoire. Les options d'erreur invalides de Zod 3 dans `src/lib/validation.ts` ont été adaptées à l'API Zod 4; TypeScript, 110 Vitest, build et deux suites Playwright ont passé.
- Ajout de `@aws-sdk/client-s3` et `nodemailer` pour les capacités explicitement demandées.
- Aucun `npm audit fix --force` n'a été exécuté. Le `--dry-run` a proposé un mélange de changements de versions majeures et d'artefacts multiplateformes; il n'a pas été appliqué.

### Audit frais et remédiation (5 novembre 2026)

- Audit de départ : `npm audit` 8 entrées de packages (3 high, 5 moderate); `npm audit --omit=dev` 3 high. Les 3 lignes high (`prisma`, `@prisma/config`, `deepmerge-ts`) pointaient vers **un seul advisory distinct** : [GHSA-ggr8-5vv4-36mx / CVE-2026-40345](https://github.com/advisories/GHSA-ggr8-5vv4-36mx), stack exhaustion sur deepmerge de graphes cycliques correspondants.
- `deepmerge-ts` 7.1.5 a été remplacé par le correctif 8.0.0 via override scoppé sous `@prisma/config`; Prisma et Prisma Client restent à **6.19.3**. `prisma@6.19.3` est une devDependency / peer optionnelle (`devOptional`), et le callsite touché est le loader CLI de configuration Prisma TS/JS; aucun graphe cyclique contrôlé par requête applicative ne lui est transmis. Malgré cette applicabilité limitée, npm le comptait aussi en audit production via le chemin de peer optionnel, donc le correctif est appliqué.
- Les 5 entrées moderate restantes au premier audit étaient la propagation d'un seul [GHSA-px8p-9vwx-vf98 / CVE-2026-45820](https://github.com/advisories/GHSA-px8p-9vwx-vf98), `fflate` 0.7.3 sous Vinext/Satori dev; l'override patch `fflate@0.7.5` est la version corrigée de la même ligne.
- Après ces changements ciblés : `npm audit --omit=dev` **0 vulnérabilité**, `npm audit` **0 vulnérabilité**. `npm audit fix --force` n'a pas été utilisé; son résultat suggérait un downgrade cassant Prisma vers 6.12.0. Aucun Prisma major, migration, changement schema ou modification de générateur/connexion n'a été fait.
- Les versions, portée/applicabilité et preuves sont détaillées dans [`docs/DEPENDENCY_SECURITY_REMEDIATION.md`](DEPENDENCY_SECURITY_REMEDIATION.md).

### Runtime Node

L'environnement local vérifié était Node `23.1.0`, hors des plages requises déclarées par `cf@1.0.0-beta.27` et Vitest 5.1.0. Les tests ont passé malgré les warnings, mais la cible doit utiliser une version LTS officiellement supportée et dans les plages des dépendances (Node 22 adéquat; confirmer le patch minimal avec les `engines` du lockfile au provisionnement). Ne pas choisir Node 23 pour le staging.

## 6. Vérifications exactes de cette phase

| Vérification | Résultat | Notes |
|---|---|---|
| TypeScript `npm run typecheck` | **PASS** | Next typegen + `tsc --noEmit`, après dépendances et config. |
| Vitest complet `npm test` | **110 PASS / 0 FAIL**, 15 fichiers | Six tests d'intégration pointés sur `agharas_test.agharas_test_secfix_20261105_a`; inclut 7 chemins, 3 stockage, 7 config runtime, 3 mail sink. |
| Build optimisé `npm run build` | **PASS** | `.next-techstaging-prod`, base connectée au schéma synthétique isolé; production build complet. Premier essai bloqué par DLL Prisma tenue par serveurs Agharas; après arrêt ciblé des serveurs 3002/3102 possédés, build repris et PASS. Port 3000 d'OptiGest intact. |
| Playwright E2E `npm run test:e2e` | **36 PASS / 0 FAIL / 0 SKIP / 0 TIMEOUT** | Build et port 3110 dédiés, schema synthétique `agharas_test_secfix_20261105_a`. Guest checkout COD, confirmation, owner auth, uploads média, auth route ordonnance, mobile, sitemap/navigation. Browser errors/failed requests : 0; aborts RSC speculative prefetches non bloquants. |
| Acceptance `npm run test:audit` | **41 PASS / 0 FAIL / 0 SKIP / 0 TIMEOUT** | Port 3111, schéma fraîchement créé `agharas_test_secfix_final_20261105_b`; achats, concurrence/idempotency, stock, publication/CMS, sécurité, écriture média, scénarios optiques synthétiques et WhatsApp. Aucun vrai fichier ni vrai e-mail. |
| Tests de stockage ciblés | **PASS : 10/10** tests unitaires storage-path + object-storage | Séparation filesystem, refus traversal, lecture legacy fail-closed et suppression contrôlée; pas de credentials S3 et aucune connexion externe. |
| Backup / restore / rehearsal migration | **PASS** | Archive vérifiée/restaurée et agrégats source/clone égaux; migration clone puis locale sans règles générées. |
| Migration locale | **PASS**, toutes migrations à jour | Appliquée uniquement à `agharas/public` après le rehearsal explicite; 0 règle optique insérée. |
| `npm audit` / production-only | **PASS, 0 vulnérabilité** | Post-remédiation; baseline initiale 8 total (3 high, 5 moderate), production 3 high package nodes but one unique GHSA. |
| S3 / SMTP / monitoring hébergés | **SKIP — configuration externe absente** | Aucun message transmis ni objet envoyé vers un service. |

Le test initial TypeScript après la mise à niveau Zod a relevé 4 erreurs API; elles ont été corrigées, puis TypeScript a passé. Un premier test storage a détecté que la suppression d'une clé `fs://` ne résolvait pas le bon répertoire; le défaut a été corrigé et la suite ciblée puis la suite complète ont passé. L'essai navigateur sur 3002 a aussi révélé des caches/dépendances et un import `node:path` dans le guard; les serveurs Agharas ont été arrêtés seulement après identification, le guard rendu portable, puis les routes publiques ont répondu 200 sans erreur. Aucun de ces échecs n'a été masqué ni transformé en skip.

## 7. Fichiers modifiés dans cette phase

- Config/sécurité : `.gitignore`, `.env.example`, `package.json`, `package-lock.json`, `next.config.ts`, `playwright.config.ts`, `vitest.config.ts`, `src/instrumentation.ts`.
- Runtime : `src/lib/runtime-config.ts`, `src/lib/storage-path.ts`, `src/lib/object-storage.ts`, `src/lib/uploads.ts`, `src/lib/public-media.ts`, `src/lib/email.ts`, `src/lib/validation.ts`.
- Tests : `tests/fixtures/server-only.ts`, `tests/unit/email.test.ts`, `tests/unit/object-storage.test.ts`, `tests/unit/runtime-config.test.ts`, `tests/unit/storage-path.test.ts`.
- Documentation : ce rapport, `docs/OWNER_UAT_AND_STAGING_READINESS.md`, `docs/IMPLEMENTATION_PROGRESS.md`.
- Suivi de sécurité dépendances (phase suivante) : `package.json`, `package-lock.json`, `docs/DEPENDENCY_SECURITY_REMEDIATION.md`, et mises à jour de ce rapport/progression/owner readiness; détail dans [`docs/DEPENDENCY_SECURITY_REMEDIATION.md`](DEPENDENCY_SECURITY_REMEDIATION.md).
- Modifications ultérieures hosted readiness : `src/lib/object-storage.ts`, `src/lib/uploads.ts`, `src/lib/public-media.ts`, `src/app/actions/checkout.ts`, `src/lib/operational-log.ts`, `next.config.ts`, tests unitaires et [`docs/HOSTED_INFRASTRUCTURE_READINESS.md`](HOSTED_INFRASTRUCTURE_READINESS.md).
- Données : la seule base existante modifiée est le schéma de développement `agharas/public`, par migration additive après backup/restore/rehearsal; aucune donnée métier modifiée ni approbation ajoutée. Les suites ont écrit uniquement dans la nouvelle zone `agharas_test.agharas_techstage_20261105_a`.

## 8. Décisions requises et séquence avant staging contrôlé

### À fournir par le propriétaire / l'entreprise

1. Dénomination légale, ICE/RC/IF, siège/adresse boutique, e-mail/téléphone et textes légaux réels.
2. Domaine officiel et sous-domaine de staging, approbation DNS/TLS, adresse d'expéditeur e-mail contrôlée par l'entreprise.
3. Inventaire réel (produits, variantes/SKU, prix, stock, photos) et règles approuvées de livraison, frais/zones/délais, retours/remboursements, COD et taxes.
4. Identité nominative du propriétaire autorisé; compte provisionné hors bande, secret généré dans le coffre et politique MFA/accès.
5. Rétention légale des ordonnances, règle de purge/export et autorisations d'accès aux documents.

### À fournir par un opticien qualifié

- Pour chaque référence/variante du catalogue staging : combinaison exacte produit + variante + type verre + indice + **ensemble** de traitements, décision approuvé/incompatible/en attente, plage de correction/conditions de montage, nom/qualification vérifiable, date et pièce justificative. Les fixtures d'acceptation ne sont pas des décisions professionnelles.

### Étapes techniques

1. Choisir l'hébergeur Node LTS et PostgreSQL isolé; fournir le domaine HTTPS et injecter la même `NEXT_PUBLIC_SITE_URL` au build et runtime.
2. Provisionner coffre secrets (`AUTH_SECRET`, URL DB TLS, `OWNER_EMAIL`), interdire `SEED_*` et `OWNER_PASSWORD` du runtime; provisionner compte de staging via procédure owner out-of-band.
3. Choisir volume persistent monté ou bucket S3 privé. Pour S3, fournir région/bucket, IAM minimal ou paire secrète, endpoint HTTPS éventuel, confirmer blocage public/encryption/versioning et plan de migration si des références filesystem doivent être importées.
4. Choisir SMTP, configurer SPF/DKIM/DMARC et faire un test **uniquement vers une boîte de recette contrôlée** après autorisation; activer les workflows e-mail seulement après leur validation métier.
5. Définir retention, sauvegardes synchronisées DB + fichiers, chiffrer, automatiser et tester une restauration complète du staging; définir RPO/RTO.
6. Remédier au Prisma high, faire revue/pentest, choisir supervision et centralisation/redaction des logs, rate limiting proxy, règles cache privé et alertes.
7. Appliquer le migration chain sur une **nouvelle DB staging** après backup/restauration; laisser les combinaisons optiques non revues en attente. Faire la recette propriétaire et opticien; enregistrer leurs validations; vérifier sitemap, publication/cache, ordonnances et restauration.
8. Obtenir un go/no-go écrit. Rester en COD; aucun déploiement public n'est autorisé par ce rapport.

## État final

La base npm est propre après remédiation ciblée et les tests de régression passent. Le verdict de préparation staging demeure **NOT READY — BLOCKERS REMAIN** à cause de la configuration distante et des sauvegardes d'hébergement absentes, domaine/expéditeur manquants, politique de rétention et monitoring, ainsi que décisions optiques/légales non fournies. N'interpréter ni les audits à zéro ni les 110 tests comme readiness production.
