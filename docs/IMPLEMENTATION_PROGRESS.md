# Avancement de l'implémentation — AGHARAS VISION

> **9 novembre 2026 — Conversion isolée PostgreSQL → MariaDB : `MARIADB CONVERSION IMPLEMENTED — TESTING BLOCKED`.** Prisma 6.19.3 / MySQL provider; genuine MariaDB 11.4.8 disposable server; fresh MariaDB baseline + integrity migration applied, 38 application tables + migration history all InnoDB/utf8mb4, Prisma drift empty. Original PostgreSQL project and database untouched; no historical data transfer or deployment. Production build and typecheck PASS on Node 22.23.0; Vitest 141/141; Playwright E2E 38/38; full browser acceptance 44/44 (2m12s), npm audits 0 vulnerabilities. MariaDB tests cover JSON/Unicode persistence, optical CHECK/fail-closed path, shared mutex, simultaneous inventory guards, concurrent last-stock attempts, duplicate checkout rollback and outbox deduplication. Candidate package: `dist/hostinger-mariadb-business-20261109.zip` (213 entries, SHA-256 `9EE87F98F00CD63F0A8E9ECFD3D516131CA7FAF2ACD31F093C6723DCE64BA7DE`); not approved for deployment. Hostinger hPanel runtime/grants remain unverified; concurrent price-edit/checkout and competing professional-review action schedules are not yet exercised. Conversion remains in isolated copy and is not adopted or deployed. Full reports: [`HOSTINGER_MARIADB_CONVERSION.md`](HOSTINGER_MARIADB_CONVERSION.md), [`HOSTINGER_MARIADB_TEST_RESULTS.md`](HOSTINGER_MARIADB_TEST_RESULTS.md), [`HOSTINGER_MARIADB_DEPLOYMENT_FR.md`](HOSTINGER_MARIADB_DEPLOYMENT_FR.md).

> **9 novembre 2026 — Préparation Hostinger Business (aucun déploiement) : HOSTINGER BUSINESS READINESS PARTIAL.** Projet préparé pour Web App Next.js SSR gérée (Node 22), Prisma 6.19.3/PostgreSQL Neon avec URL pooled + `DIRECT_URL`, migrations protégées, stockage S3-compatible, cron borné et ZIP sélectif `dist/hostinger-business-package-20261109.zip` (215 entrées; SHA-256 `55DA8D01B909D680D2BB1E2C973567F4743DC852E7D99D0A842612ECF05D22F2`). Documentation officielle Hostinger actuelle consultée; version/quotas exacts du compte, Neon, bucket, SMTP, domaine/DNS/HTTPS et déploiement non vérifiés. Vérifications isolées sous nouveaux schémas synthétiques seulement : Node 22.23.0 `npm ci`, Prisma validate/generate, typecheck et build PASS; Vitest **134/134**; E2E Chromium **36/36**; responsive **11/11** aux largeurs 390/768/1024/1440; audit fonctionnel complet **43/44**, un timeout séquentiel dans le round-trip ordonnance (réussi dans un essai ciblé séparé); audits npm complets et production **0 vulnérabilité**. Six migrations appliquées puis statut up-to-date sur `agharas_test.agharas_hostinger_readiness_20261109_02`; aucune mutation du schéma démo/`agharas_test.public`. Aucun vrai e-mail/paiement, aucune ressource externe ou donnée business. Étapes manuelles et réserves : [`HOSTINGER_BUSINESS_READINESS.md`](HOSTINGER_BUSINESS_READINESS.md), guide [`HOSTINGER_BUSINESS_DEPLOYMENT_FR.md`](HOSTINGER_BUSINESS_DEPLOYMENT_FR.md), checklist [`HOSTINGER_BUSINESS_CHECKLIST_FR.md`](HOSTINGER_BUSINESS_CHECKLIST_FR.md).

> **9 novembre 2026 — Correction du nom officiel confirmée et vérifiée sur la démonstration locale `http://127.0.0.1:3106/`.** Le propriétaire confirme le logo original et la graphie officielle `AGHARAS VISION`; les réglages CMS, la vitrine, les métadonnées, les données structurées et les textes transactionnels utilisent ce nom. Adresse : `N° 13 Imm 08 , Lot 4 Al kheir,Cité Essalam,AGADIR`. TypeScript PASS, Vitest 126/126, build production PASS, E2E Chromium navigation/responsive 14/14, responsivité 390/768/1024/1440 sans overflow, `git diff --check` PASS. Base isolée `agharas_test.agharas_demo_refresh_20261108_01` : 12 produits, 1 commande, 0 règle optique; aucune donnée d’ordre historique modifiée. **Verdict : `BRAND NAME CORRECTED — VERIFIED`.** Voir [`AGHARASS_BRAND_IDENTITY_UPDATE.md`](AGHARASS_BRAND_IDENTITY_UPDATE.md). Les anciens bilans ci-dessous sont historiques.

