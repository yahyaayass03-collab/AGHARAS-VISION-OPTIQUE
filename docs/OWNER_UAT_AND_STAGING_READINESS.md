# Acceptation propriétaire et préparation du staging — AGHARAS VISION OPTIQUE

**Dernière mise à jour : 5 novembre 2026**  
**Périmètre :** acceptation propriétaire locale et préparation technique; données synthétiques isolées pour les tests, aucune donnée métier modifiée.  
**Aucun déploiement public et aucun paiement en ligne.** L'historique de cette phase inclut l'application, après backup/restauration/rehearsal, de la migration optique additive au seul schéma local de développement `agharas/public`; aucun ordre/stock n'a changé et aucune règle optique n'a été créée. Voir [`docs/TECHNICAL_STAGING_PREPARATION.md`](TECHNICAL_STAGING_PREPARATION.md).

## Verdict

# NOT READY — BLOCKERS REMAIN

Les parcours de vente et d'administration sont largement couverts par des tests locaux, mais le staging contrôlé ne doit pas encore être ouvert aux vrais clients ni présenter des configurations optiques non validées. Les blocages comprennent l'approbation professionnelle optique, les données légales/commerciales fictives, l'absence de domaine HTTPS et d'infrastructure distante, les sauvegardes/restaurations de la cible, la configuration effective du stockage durable, l'expéditeur/provider SMTP, le monitoring et l'accès privé au staging. L'audit de dépendances est désormais à zéro vulnérabilité (voir le rapport de remédiation).

Les tests locaux démontrent le comportement du code dans un environnement synthétique ; ils ne constituent ni une recette du propriétaire sur les produits réels, ni une validation optique, ni une preuve de disponibilité ou de sécurité d'une infrastructure d'hébergement.

## 1. État fonctionnel et preuves disponibles

Les rapports demandés ont été examinés : `PERFORMANCE_RUNTIME_AUDIT.md`, `OWNER_ADMIN_CMS_FINAL_ACCEPTANCE.md`, `OPTICAL_COMPATIBILITY_ENGINE_ACCEPTANCE.md`, `OWNER_BUSINESS_ACCEPTANCE_CHECKLIST.md` et `IMPLEMENTATION_PROGRESS.md`. Les constats détaillés sont cohérents avec `DEPLOYMENT.md`, `SECURITY.md` et `OPTICAL_COMPATIBILITY_REVIEW.md`.

| Domaine | État | Preuve et limite |
|---|---|---|
| Catalogue et produits | Fonctionnellement vérifié | Acceptance couvre création, modification, images, prix, variantes, stock, publication/dépublication, archivage/restauration. Les essais écrivent des données synthétiques en base isolée. |
| Accueil et CMS | Fonctionnellement vérifié | Tests de bannière, catégories mises en avant, ordre/visibilité des sections et revalidation sans rebuild. Le propriétaire doit encore confirmer ses textes, visuels et choix éditoriaux. |
| Paramètres boutique | Fonctionnellement vérifié | Mise à jour et propagation des paramètres, notamment WhatsApp. Les coordonnées et mentions légales actuellement fournies sont des placeholders de démonstration. |
| Verres et tarifs | Flux de configuration couvert | L'interface permet la gestion des types, indices et traitements/prix. Cela ne vaut pas approbation de compatibilité monture-verre par un opticien. |
| Commandes | Fonctionnellement vérifié | Parcours invité/COD, contrôle de prix et de stock, commande unique en cas de double soumission, confirmation et gestion administrative couverts par l'acceptation. Paiement en ligne non activé. |
| Historique | Préservation vérifiée par conception/tests | Les modifications optiques ne réécrivent pas les instantanés de commandes historiques. Les commandes existantes ne constituent pas une approbation professionnelle des options. |
| Performance | Mesurée localement | Production optimisée plus rapide que le serveur de développement sur le même jeu synthétique ; aucune mesure de charge, latence réseau réelle ou infrastructure de production. Voir le rapport performance. |

