# Liste de contrôle — Hostinger Business / AGHARAS VISION

À compléter avec le propriétaire. **Aucune case d'infrastructure distante n'est pré-cochée.** Le paquet local n'autorise pas un déploiement.

## Avant déploiement

- [ ] Confirmer que le compte est bien le plan Business Web Hosting et relever dans hPanel sa version, sa région, slots Node, limites CPU/RAM/processus, Cron Jobs et stockage.
- [ ] Obtenir l'autorisation explicite de créer une Web App et confirmer le vrai domaine; ne pas inventer de domaine ni changer DNS sans accord.
- [ ] Choisir GitHub privé ou ZIP. Vérifier le commit/ZIP exact et garder le paquet de récupération.
- [ ] Vérifier le preset : Next.js SSR, racine `/`, Node 22, npm, build `npm run build`, `.next` si requis, entrée vide/non applicable.
- [ ] Configurer les seules variables nécessaires avec des secrets indépendants; ne pas exposer de secret en `NEXT_PUBLIC_*`.
- [ ] Vérifier qu'aucune variable `TEST_DATABASE_URL`, `SEED_*`, `OWNER_PASSWORD`, donnée de démonstration ou fichier `.env` de développeur n'est présente.

## Base Neon / Prisma

- [ ] Projet Neon créé par le propriétaire; région et offre confirmées.
- [ ] `DATABASE_URL` utilise le pooler Neon (`-pooler`), TLS et paramètres Prisma documentés.
- [ ] `DIRECT_URL` est non poolée, TLS, même base et même schéma.
- [ ] Sauvegarde avant migration prise et restauration vérifiée; statut des migrations inspecté.
- [ ] Confirmer précisément base, schéma, environnement, nombre/périmètre des migrations et variable d'autorisation; exécuter `npm run db:deploy` une seule fois.
- [ ] Confirmer six migrations présentes et statut `up to date`; smoke test sans seed/reset.
- [ ] Créer le propriétaire hors bande; retirer le secret de provisionnement à usage unique.

## Fichiers / e-mail / tâches

- [ ] Bucket S3 compatible privé, credentials minimaux, chiffrement, versionnement, backups et rétention configurés.
- [ ] Vérifier qu'aucune ordonnance n'est publiquement accessible et qu'une restauration autorisée fonctionne.
- [ ] Politique de conservation/suppression des ordonnances approuvée par le propriétaire.
- [ ] Fournisseur SMTP et expéditeur autorisés; SPF/DKIM/DMARC configurés; destinataire discard/mock vérifié d'abord.
- [ ] SMTP réel activé uniquement après test explicitement autorisé; aucun corps d'ordonnance en e-mail.
- [ ] Cron : commande Node 22, `--env-file`, chemins hbuilds actuels, UTC, limite 255 caractères, secret Bearer (pas query string), sortie et temps d'exécution vérifiés.
- [ ] `CRON_SECRET` indépendant, aléatoire, jamais dans logs/URL; traitement discard vérifié; revue manuelle des lignes `AMBIGUOUS_SENDING` définie.

## Lancement et supervision

- [ ] Domaines/DNS/HTTPS exécutés par le propriétaire après autorisation.
- [ ] `NEXT_PUBLIC_SITE_URL` correspond exactement à l'origine HTTPS officielle avant le build.
- [ ] Identité **AGHARAS VISION**, logo approuvé et adresse `N° 13 Imm 08 , Lot 4 Al kheir,Cité Essalam,AGADIR` vérifiés.
- [ ] Textes légaux, prix, frais/livraison, retours, contacts et consentements validés par l'entreprise/conseil.
- [ ] Pages sitemap, robots, canonical/OG et indexation contrôlés; staging reste `noindex` et protégé par une vraie autorisation si nécessaire.
- [ ] Smoke tests publics, CMS owner-only, checkout invité et COD; prix recalculés côté serveur; commandes doublées et stock contrôlés.
- [ ] Téléchargement ordonnance owner-only, cache `no-store`, aucune URL publique; logs examinés pour données personnelles.
- [ ] Responsive vérifié sur Chromium à 390/768/1024/1440; erreurs build/runtime et métriques Hostinger archivées.
- [ ] Plan de backup base/objets, RPO/RTO, exercice de restauration, procédure de retour code/schema et contact d'escalade documentés.
- [ ] Aucun Progressive/ADD/EP réintroduit; PENDING et INCOMPATIBLE bloquent; approbation professionnelle exacte requise; aucun paiement en ligne activé sans approbation séparée.
- [ ] Approbation écrite de publier et rendre indexable obtenue.

## Autorisations externes à ne pas confondre avec « Package prêt »

- [ ] Création app Hostinger
- [ ] Création Neon et credentials
- [ ] Provisionnement storage
- [ ] Configuration fournisseur e-mail
- [ ] Domaine, DNS et HTTPS
- [ ] Contenus et conformité business/légale
- [ ] Approbations optiques professionnelles
- [ ] Test de fumée réel post-déploiement et décision finale du propriétaire