> **8 novembre 2026 — Audit fonctionnel final client + propriétaire : LOCAL SOFTWARE PASS / ACCEPTATION MÉTIER ET OPTIQUE PARTIELLE.** Parcours Chromium réel puis vérification DB sur deux nouveaux schémas isolés `agharas_test.agharas_audit_20261108_01` et `agharas_test.agharas_audit_e2e_20261108_01`; aucune écriture sur le schéma de présentation `agharas_demo_refresh_20261108_01`, qui reste à 12 produits, 1 commande, 0 règle optique (port 3106 restauré et disponible). Acceptance 44/44, E2E 36/36, Vitest 122/122, Prisma validate PASS, TypeScript PASS, build production isolé PASS, `npm audit` 0 vulnérabilité, `git diff --check` PASS. Vérifications manuelles UI+DB : panier/favoris/contact/COD+stock+outbox, catégorie/marque/affectation, options/prix optiques restaurés, salon/FAQ/publication, seuil/mode de livraison et propagation CMS/restaurés; 22 routes owner 200; pas de débordement mesuré sur surfaces responsive choisies. Aucun défaut logiciel reproductible confirmé dans les parcours testés. Newsletter non disponible explicitement (composant non monté); formulaire contact promet une réponse sous 24 h mais n'envoie pas d'email automatique; contenu légal/commercial, lieux et procédures requièrent validation. Les ordonnances ont passé le roundtrip synthétique et les contrôles privés/owner/non autorisé, mais rétention encore à définir. Aucune décision optique réelle : approbation professionnelle obligatoire avant ventes correctives; fixtures d'approbation marquées test-only. Verdict : customer PASS local, owner PASS local, optical PARTIAL, global PARTIAL. Aucun vrai email, paiement en ligne ou hosting. Rapport : [`COMPLETE_FINAL_FUNCTIONAL_AUDIT.md`](COMPLETE_FINAL_FUNCTIONAL_AUDIT.md); inventaire actualisé : [`COMPLETE_FUNCTIONAL_INVENTORY.md`](COMPLETE_FUNCTIONAL_INVENTORY.md).

> **8 novembre 2026 — Actualisation finale de la démonstration locale : UPDATED LOCAL DEMO READY.** Schéma neuf `agharas_test.agharas_demo_refresh_20261108_01` vérifié absent avant création puis vérifié avant/après migrations et seed; six migrations actuelles, 12 produits synthétiques, une commande seed, Progressive inactif, zéro décision de compatibilité. Build production isolé `.next-client-demo-refresh-final-20261108`, démo `http://127.0.0.1:3106/`, e-mail discard, stockage local; aucun déploiement. Walkthrough Chromium réel lecture seule (hors session propriétaire) : accueil, catalogue, produit, configurateur, dashboard, CMS bannières, apparence et paramètres HTTP 200; six WebP 200; aucun échec réseau ni erreur navigateur. Storefront et dashboard responsive 390/768/1024/1440 sans débordement; CMS/settings vérifiés à 1440; captures et détails dans `artifacts/client-demo-refresh/`. Le premier contrôle a trouvé un débordement mobile du dashboard; les colonnes de cette grille sont maintenant `min-w-0`, rebuild production réussi et vérification répétée PASS. Addition/ADD et EP absents du configurateur, Progressive absent; les suites synthétiques précédemment vérifiées couvrent le refus des requêtes forgées, valeurs atypiques techniquement valides et blocage PENDING/INCOMPATIBLE. Port 3002 préservé, 3000 non touché. Aucun changement des données seed pendant la navigation. Livraison fonctionnelle/métier toujours bloquée en attente de décisions optiques professionnelles et validations légales/commerciales; aucune aptitude au commerce réel n'est affirmée. Guide : [`CLIENT_HANDOVER_GUIDE_FR.md`](CLIENT_HANDOVER_GUIDE_FR.md); rapport : [`FINAL_CLIENT_DELIVERY_REPORT.md`](FINAL_CLIENT_DELIVERY_REPORT.md).

> **8 novembre 2026 — Récupération finale des ajustements optiques et visuels : code et vérification synthétique PASS / déploiement DB hors périmètre.** Progressive absent des choix et refusé par action serveur forgée et panier périmé; les autres options, snapshots historiques et prix historiques restent préservés. Saisie cliente sans Addition/ADD ni EP; les valeurs atypiques techniquement valides sont acceptées sans jugement clinique, tandis que contrôles techniques et compatibilités optiques PENDING/INCOMPATIBLE restent bloqués. Six WebP issus de sources Pexels avec licences commerciales documentées, dimensions originales, créateurs et placements consignés dans `assets/pexels-originals/README.md`; CMS conserve ses contrôles et le test de remplacement/rendu public passe. Chromium réel : accueil, catalogue, produit et configurateur HTTP 200 sans erreurs; captures accueil et prescription à 390/768/1024/1440 dans `artifacts/optical-browser/`, sans débordement. Vérification: Prisma validate PASS; TypeScript PASS; Vitest 122/122; Next production build PASS; E2E 36/36; acceptance 44/44; `npm audit` 0 vulnérabilités; `git diff --check` PASS. Migrations et données synthétiques utilisées uniquement sous `agharas_test` (schemas D/E); aucune base business/demo n'a été ciblée durant ce recovery, aucun déploiement. Leur statut de migration n'est pas affirmé; tout rollout exige backup/restauration et rehearsal autorisés. Les approbations d'acceptance sont marquées TEST ONLY et ne sont pas professionnelles. Verdict **CHANGES INCOMPLETE — BLOCKERS REMAIN** pour rollout business/demo et approbations professionnelles. Rapport détaillé : [`OPTICAL_FORM_AND_VISUAL_REFINEMENTS.md`](OPTICAL_FORM_AND_VISUAL_REFINEMENTS.md).