### Checklist UAT du propriétaire — à exécuter en français

Les lignes ci-dessous sont une recette pratique. Les preuves automatisées sont indiquées comme telles ; les cases restent à cocher par le propriétaire sur un environnement de recette et avec des données qu'il a approuvées. **Ne pas tester les opérations d'écriture sur la base commerciale existante.**

#### Produits, photos, prix et stock

- [ ] Créer un produit de test en brouillon : nom, marque, catégorie, type, description et prix.
- [ ] Ajouter plusieurs photos, vérifier les aperçus, supprimer une photo si nécessaire, puis choisir l'image principale avec les flèches.
- [ ] Modifier ensuite le nom, le texte, le prix et le prix barré éventuel ; enregistrer et vérifier les valeurs dans l'administration et sur la fiche publique.
- [ ] Créer au moins deux variantes/coloris avec des références SKU différentes ; renseigner et vérifier le stock initial.
- [ ] Corriger le stock depuis **Stock** ; vérifier le mouvement et la disponibilité réellement affichée côté boutique.
- [ ] Prévisualiser le brouillon, publier, puis vérifier qu'il apparaît dans la bonne catégorie et que le bouton d'achat respecte le stock.
- [ ] Modifier le prix publié et confirmer sa mise à jour publique immédiate ; ne pas valider une ancienne valeur du panier sans revalidation.
- [ ] Dépublier et confirmer le retrait de la vente ; archiver et vérifier le retrait ; restaurer et vérifier que le produit revient en brouillon, sans republication implicite.

#### Accueil et informations de la boutique

- [ ] Modifier une bannière (titre, texte, image, lien/bouton et ordre), enregistrer, puis contrôler l'accueil public sur ordinateur et mobile.
- [ ] Choisir et ordonner les catégories mises en avant ; enregistrer et vérifier leur ordre public.
- [ ] Réordonner les sections de l'accueil, enregistrer/publier, puis utiliser **Voir l'accueil publié** pour contrôler le résultat.
- [ ] Modifier la visibilité des sections et vérifier qu'une section masquée disparaît sans altérer les autres contenus.
- [ ] Modifier les coordonnées dans les paramètres avec les vraies valeurs approuvées par l'entreprise, puis vérifier en-tête, pied de page, contact et liens WhatsApp.
- [ ] Confirmer que les modifications CMS sont immédiatement reflétées sans nouveau build.

#### Verres, commandes et vie quotidienne

- [ ] Modifier un tarif de verre ou de traitement sur une donnée de recette et confirmer le montant au configurateur puis au panier.
- [ ] Ne rendre achetable aucune configuration optique détaillée avant décision documentée d'un opticien.
- [ ] Passer une commande invité de recette en **paiement à la livraison (COD)** ; vérifier les coordonnées, livraison, options, total, confirmation et présence d'une seule commande.
- [ ] Dans **Commandes**, retrouver la commande de recette et tester les changements de statut autorisés ; contrôler l'historique et les mouvements de stock.
- [ ] Vérifier l'accès aux ordonnances uniquement aux personnes autorisées, sans télécharger/copier de documents réels pour la recette.
- [ ] Refaire les vérifications de navigation sur mobile, notamment menu, catalogue, fiche, panier, commande et administration.

**Aide à l'utilisation :** le formulaire produit regroupe de nombreux champs et le téléversement d'images se fait depuis la fiche produit. La recette actuelle valide le fonctionnement, mais aucune étude d'observation avec le propriétaire réel n'a confirmé qu'il peut gérer seul ces tâches. Tester le checklist ci-dessus avec le propriétaire et noter les difficultés avant d'ajouter des changements d'interface. Aucun défaut d'ergonomie avéré ne justifie une refonte dans cette phase.

## 2. Revue optique : décisions réservées à un opticien

### Comportement technique vérifié

