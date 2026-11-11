# AGHARAS VISION — Hostinger Business readiness

**État de cette préparation : 9 novembre 2026**

**Hébergement visé : Hostinger Business Web App Node.js / Next.js géré**
**Décision : aucune mise en ligne, migration vers un service externe, création de compte ou changement DNS n'a été fait.**

## Verdict global

## HOSTINGER BUSINESS READINESS PARTIAL

Le code, le build Node 22, les migrations sûres et un ZIP sélectif sont préparés. Le paquet est disponible à [`../dist/hostinger-business-package-20261109.zip`](../dist/hostinger-business-package-20261109.zip) (SHA-256 `55DA8D01B909D680D2BB1E2C973567F4743DC852E7D99D0A842612ECF05D22F2`). **Ce verdict ne signifie pas que Hostinger, Neon, SMTP, le stockage externe ou le domaine ont été provisionnés ou testés.** Une campagne fonctionnelle d'audit a aussi eu un timeout intermittent dans un test de configurateur/ordonnance après les autres tests; l'essai isolé du round-trip ordonnance a réussi, mais le test séquentiel reste à stabiliser.

## Résultats par domaine

| Domaine | Statut | Preuve / réserve |
| --- | --- | --- |
| Compatibilité Next.js / hPanel | **PASS — documentation vérifiée** | Docs Hostinger actuelles : Web App Business, preset Next.js SSR, Node 22, Git/ZIP, variables hPanel. Le propriétaire doit confirmer la version/quotas exacts de son offre Business dans hPanel. Aucun déploiement réel. |
| PostgreSQL / Neon | **REQUIRES OWNER CONFIGURATION** | PostgreSQL et Prisma 6.19.3 conservés; URL pooled runtime + `DIRECT_URL` direct/TLS documentées. Aucun compte, cluster, secret ou test Neon réel. |
| Sécurité des migrations Prisma | **PASS — synthétique local** | Garde-fou base/schéma/confirmation/sauvegarde/TLS, test unitaire, six migrations appliquées une fois à un nouveau schéma synthétique, statut ultérieur « up to date ». Aucun schéma business/demo modifié. |
| Médias publics | **PASS — paquet local** | Actifs versionnés dans `public/` inclus au ZIP; 45 fichiers publics. |
| Stockage privé | **PARTIAL / REQUIRES OWNER CONFIGURATION** | S3-compatible existant, chemins et séparation privé/public testés par mocks; round-trip ordonnance synthétique propriétaire/anonyme testé lors d'un essai ciblé. Bucket, politiques, chiffrement, rétention, sauvegarde et restauration réels non vérifiés. |
| Cron / tâches de fond | **PARTIAL** | Route POST Bearer, limites 2 commandes, arrêt fini, traitement ambigu `SENDING` sans renvoi automatique, journal minimal; tests route/batch. Aucun cron hPanel ni transport SMTP réel. |
| Authentification / sécurité | **PASS — vérifications locales ciblées** | 36/36 E2E Chromium, tests d'accès propriétaire, session/cookie, API privée, limites d'entrée et sécurité. Pas d'audit d'infrastructure ni de test Hostinger réel. |
| CMS propriétaire | **PASS — périmètre testé** | Écrans CMS et sauvegarde des réglages testés dans l'audit isolé; aucun pouvoir administrateur invité. |
| Checkout invité / COD | **PASS — tests synthétiques** | E2E 36/36, achat invité, recalcul prix, stock, idempotence/concurrence couverts; pas d'argent, de courrier ni de commande client réelle. |
| Sécurité optique | **PASS logiciel / APPROBATIONS REQUISES** | Progressive absent/refusé; PENDING/INCOMPATIBLE bloque; tests d'approbation `TEST ONLY` uniquement. Aucune approbation professionnelle ou décision clinique n'a été créée. |
| Performance | **PARTIAL — local uniquement** | Journaux de navigation Chromium de cette campagne : catalogue environ 0,65–0,82 s, fiche produit environ 0,51–0,58 s; machine locale, schéma synthétique, mesures non assimilables à Hostinger. L'audit précédent (4 nov. 2026) donnait en build local de production : accueil 411 ms, catalogue 531 ms, fiche produit 506 ms; voir [`PERFORMANCE_RUNTIME_AUDIT.md`](PERFORMANCE_RUNTIME_AUDIT.md). Aucune charge réelle ou métrique Hostinger. |
| Build production | **PASS — Node 22.23.0** | `npm ci`, Prisma validate/generate, TypeScript et `npm run build` passés dans une copie isolée; build SSR Next.js 15.5.28, Prisma 6.19.3. Build sans migrations ni seed. |
| Tests de régression | **PARTIAL** | Vitest **134/134**; Playwright E2E **36/36**; responsive **11/11** incluant 390/768/1024/1440; Playwright acceptance **43/44** au dernier lancement complet (un timeout d'interaction dans le round-trip ordonnance après tests précédents; le test a réussi seul avec chemins privés absolus). `npm audit` et `npm audit --omit=dev`: 0 vulnérabilité. |
| Paquet de déploiement | **PASS — contenu audité** | ZIP 2 565 417 octets, 215 entrées, six migrations, `public/` inclus; absence de `.env` local, secrets, `node_modules`, `.next`, captures/traces, uploads, dumps ou seed de démonstration vérifiée. La génération de fichier se fait sous `dist/`. |

## Conditions hPanel documentées (pas encore configurées)

- Framework Web App **Next.js** en mode serveur; racine `/`; npm; Node 22; build `npm run build`; sortie `.next` si demandée; aucun fichier d'entrée custom (Hostinger précise qu'il est ignoré pour Next.js). Le projet expose `npm run start` (`next start`); le preset géré Hostinger doit contrôler le processus.
- Les docs Hostinger indiquent actuellement pour Business/Unlimited jusqu'à 5 apps Node.js, NPROC 120/60 processus d'entrée et des requêtes limitées à 120 secondes; les ressources CPU/RAM/stockage sont celles du compte et doivent être confirmées par le propriétaire dans hPanel.
- Aucun VPS, Docker, PM2, Redis, worker permanent, WebSocket entrant, port fixe, PostgreSQL local, PHP, MySQL, export statique ou runtime Vercel n'est configuré.