> **8 novembre 2026 — Récupération de recette finale : LOCAL DEMO READY / VALIDATION PROFESSIONNELLE ET MÉTIER EN ATTENTE.** Chromium Playwright 1.64.1 réinstallé en cache D: dédié; production build isolé PASS (`npx next build`; `npm run build` a d'abord rencontré un Windows `EPERM` à Prisma generate pendant que le dev server gardait le DLL, puis la compilation Next directe a réussi avec le client généré existant). Prisma validate PASS; typecheck PASS; Vitest 120/120; E2E 36/36; acceptation 42/42 (0 fail/skip/timeout); `npm audit` complet et production 0 vulnérabilité; `git diff --check` PASS. Les E2E et acceptance ont tourné sur nouveaux schémas séparés dans `agharas_test` et des serveurs production dédiés; aucun test n'a ciblé `agharas/public`. Parcours ordonnance synthétique complet passé (upload/validation, commande COD unique, stock, accès propriétaire/no-store, refus anonyme et public). Une approbation d'essai explicitement TEST ONLY existe uniquement dans le schéma d'acceptance; le schéma de démonstration propre a 12 produits, 1 commande seed, 0 décision optique. Démo locale optimisée et connectée aux seules données synthétiques : `http://127.0.0.1:3106/`; le serveur dev existant `127.0.0.1:3002` reste actif; port 3000 non touché. Aucun bug applicatif reproductible confirmé. Verdict **LOCAL DEMO READY**, pas **FUNCTIONAL DELIVERY READY** : les décisions d'opticien, contenus commerciaux/légaux et rétention d'ordonnances restent à valider; aucun vrai ordre optique ne doit être autorisé sans ces décisions. Détails et limites : [`FINAL_DELIVERY_DEFECT_REGISTER.md`](FINAL_DELIVERY_DEFECT_REGISTER.md), [`FINAL_CLIENT_DELIVERY_REPORT.md`](FINAL_CLIENT_DELIVERY_REPORT.md), [`CLIENT_HANDOVER_GUIDE_FR.md`](CLIENT_HANDOVER_GUIDE_FR.md).

> **7 novembre 2026 — Évaluation finale locale : LIVRAISON BLOQUÉE POUR LA RECETTE FINALE.** État actuel vérifié sans opération d'écriture métier : Prisma validate PASS; typecheck PASS; Vitest 120/120; `npm audit` et `npm audit --omit=dev` 0 vulnérabilité; `git diff --check` PASS. Démarrage Next dev Agharas sur `127.0.0.1:3002`; GET en lecture seule : 13 routes principales HTTP 200, route produit inconnue journalisée 404 (le client HTTP a interrompu la lecture de cette réponse). La vérification Chromium n'a pas démarré, car l'exécutable Playwright n'est pas installé. Build production, suites E2E/acceptance et workflows interactifs non exécutés : la cible `.env` est la base locale `agharas` sans schéma isolé confirmé; aucune écriture, migration, seed ou reset n'a été lancé. Aucun bug applicatif n'a été reproduit par ces contrôles; cela ne constitue pas une validation navigateur ni une approbation de livraison. Prochaines étapes : fournir un Chromium local approuvé et une base/schema synthétique dédiée, puis rejouer build/E2E/acceptance et les vérifications optiques/fichiers. Bloqueurs professionnels et contenus métier restent documentés. Rapports : [`FINAL_DELIVERY_DEFECT_REGISTER.md`](FINAL_DELIVERY_DEFECT_REGISTER.md), [`FINAL_CLIENT_DELIVERY_REPORT.md`](FINAL_CLIENT_DELIVERY_REPORT.md), [`CLIENT_HANDOVER_GUIDE_FR.md`](CLIENT_HANDOVER_GUIDE_FR.md). Aucun changement d'application ni de données métier effectué dans cette session.

> **5 novembre 2026 — Préparation technique staging (état avant la remédiation dépendances ci-dessous) : LOCALE PASSÉE / STAGING DISTANT BLOQUÉ.** Backup PostgreSQL custom (`agharas/public`) vérifié, restauré dans `agharas_clone_20261104_a`; agrégats de produits/variantes/commandes/lignes/stock/mouvements préservés. Rehearsal réussi, puis migration optique additive appliquée au seul schéma de développement local; statut up to date et 0 règle créée. Les 9 produits actifs marqués compatibles/19 variantes locales restent en attente de décisions exactes par opticien. Stockage filesystem séparé public/privé + backend S3-compatible préparé; chemins de prod validés, mais volume/bucket distant, policy/chiffrement/rétention/backup non configurés. Transport SMTP TLS préparé avec sink discard non transmetteur pour tests/staging; aucun workflow e-mail existant ni provider configuré. À cette date l'audit initial était de **8 avis (3 high, 5 moderate)**; la phase de remédiation ci-dessous l'a ramené à zéro. TypeScript PASS; Vitest 110/110; build PASS; E2E 36/36; acceptation 41/41; migration clone/local PASS. Verdict : **NOT READY — BLOCKERS REMAIN** (domaine/secrets/hébergement, monitoring, rétention, données business et approbation optique manquants). Détails : [`docs/TECHNICAL_STAGING_PREPARATION.md`](TECHNICAL_STAGING_PREPARATION.md) et [`docs/OWNER_UAT_AND_STAGING_READINESS.md`](OWNER_UAT_AND_STAGING_READINESS.md).
> **5 novembre 2026 — Remédiation sécurité dépendances : COMPLETE / audits propres.** L'audit initial montrait 3 lignes HIGH mais une seule GHSA distincte (deepmerge-ts GHSA-ggr8-5vv4-36mx), plus un advisory fflate modéré propagé sur la toolchain Vinext. Overrides ciblés `@prisma/config → deepmerge-ts@8.0.0` et `fflate@0.7.5`; Prisma/Client maintenus à 6.19.3, sans schema/migration/major upgrade. Final `npm audit --omit=dev`: 0; `npm audit`: 0. Prisma validate/typecheck PASS; Vitest 110/110; build PASS; E2E 36/36; acceptance 41/41 sur schémas isolés synthétiques; optical, guest checkout COD, stock/idempotency couverts. Rapport : [`docs/DEPENDENCY_SECURITY_REMEDIATION.md`](DEPENDENCY_SECURITY_REMEDIATION.md). Le staging reste **NOT READY — BLOCKERS REMAIN** pour ses blockers externes déjà consignés; aucune mise en production.
> **5 novembre 2026 — Préparation infrastructure hébergée : LOCALE PASSÉE / HÉBERGEMENT BLOQUÉ.** Adaptateurs filesystem/S3 privés-publics, téléchargement ordonnance owner-only/no-store, SMTP/discard, runtime guard et revalidation de cache déjà présents. Corrections locales: erreurs backend stockage ne sont plus masquées comme 404, contrôle taille sur octets lus, header staging noindex (non équivalent à contrôle d'accès), diagnostic checkout JSON minimal avec operationId sans sérialiser message/données. Storage 5/5, email discard 3/3, TypeScript PASS, Vitest 113/113, build PASS, E2E 36/36, acceptance 41/41 sur schémas synthétiques isolés. Aucun provider S3, SMTP, monitoring, hébergement ou backup distant n'a été provisionné/testé; notifications client/propriétaire absentes, rétention/RPO/RTO et gate d'accès staging en attente. Verdict inchangé : **NOT READY — BLOCKERS REMAIN**. Détails : [`docs/HOSTED_INFRASTRUCTURE_READINESS.md`](HOSTED_INFRASTRUCTURE_READINESS.md).
> **5 novembre 2026 — Préparation infrastructure hébergée : LOCALE PASSÉE / HÉBERGEMENT BLOQUÉ.** Adaptateurs filesystem/S3 privés-publics, téléchargement ordonnance owner-only/no-store, SMTP/discard, runtime guard et revalidation de cache déjà présents. Corrections locales: erreurs backend stockage ne sont plus masquées comme 404, contrôle taille sur octets lus, header staging noindex (non équivalent à contrôle d'accès), diagnostic checkout JSON minimal avec operationId sans sérialiser message/données. Storage 5/5, email discard 3/3, TypeScript PASS, Vitest 113/113, build PASS, E2E 36/36, acceptance 41/41 sur schémas synthétiques isolés. Aucun provider S3, SMTP, monitoring, hébergement ou backup distant n'a été provisionné/testé; rétention/RPO/RTO et gate d'accès staging en attente. Verdict inchangé : **NOT READY — BLOCKERS REMAIN**. Détails : [`docs/HOSTED_INFRASTRUCTURE_READINESS.md`](HOSTED_INFRASTRUCTURE_READINESS.md).
> **5 novembre 2026 — Notifications commande par e-mail : LOCALES / SMTP NON VÉRIFIÉ.** Outbox transactionnelle ajoutée dans la même transaction que la commande; livraison après commit; déduplication owner/customer par commande, retries explicites pour échecs via owner et replay idempotent. Modèles français; confirmation client désactivée par défaut; owner notice vers `OWNER_EMAIL`; aucune ordonnance/donnée correction jointe. TypeScript PASS, Vitest 118/118, build PASS, E2E 36/36, acceptance 41/41 avec discard/mock uniquement. SMTP réel/provider, domaine expéditeur, SPF/DKIM/DMARC et décisions métier de copie/destinataires restent bloquants. Détails : [`docs/ORDER_EMAIL_NOTIFICATIONS.md`](ORDER_EMAIL_NOTIFICATIONS.md).
> **5 novembre 2026 — Inventaire et vérification fonctionnelle locale : BASELINE VÉRIFIÉE / BLOQUEURS MÉTIER-PROFESSIONNEL.** Inventaire préalable avec classifications A–G : [`docs/COMPLETE_FUNCTIONAL_INVENTORY.md`](COMPLETE_FUNCTIONAL_INVENTORY.md). TypeScript PASS; Vitest 120/120; build production + E2E 36/36; acceptance 41/41 sur schémas synthétiques isolés; test navigateur optique ciblé 1/1; stockage/e-mail local 20/20 (transport discard uniquement). Corrections : retour persistant du statut exact optique, recherche/filtrage/pagination des décisions enregistrées, exemples optiques accueil issus des prix en base, coupons arbitraires retirés des promotions accueil. Aucun compte client réintroduit, aucune décision optique ni valeur commerciale inventée, aucune connexion hébergée/déploiement/e-mail réel/paiement en ligne. Verdict : **baseline locale vérifiée, mais commerce de verres correcteurs bloqué par l’approbation d’un professionnel; copies commerciales/légales et promesse newsletter à valider par le propriétaire.** Le cycle navigateur d’upload valide/relecture ordonnance reste non vérifié car la combinaison synthétique en attente est correctement bloquée; aucune fausse approbation ajoutée pour contourner le contrôle. Rapport : [`docs/FUNCTIONAL_COMPLETION_REPORT.md`](FUNCTIONAL_COMPLETION_REPORT.md). Aucun schéma métier/dev réinitialisé.

> **4 novembre 2026 — Audit performance isolé : comparaison développement/production terminée.** Schéma synthétique dédié `agharas_test.agharas_perf_20261104_a`, sans écriture dans `agharas/public`. Mesures navigateur répétées : accueil 1 360 ms médiane en développement / 411 ms en production ; catalogue 1 477 / 531 ms ; fiche produit 1 430 / 506 ms ; clic accueil → catalogue 3 136 / 384 ms. Les premiers accès de développement ajoutent aussi la compilation des routes. Les requêtes Prisma sondées sont généralement de 0 à 7 ms : aucune cause SQL dominante confirmée et aucun correctif métier spéculatif appliqué. Vérification : TypeScript PASS, Vitest 90/90, build production PASS, E2E 36/36, acceptation 41/41, sans échec/skip/timeout aux exécutions finales. La navigation de production et la commande invitée COD ont passé ; les préchargements RSC annulés lors des navigations rapides ne bloquent pas les destinations. L'expérience de développement reste plus lente que la production optimisée ; aucune mesure de charge réseau réelle n'a été faite. Rapport : [`docs/PERFORMANCE_RUNTIME_AUDIT.md`](PERFORMANCE_RUNTIME_AUDIT.md).

> **3 novembre 2026 — Stabilisation navigation/commande : ACCEPTED — VERIFIED (périmètre de stabilisation, sans déclaration de préparation à la production).** TypeScript PASS, Vitest 90/90, build de production PASS, E2E complet 36/36, ciblé checkout/navigation 8/8 et audit complet 41/41 sans échec ni test ignoré. Vérifications navigateur sur schémas isolés frais; aucun reset du schéma de développement. Le déclencheur exact de l'ancienne annulation RSC intermittente reste inconnu, mais aucun gel de destination n'a été reproduit dans ces campagnes. Détails et journaux : [`docs/NAVIGATION_CHECKOUT_STABILIZATION.md`](NAVIGATION_CHECKOUT_STABILIZATION.md).

> **WhatsApp officiel : terminé et vérifié.** Le numéro **+212 628-889950** (`212628889950`, `https://wa.me/212628889950`) est centralisé dans `store.whatsapp`, modifiable par le propriétaire dans « Paramètres de la boutique », validé côté serveur et propagé sur toutes les surfaces publiques avec des messages français encodés, sans ordonnance ni donnée personnelle. Typecheck/build réussis, Vitest 90/90, E2E 31/31, acceptation 41/41.

> **Compatibilité optique : implémentation partielle, non acceptée.** Modèle de décision exacte, écran propriétaire et contrôles serveur ajoutés ; migration appliquée uniquement aux schémas de test. Typecheck/build réussis, Vitest 90/90, E2E 31/31, acceptation 41/41. Des tests de concurrence, paniers périmés et administration restent nécessaires ; voir `docs/OPTICAL_COMPATIBILITY_ENGINE_ACCEPTANCE.md`.

> **Vérification ciblée : partielle.** Parcours produit créé → commande invitée → modification → archivage vérifié, sans modification de l'instantané historique. Typecheck/build réussis ; Vitest 90/90, E2E 31/31, acceptation 41/41, aucun test ignoré. Les statuts de compatibilité détaillés et leur contrôle serveur restent **partiellement implémentés** ; voir `docs/OPTICAL_COMPATIBILITY_REVIEW.md` et `docs/OWNER_ADMIN_CMS_FINAL_ACCEPTANCE.md`.

> **Phase de clôture CMS : partiellement terminée.** Sélection des catégories et ordre réel des sections ajoutés. Vérification : typecheck/build réussis, Vitest 90/90, E2E 31/31, acceptation 41/41, aucun test ignoré. Les compatibilités détaillées monture/traitement et la simplification des données historiques de test restent à réaliser ; aucune règle médicale n'a été inventée. Voir `docs/OWNER_ADMIN_CMS_FINAL_ACCEPTANCE.md`.

> **29 octobre 2026 — mise à jour prioritaire :** l'adaptation propriétaire/CMS est en cours et n'est pas prête pour la production. Les anciens résultats et statuts ci-dessous décrivent une version précédente. Voir `docs/OWNER_ADMIN_CMS_IMPLEMENTATION.md` pour les changements, les résultats vérifiés et les limites actuelles.

> Dernière vérification contrôlée : typecheck et build réussis, Vitest 80/80, E2E 31/31, acceptation 34/34, sans tests ignorés. Les suites navigateur utilisent des schémas synthétiques distincts ; aucun reset de base existante n'a été effectué. Le périmètre demandé reste partiellement réalisé, notamment pour les compatibilités optiques et certains contrôles CMS ; voir `docs/OWNER_ADMIN_CMS_FINAL_ACCEPTANCE.md`.

Dernière mise à jour : **28 octobre 2026**

> **Statut global : fonctionnel et testé, mais PAS prêt pour la production.**
> Le périmètre fonctionnel demandé est implémenté et couvert par des tests
> automatisés. Les points bloquants restants sont des prérequis métier,
> légaux et d'exploitation (logo officiel, e-mails transactionnels, contenus
> légaux réels, politique de rétention des ordonnances, migrations versionnées),
> listés en [§5](#5-bloquants-avant-mise-en-production).

---

## 1. Légende

| Statut | Signification |
| --- | --- |
| ✅ Terminé | Livré, vérifié (typecheck/build/tests) |
| 🟡 Terminé avec réserve | Fonctionnel, mais une limite documentée subsiste |
| ⛔ Bloqué | Dépend d'une décision, d'un actif ou d'un accès externe |

---

## 2. Synthèse par jalon

| Jalon | Périmètre | Statut | Preuve principale |
| --- | --- | --- | --- |
| M0 | Inventaire des exports Stitch, cartographie écrans → routes | ✅ | `docs/STITCH_DESIGN_INVENTORY.md` |
| M1 | Socle Next.js/TypeScript/Tailwind, schéma Prisma, seed | ✅ | 35 modèles, 13 énumérations ; `npm run db:seed` |
| M2 | Design system (tokens, typographie, composants) et layouts | 🟡 | Fidélité reconstruite depuis `code.html` ; captures non analysables |
| M3 | Vitrine : accueil, catalogue, produit, pages de contenu | ✅ | E2E `smoke.spec.ts` |
| M4 | Configurateur de verres, panier, favoris | ✅ | E2E smoke + compte |
| M5 | Commande COD, stock, snapshots, confirmation | ✅ | E2E `checkout.spec.ts`, test d'intégration |
| M6 | Authentification, espace client, adresses, ordonnances | ✅ | E2E `account.spec.ts` |
| M7 | Ordonnances : stockage privé, contrôle d'accès, audit | 🟡 | Route privée testée ; purge/retention non automatisée |
| M8 | Back-office, RBAC, transitions de commandes, audit | ✅ | E2E `admin.spec.ts` |
| M9 | SEO, pages 404/erreur, en-têtes de sécurité, responsive | 🟡 | `robots.txt`/`sitemap.xml` testés ; pas de CSP stricte ni audit axe |
| M10 | Tests automatisés et corrections issues des campagnes | ✅ | 80 tests Vitest, 34 tests Playwright |
| M11 | Documentation et outillage de déploiement | 🟡 | README + 7 documents `docs/` + Compose ; Docker non validé localement |

---

## 3. Détail des jalons

### M0 — Cadrage et inventaire Stitch ✅

- 15 écrans d'export Stitch inventoriés (accueil, catalogue, fiche produit,
  configurateur, panier, commande, compte, back-office, pages éditoriales).
- Correspondance écran → route, actifs réutilisés, écarts et limites consignés.
- Fichiers d'export d'origine laissés **intacts** dans
  `stitch_agharas_vision_optical_e_commerce/`.
- 30 visuels Stitch valides copiés dans `public/images/stitch/` avec manifeste ;
  13 visuels corrompus (HTML servi à la place du binaire) retirés et documentés.

### M1 — Socle technique et données ✅

- Next.js 15 App Router, React 19, TypeScript strict
  (`noUncheckedIndexedAccess`), Tailwind 4, Prisma 6, Zod, bcryptjs.
- Schéma : **35 modèles**, **13 énumérations** (`prisma/schema.prisma`),
  montants en **centimes entiers** (`Int`), snapshots de commande conservés.
- Seed de démonstration : 12 produits, 6 catégories, 5 marques, catalogue de
  verres, 3 modes de livraison, coupon `CERCLE10`, rôles/permissions, pages de
  contenu, FAQ, salons, réglages, commande livrée `AVO-2026-0001`.
- Scripts npm : `dev`, `build`, `start`, `typecheck`, `test`, `test:e2e`,
  `db:*`.

### M2 — Design system et layouts 🟡

- Tokens de marque appliqués : vert profond `#2E4243`, or `#CFB56A`, blanc,
  blanc cassé `#F7F8F6`.
- En-tête, méga-navigation, menu mobile, pied de page, primitives de bouton,
  formulaires, cartes produit, fil d'Ariane.
- **Réserve** : les captures PNG des exports ne peuvent pas être ingérées par
  l'agent ; la fidélité a été reconstruite depuis le HTML (`code.html`) de
  chaque écran. Aucune comparaison pixel n'a été effectuée.
- **Logo** : aucun fichier logo fourni. Le logotype typographique Stitch
  (« AGHARAS VISION OPTIQUE » + « Haute Lunetterie ») est conservé tel
  quel ; aucun logo n'a été inventé.

### M3 — Vitrine ✅

- `/` (sélections, nouveautés, services, bannières pilotées en base).
- `/catalogue` : filtres type/genre/forme/prix, tri, recherche, pagination.
- `/catalogue/[slug]`, `/produit/[slug]` (variantes, galerie, JSON-LD).
- `/livraison`, `/retours`, `/confidentialite`, `/cgv`, `/mentions-legales`,
  `/a-propos` rendues depuis `ContentPage` (corps en texte simple).
- `/contact`, `/faq`, `/boutiques` avec coordonnées explicitement fictives.

### M4 — Configurateur, panier, favoris ✅

- Configurateur de verres en 4 étapes (type, indice, traitements, ordonnance),
  prix calculé en centimes et enregistré en snapshot JSON sur la ligne de panier.
- Panier invité ou connecté (cookie `httpOnly`), fusion au moment de la
  connexion ; favoris selon le même principe.
- Coupon `CERCLE10` validé côté serveur ; seuil de livraison offerte.
- **Réserve** : `Coupon.perCustomerLimit` existe au schéma mais n'est **pas**
  appliqué ; seule la limite globale `usageLimit` est contrôlée.

### M5 — Commande et confirmation ✅

- Commande uniquement en **paiement à la livraison** ; CMI reste marqué
  indisponible et est forcé à `false` côté serveur.
- Transaction : vérification du stock, décrément conditionnel, mouvements
  d'inventaire, création de la commande et de ses snapshots, idempotence par
  `idempotencyKey`.
- Confirmation accessible au propriétaire connecté ou via un jeton d'accès non
  devinable ; page `noindex` et `no-store`.
- Annulation admin : restitution du stock avec mouvement `CANCELLATION`
  (utilisé aussi par le nettoyage E2E).

### M6 — Authentification et espace client ✅

- Sessions opaques en base : jeton 256 bits, **haché SHA-256** stocké, cookie
  `httpOnly` + `SameSite=Lax` + `Secure` en production, 30 jours.
- Mots de passe bcrypt (coût 12), politique de longueur, limitation de débit en
  mémoire sur connexion/inscription/contact/newsletter/commande/réinitialisation.
- `/compte` : tableau de bord, commandes, adresses, ordonnances, profil ;
  autorisation objet sur chaque ressource.
- Réinitialisation de mot de passe : jeton à usage unique ; **aucun e-mail
  n'est envoyé** (lien affiché uniquement en développement).

### M7 — Ordonnances 🟡

- Stockage **hors `public/`** (`./storage/ordonnances`), permissions `0600`,
  validation par signature binaire (PDF/JPEG/PNG/HEIC), 10 Mo max.
- Téléchargement via `/api/ordonnances/[id]` : propriétaire ou permission
  `prescriptions.view`, `Content-Disposition: attachment`, `nosniff`,
  `no-store` ; accès staff journalisé.
- **Réserve bloquante** : aucune purge/rétention automatisée. La suppression est
  manuelle (client ou staff). À cadrer avec le CNDP avant production.

### M8 — Back-office et RBAC ✅

- `/admin` hors du groupe `(site)`, navigation sombre dédiée, vue « accès
  refusé » pour un compte sans aucune permission admin.
- Modules : tableau de bord, produits, stock, commandes, ordonnances, clients,
  promotions, contenu, messages, paramètres, utilisateurs, rôles, audit.
- Permissions `module.action` avec wildcards (`products.*`), super-admin, refus
  par défaut ; `requirePermission` sur chaque page et chaque action.
- Transitions de commande : `PENDING → CONFIRMED | CANCELLED`,
  `CONFIRMED → IN_PRODUCTION | CANCELLED`,
  `IN_PRODUCTION → SHIPPED | CANCELLED`, `SHIPPED → DELIVERED`.
- Réglages : `payment.online_enabled` forcé à `"false"` et
  `payment.cod_enabled` forcé à `"true"`, quel que soit le formulaire.
- `canGrantPermissions` tient compte des wildcards (pas d'élévation de
  privilèges par attribution de rôle).

### M9 — SEO, accessibilité, sécurité HTTP, responsive 🟡

- Métadonnées par page, canoniques, Open Graph, JSON-LD produit, `robots.txt`,
  `sitemap.xml`, pages 404/500 en français.
- En-têtes : `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`, `poweredByHeader: false`.
- Responsive vérifié en 390 / 768 / 1440 px (absence de débordement
  horizontal), lien d'évitement et navigation clavier sur les parcours clés.
- **Réserves** : pas de CSP stricte, pas de HSTS (à poser au reverse proxy), pas
  d'audit automatisé axe, pas de MFA staff.

### M10 — Tests ✅

Voir [§4](#4-preuves-de-vérification). Les campagnes E2E ont révélé et permis de
corriger deux régressions :

1. menu mobile replié mais toujours cliquable (`hidden` vs `flex`) ;
2. absence de retour visuel du formulaire de statut admin après une transition
   terminale.

Le nettoyage des images a également supprimé toutes les erreurs Next Image des
campagnes précédentes.

### M11 — Documentation et déploiement 🟡

- Documents livrés : `README.md`, `docs/ARCHITECTURE.md`,
  `docs/DATABASE_DESIGN.md`, `docs/SECURITY.md`, `docs/TESTING.md`,
  `docs/DEPLOYMENT.md`, `docs/STITCH_DESIGN_INVENTORY.md`, ce document.
- `docker-compose.yml` (PostgreSQL 16) + `docker/initdb/01-create-test-db.sql`
  pour créer `agharas` et `agharas_test`.
- `.env.example` documente toutes les variables ; `.gitignore` couvre
  `.next`, les fichiers d'environnement, `storage/`, les artefacts Playwright et
  les états d'authentification E2E.
- **Réserve** : Docker n'est pas installé sur la machine de développement ; le
  Compose n'a donc pas été exécuté ici. Les migrations versionnées ne sont pas
  encore générées (`prisma db push` a été utilisé).

---

## 4. Preuves de vérification

Dernière exécution complète : **29 octobre 2026**.

| Commande | Résultat | Détail |
| --- | --- | --- |
| `npx tsc --noEmit` | ✅ | Aucune erreur TypeScript |
| `npm test` | ✅ | **11 fichiers, 90 tests** (84 unitaires + 6 intégration) |
| `npm run build` | ✅ | Build de production Next.js réussi |
| `npm run test:e2e` | ✅ | **31/31 tests** Playwright (6 specs + setup), build de production, port 3100 |
| `npm run test:audit` | ✅ | **41/41 tests** d'acceptation sur schéma isolé, serveur `next start` port 3100 |

Détail Vitest (dernière exécution) :

| Fichier | Tests |
| --- | --- |
| `tests/unit/money.test.ts` | 7 |
| `tests/unit/pricing.test.ts` | 19 |
| `tests/unit/validation.test.ts` | 16 |
| `tests/unit/permissions.test.ts` | 12 |
| `tests/unit/content.test.ts` | 10 |
| `tests/unit/orders.test.ts` | 5 |
| `tests/unit/utils.test.ts` | 5 |
| `tests/unit/home-layout.test.ts` | 3 |
| `tests/unit/whatsapp.test.ts` | 5 |
| `tests/unit/optical-compatibility.test.ts` | 2 |
| `tests/integration/order-snapshot.test.ts` | 6 |

Les campagnes E2E nécessitent une base seedée et le port 3100 libre ; elles
reconstruisent l'application avant de servir. Voir `docs/TESTING.md` pour les
prérequis et le nettoyage.

---

## 5. Bloquants avant mise en production

| # | Bloquant | Impact | Action requise | Responsable |
| --- | --- | --- | --- | --- |
| 1 | Logo officiel absent | Image de marque non conforme | Fournir le fichier SVG/PNG haute résolution | Propriétaire |
| 2 | Aucun transport e-mail | Réinitialisation de mot de passe et notifications inutilisables en production | Brancher un fournisseur SMTP/API + modèles d'e-mails | Équipe technique |
| 3 | Contenus légaux et coordonnées fictifs | Risque juridique (ICE/RC/IF, adresses, téléphones) | Fournir les mentions réelles, CGV et politique de confidentialité validées | Propriétaire / juriste |
| 4 | Pas de rétention automatisée des ordonnances | Non-conformité données de santé (CNDP) | Définir la durée, implémenter purge planifiée + journal | Équipe technique / DPO |
| 5 | Migration optique non appliquée à la base de développement | Les chemins admin/panier/commande optiques échouent sur cette base | Sauvegarder, relire et appliquer `20261029130000_optical_compatibility` | Équipe technique |
| 6 | Comptes de démonstration seedés | Faille si conservés | Supprimer/renommer les comptes, secrets réels, `AUTH_SECRET` neuf | Exploitation |
| 7 | Images Stitch manquantes (13) | Certaines pages utilisent des visuels alternatifs | Fournir des visuels définitifs | Propriétaire / direction artistique |
| 8 | Pas de CSP stricte ni HSTS | Durcissement HTTP incomplet | Définir CSP (nonce) et HSTS au reverse proxy | Équipe technique |
| 9 | Docker Compose non validé localement | Risque d'écart au déploiement | Exécuter `docker compose up` sur un poste/CI disposant de Docker | Équipe technique |

### Dettes techniques non bloquantes

- `Coupon.perCustomerLimit` non appliqué (seule `usageLimit` l'est).
- Limitation de débit en mémoire : mono-instance uniquement.
- Pas de MFA pour les comptes staff.
- Pas d'audit axe automatisé ni de mesure Lighthouse continue.
- Aucun dépôt Git initialisé : tout le travail est sur disque, non versionné.
- Tarification CMI non intégrée (volontaire, paiement à la livraison seul).

---

## 6. Prochaines étapes recommandées

1. **Décisions propriétaire** : logo, coordonnées légales, contenus CGV/
   confidentialité, visuels manquants.
2. **Conformité** : politique de rétention des ordonnances + purge planifiée
   auditée.
3. **E-mails** : transport transactionnel, modèles FR, file d'attente/retries.
4. **Industrialisation** : `prisma migrate` versionné, CI (typecheck, tests,
   build, E2E), validation Docker, sauvegardes base + volume ordonnances.
5. **Durcissement** : CSP, HSTS, rate limit partagé, MFA staff, audit axe.
6. **Recette** : comparaison visuelle humaine avec les exports Stitch (non
   réalisable par l'agent), validation des parcours en 390/768/1440.

---

## 7. Journal

| Date | Événement |
| --- | --- |
| 29/10/2026 | Compatibilité optique exacte, interface propriétaire, contrôles serveur et WhatsApp officiel `+212 628-889950` intégrés. Vitest 90/90, E2E 31/31, acceptation 41/41 ; migration optique non appliquée à la base de développement. |
| 28/10/2026 | Implémentation MVP complète, 80 tests Vitest et 34 tests E2E verts, documentation livrée, nettoyage des images corrompues. |