- Le moteur, une fois sa migration appliquée, enregistre une décision exacte associant produit, variante, type de verre, indice et **ensemble complet** des traitements ; les décisions possibles sont approuvé, incompatible ou en attente.
- Une combinaison sans règle correspondante est en attente et non achetable. Une règle pour un sous-ensemble de traitements n'approuve pas un ensemble plus grand. La validation est contrôlée au configurateur/ajout, au panier et à la commande ; les instantanés historiques ne sont pas réécrits.
- Les cas d'approbation créés par les tests sont synthétiques et servent uniquement à tester le logiciel. Aucun statut synthétique ne peut être repris comme décision professionnelle.
- L'interface enregistre le nom/déclaration du réviseur, la date et une preuve facultative, mais ne vérifie pas l'identité ni la qualification professionnelle. L'outil ne fournit pas encore de rapport exhaustif des combinaisons manquantes et ne montre pas toujours l'état effectif dans le configurateur.

### Inventaire local à faire vérifier — données de démonstration uniquement

Une inspection en lecture seule de `agharas/public` a trouvé les 9 produits actifs marqués `lensCompatible`, avec 19 variantes actives (détail ci-dessous). **Ce catalogue local est une donnée de démonstration, pas l'inventaire de production.** Il n'existe pas de table `OpticalCompatibilityRule` dans ce schéma aujourd'hui ; aucune décision détaillée n'y est enregistrée. Ne déduire aucune compatibilité du nom, de la forme, du matériau ou du fait qu'un produit était précédemment proposé avec des verres.

| Produit local | Variantes actives à examiner |
|---|---|
| Amalfi Solaire Havana Polar | Havana ; Noir |
| Atelier Titane Découpé | Titane naturel ; Or brossé |
| Clip Solaire Magnétique 2-en-1 | Or ; Argent |
| L'Hivernal Écaille Classique | Écaille classique ; Miel clair |
| L'Hivernal Vert Émeraude | Vert émeraude ; Écaille blonde |
| Le Marais N°04 — Or Pur | Or Pur 18k & titane satiné ; Titane brossé ; Noir profond |
| Silhouette Pure Pantos | Titane argenté ; Or rose |
| Titane Minimaliste Noir Mat | Noir mat ; Gunmetal |
| Urban Rectangulaire Ultra-Thin | Noir mat ; Bleu nuit |

Pour **chaque** variante réelle retenue dans le catalogue cible, l'opticien doit décider explicitement, et documenter séparément :