## Vérifications effectuées

1. Installation `npm ci` dans une copie de vérification propre, avec Node 22.23.0 et seulement le schéma local synthétique sélectionné.
2. Validation Prisma, génération Client, typecheck, build production et suite Vitest.
3. Nouveau schéma vide `agharas_test.agharas_hostinger_readiness_20261109_02`; identité base/schéma confirmée avant migrations et seed synthétique; aucun reset ou mutation de `agharas_test.public` ni du schéma démo.
4. 36 scénarios E2E Chromium; 44 cas d'acceptation fonctionnelle/security lancés dans le nouveau schéma. Le dernier run complet a eu un timeout séquentiel isolé, documenté ci-dessus; le scénario ordonnance a ensuite été vérifié avec succès séparément. Pas de résultat externe simulé.
5. Vérification responsive Chromium à 390, 768, 1024 et 1440 px; `npm audit` complet et production; contenu du ZIP extrait en mémoire et contrôlé.
6. Le serveur de démo `http://127.0.0.1:3106/` et ses données ont été préservés. Aucun email ou paiement réel; pas de déploiement, compte externe ou DNS.

Les comptes, commandes, fixtures optiques et ordonnances créés par les essais n'existent que dans les schémas `agharas_test.agharas_hostinger_readiness_20261109_01` et `_02`. Les décisions optiques synthétiques sont marquées explicitement **TEST ONLY** et ne valent pas approbation.

## Étapes manuelles exactes avant lancement

1. **Propriétaire — Hostinger** : confirmer la variante/version Business, quotas, slot Node disponible, chemins de déploiement et accès Cron Jobs; créer le Web App après autorisation.
2. **Propriétaire — Neon** : créer projet/base/role PostgreSQL; décider région et plan; préparer sauvegarde/restauration; configurer `DATABASE_URL` pooled TLS et `DIRECT_URL` direct TLS pour la même base/schéma.
3. **Propriétaire — secrets** : renseigner dans hPanel les valeurs réelles de `.env.example` via son coffre; générer `AUTH_SECRET` et `CRON_SECRET`; définir le domaine officiel lorsqu'il est communiqué. Ne pas configurer `TEST_DATABASE_URL`, `SEED_*` ou `OWNER_PASSWORD` dans le runtime.
4. **Propriétaire — stockage** : sélectionner/provisionner un fournisseur S3 compatible, bucket privé, credentials least-privilege, chiffrement, versionnement/rétention, sauvegarde et exercice de restauration.
5. **Propriétaire — e-mail** : sélectionner le fournisseur SMTP et expéditeur; valider SPF/DKIM/DMARC, destinataires et contenus; tester en environnement autorisé avant `EMAIL_TRANSPORT=smtp`.
6. **Propriétaire — migration et owner** : vérifier sauvegarde, cible Neon et schéma; exécuter `npm run db:deploy` avec les confirmations temporaires décrites au guide; valider statut/schema/smoke tests; provisionner le propriétaire hors bande, supprimer ensuite le mot de passe ponctuel.
7. **Propriétaire — cron** : vérifier le chemin courant hbuilds, secret env-file, longueur ≤255 caractères, UTC et sortie; faire un essai discard; n'activer le rythme qu'après accord sur le workflow email.
8. **Propriétaire — domaine et publication** : autoriser explicitement DNS, HTTPS, indexation et lancement; tester sur le domaine réel. Aucun domaine n'est présumé.
9. **Entreprise/conseil — validations métier et légales** : finaliser identité commerciale, adresse, CGV/confidentialité/retours, politique de rétention des ordonnances, capacité d'expédition et consentements.
10. **Professionnel optique qualifié** : enregistrer les décisions exactes autorisées pour chaque combinaison avant les ventes correctrices. Ne pas considérer les fixtures de test comme décisions. Garder uniquement COD jusqu'à autorisation séparée d'un moyen de paiement réel.

Voir [`HOSTINGER_BUSINESS_DEPLOYMENT_FR.md`](HOSTINGER_BUSINESS_DEPLOYMENT_FR.md) pour le guide détaillé et [`HOSTINGER_BUSINESS_CHECKLIST_FR.md`](HOSTINGER_BUSINESS_CHECKLIST_FR.md) pour la liste de lancement.