1. Le type de verre (les types actifs observés localement incluent neutre, unifocal HD et progressif individualisé ; vérifier la liste réelle de l'environnement cible).
2. L'indice (les indices actifs observés localement sont 1.50, 1.60, 1.67 et 1.74 ; confirmer les plages de correction et limites de montage applicables).
3. L'ensemble exact de traitements (anti-reflet, photochromique, filtre BlueProtect et hydrophobe dans la liste locale observée), y compris les associations, exclusions et conditions de pose.
4. La décision **approuvé / incompatible / en attente**, les limites de correction ou de dimensions, le nom et la qualification vérifiable de l'opticien, la date et la référence de preuve.

Cette liste désigne les références à passer en revue ; elle ne propose aucune combinaison approuvée ou incompatible. La liste des produits, variantes et options doit être extraite de l'inventaire réel après identification de l'environnement de staging. L'opticien doit également identifier les commandes historiques nécessitant un suivi sans modifier rétroactivement leurs snapshots.

### Migration optique et déploiement

- Contrôle initial en lecture seule : `20261029130000_optical_compatibility` était pending sur `agharas/public`; table absente.
- Avant changement, sauvegarde custom `pg_dump` vérifiée par `pg_restore --list`, puis restaurée vers la nouvelle base `agharas_clone_20261104_a`. Produit/variante/commande/lignes de commande/stock/mouvements égaux à la source; migration clone exécutée avec succès, sans règle créée.
- Après réussite de ce rehearsal et nouvelle vérification de l'identité locale `agharas/public`, la migration additive a été déployée au schéma de développement local uniquement. Statut final : **3 migrations terminées, database up to date**. Les agrégats de données sont préservés; `OpticalCompatibilityRule` existe mais contient **0 ligne**.
- Cette validation n'autorise pas la migration d'une base hébergée. Toute base de staging doit être créée isolément, sauvegardée/restaurée, migrée et testée avant utilisation.

## 3. Sécurité, configuration et opérations

| Exigence | Constat vérifié | Action avant staging/production |
|---|---|---|
| URL canonique, domaine, HTTPS | Configuration locale observée : `NEXT_PUBLIC_SITE_URL` est `http://localhost:3000`. Aucun domaine public ni certificat cible vérifié. | Définir le domaine officiel, DNS, TLS, redirection HTTP→HTTPS, URL canonique HTTPS et HSTS au reverse proxy ; vérifier sitemap, robots et URLs SEO sur l'hôte cible. |
| Secrets | Le secret local est configuré et ne correspond pas à l'exemple ; aucune valeur n'est divulguée ici. Il n'y a pas de secret de production vérifié. | Générer un `AUTH_SECRET` unique d'au moins 32 octets aléatoires ; stocker toutes les clés dans un gestionnaire de secrets, faire tourner les secrets de recette et interdire les identifiants de démonstration en production. |
| Compte propriétaire | `OWNER_EMAIL` et `OWNER_PASSWORD` ne sont pas configurés dans l'environnement local inspecté. Le code de production refuse le statut propriétaire si l'adresse n'est pas configurée. | Provisionner hors bande un compte propriétaire nominatif, protéger ses identifiants, confirmer l'accès et le moindre privilège ; ne jamais exécuter le seed de démonstration sur une base métier. Prévoir MFA si possible. |
| Base/migrations | Base locale `agharas/public` maintenant à jour après rehearsal backup/restore/clone. Aucun staging ou production provisionné. | Créer des bases distantes distinctes recette/production, TLS DB, moindre privilège, répéter le rehearsal sur l'infrastructure cible et valider rollback par restauration. |
| Sauvegarde/restauration | Backup custom local (102 894 octets, SHA-256 consigné dans le rapport technique) restauré dans une DB clone; cible hébergée non testée. | Dumps chiffrés, rétention, sauvegarde synchronisée base + fichiers, contrôle d'intégrité et restauration cible/RPO/RTO. |
| Ordonnances et données sensibles | Adaptateur filesystem privé/S3 ajouté; tailles/types/signatures vérifiés, clés générées, accès download propriétaire uniquement/no-store. Pas de volume/bucket distant, encryption/ACL cible ni politique de rétention/purge testés. | Provisionner volume/bucket privé persistant, chiffrement/accès/versioning/backups; fixer légalement retention/purge et tester restauration. |
| Images produit | Adaptateur filesystem/S3 ajouté; zone distincte des ordonnances, validation 5 Mo/JPEG/PNG/WebP, route média publique applicative. Aucun stockage distant durable provisionné. | Choisir volume/bucket/CDN et backup; ne pas utiliser volume éphémère. |
| E-mail | Notifications commande owner/customer ajoutées via outbox transactionnelle; owner activé par défaut à l'adresse `OWNER_EMAIL`, confirmation client désactivée par défaut et activable par owner. Tests mock/discard 5/5; aucune livraison SMTP réelle. | Fournir expéditeur/provider approuvé, DNS SPF/DKIM/DMARC et secrets; valider copie/contacts, puis tester sur boîte synthétique contrôlée. Voir [`docs/ORDER_EMAIL_NOTIFICATIONS.md`](ORDER_EMAIL_NOTIFICATIONS.md). |
| Cache/publication | Revalidation CMS et publication immédiate sont couvertes par la suite d'acceptation. Les routes privées/commandes ne doivent pas recevoir de cache public partagé. | Valider les règles du proxy/CDN : ne pas mettre en cache admin, API privée, sessions, ordonnances, panier/commande ou confirmations personnelles ; tester la propagation après publication. |
| Authentification et uploads | Contrôles de rôle/propriétaire et protections de fichiers documentés ; aucun audit externe/pentest n'a été fourni. | Revue de sécurité indépendante, limitation de débit partagée au proxy, sessions/cookies derrière TLS, politique d'accès ordonnances, contrôle de comptes et procédure d'incident. |
| Logs et supervision | L'application émet les logs du processus ; aucune centralisation, alerte, rétention ou monitoring cible n'est démontré. | Centraliser logs sans secrets ni valeurs d'ordonnance, tracer 5xx et erreurs DB, alertes uptime/disque/backup, rotation/rétention, suivi des restaurations. |
| Légal et commercial | Les coordonnées société, ICE/RC/IF, adresse, téléphone/e-mail et certains contenus sont des placeholders. | Le propriétaire et le conseil approprié doivent fournir et valider les mentions légales, CGV, confidentialité/cookies, livraison/retours, taxes, délais, prix et consentements applicables. Ne rien inventer. |
| Livraison et paiements | COD est testé. Tarifs/zones/délais et règles définitives de livraison restent à confirmer par l'entreprise. Paiement carte non activé. | Approuver zones, prix, seuils, délais et procédure de retour ; conserver le COD uniquement. N'activer aucun prestataire de paiement dans ce périmètre. |
| Dépendances | Mise à jour du 5 novembre : audit frais `npm audit` et `npm audit --omit=dev` **0 vulnérabilité** après correction scoppée de `deepmerge-ts` et patch `fflate`; Prisma reste en 6.19.3. Détails des advisories initiaux et des limites de cette remédiation : [`docs/DEPENDENCY_SECURITY_REMEDIATION.md`](DEPENDENCY_SECURITY_REMEDIATION.md). | Garder les overrides suivis et ré-auditer en CI/avant déploiement; aucune autre décision propriétaire, mais la préparation hébergée demeure bloquée par les autres lignes de ce tableau. |
| Hébergement | Aucune cible, pipeline CI/CD, restauration, capacité, supervision, charge ou compatibilité réelle de stockage n'a été vérifiée. | Sélectionner et valider un runtime Node.js supporté + PostgreSQL, proxy TLS, stockage persistant, réseau, ressources, sauvegardes, déploiement/rollback et environnement de staging séparé. |

**Limites techniques optiques supplémentaires :** les décisions portent sur des combinaisons exactes ; il n'y a pas de règle générique par forme ou catégorie. L'écran ne fournit pas encore une liste complète/exportable de tous les cas manquants. Les décisions nécessitent le jeu complet de traitements. La synchronisation concurrente avec chaque modification de catalogue/prix n'est pas couverte par le verrou de décision ; faire compléter la revue des frontières transactionnelles avant d'annoncer une validation exhaustive.

## 4. Tests et vérifications exacts

Résultats finaux exécutés le 5 novembre 2026 sur le schéma synthétique neuf `agharas_test.agharas_techstage_final_20261105_a` (les campagnes précédentes ont aussi utilisé des schémas distincts) :

| Vérification | Résultat | Portée |
|---|---|---|
| `npm run typecheck` | **PASS** (code retour 0) | TypeScript/Next route types. |
| `npm test` | **110 PASS / 0 FAIL** ; 15 fichiers | Inclut 6 tests d'intégration PostgreSQL, storage/path, configuration runtime et mail sink. DB `agharas_test.agharas_techstage_final_20261105_a`. |
| `npm run build` | **PASS** (code retour 0) | Build optimisé dans `.next-techstaging-prod`; DB et stockage synthetic isolés. |
| `npm run test:e2e` | **36 PASS / 0 FAIL / 0 SKIP / 0 TIMEOUT** | Playwright sur serveur de build isolé et schéma synthétique ; inclut parcours invité/COD, mobile, navigation et confirmation. |
| `npm run test:audit` | **41 PASS / 0 FAIL / 0 SKIP / 0 TIMEOUT** | Acceptation sur le même schéma; inclut création/édition produit, médias, prix/stock, publication, CMS, workflow optique de test et double soumission/idempotence. Un premier lancement final a échoué avant les tests car le serveur n'avait pas reçu `NEXT_DIST_DIR` et cherchait `.next`; serveur relancé avec le build isolé, disponibilité HTTP 200 vérifiée, campagne complète réussie. |
| `prisma migrate deploy` + `migrate status` | **PASS** clone rehearsal + local dev | Clone restauré `agharas_clone_20261104_a`, puis `agharas/public` après validation; 3 migrations up to date, 0 règle ajoutée. |
| `npm audit` | **FAIL / advisories présents** | 8 au total; 3 high, 5 moderate; production 3 high Prisma. Aucun critical. |
| Config de staging distante | **BLOCKED** | Domaine, secrets hébergés, DB TLS, owner, volume/bucket, SMTP, monitoring, accès restreint et rétention non configurés. |

Les tests E2E et audit démontrent des parcours dans des données synthétiques locales. Ils ne certifient pas les rôles de production, l'inventaire commercial réel, la compatibilité optique professionnelle, le fournisseur e-mail, le stockage, le réseau ou le rétablissement après incident.

## 5. Séquence recommandée avant ouverture du staging

1. **Décisions métier :** confirmer propriétaire du projet, inventaire réel, prix/TVA, livraison, retours, COD, coordonnées et textes juridiques ; remplacer les placeholders avec les valeurs approuvées.
2. **Revue opticien :** importer l'inventaire réel dans un environnement isolé, faire décider chaque combinaison exacte, documenter qualification/date/preuve et conditions ; définir le traitement des configurations non revues et de tout client historique concerné.
3. **Sécurité et remédiation :** traiter les 3 advisories high de production (Prisma) et revoir les 5 moderates dev Vinext/Cloudflare, faire revue/pentest, définir rétention des ordonnances, accès, antivirus et réponse à incident.
4. **Infrastructure de staging :** provisionner domaine de recette et HTTPS, runtime Node/PostgreSQL séparés, secrets gérés, stockage persistant privé (ordonnances) et durable (images), e-mail de test, logs/alertes, rate limiting et règles de cache privé.
5. **Données et migration :** créer un backup cohérent de la base et des fichiers, restaurer une copie de test, revoir la migration optique, l'appliquer seulement à la base de staging nouvellement provisionnée, vérifier statut/index/règles par défaut, puis exécuter les scénarios optiques et fonctionnels. Pas de `db push`, reset ni seed sur une base commerciale.
6. **Recette propriétaire :** faire exécuter la checklist française sur staging avec produits, images, commandes et comptes fictifs ; consigner les résultats, difficultés et approbations. Contrôler desktop/mobile et l'accès ordonnances.
7. **Go/no-go staging :** vérifier restauration réelle, observabilité, e-mail, confidentialité, prix/livraison et absence de secrets de démonstration ; obtenir validation écrite du propriétaire et de l'opticien. Conserver les paiements en ligne désactivés.

## Fichiers modifiés dans cette phase

- `docs/OWNER_UAT_AND_STAGING_READINESS.md` — présent rapport.

La préparation technique détaillée, l'empreinte de sauvegarde, la matrice d'audit et les blockers externes sont consignés dans [`docs/TECHNICAL_STAGING_PREPARATION.md`](TECHNICAL_STAGING_PREPARATION.md). La migration locale réussie n'est pas une migration staging/production et n'approuve aucune configuration optique.

Les rapports de performance et d'avancement déjà mis à jour lors de la phase précédente sont référencés, sans répéter leur audit. Aucun code applicatif ni donnée métier n'a été modifié dans cette phase.
