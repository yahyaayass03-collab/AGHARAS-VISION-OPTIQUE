# Dossier de revue et d’acceptation finale — AGHARAS VISION OPTIQUE

**Document de revue — 8 novembre 2026**  
**Environnement concerné :** démonstration locale `http://127.0.0.1:3106/`  
**État :** prêt pour examen et décisions écrites du propriétaire et d’un opticien qualifié. **Aucune approbation n’est présumée ou déjà accordée par ce document.**

## Objet et précautions

Ce dossier résume ce qui a été vérifié techniquement et ce qui nécessite encore une décision humaine. Il ne vaut ni recette signée, ni approbation clinique, ni validation juridique ou autorisation de mise en vente.

- La démo actuelle est conservée pour présentation. **Ne pas créer, modifier ou supprimer de données métier dans sa base** pendant la revue.
- Les essais antérieurs ont utilisé deux schémas synthétiques distincts dans `agharas_test`. Les règles optiques approuvées par les tests sont explicitement **TEST ONLY** et ne sont pas des décisions d’opticien.
- Pour toute recette avec écriture, utiliser uniquement un environnement jetable/synthétique identifié et vérifié avant l’essai. Ne pas utiliser de vrais clients, ordonnances, e-mails ou paiements.
- Le rapport détaillé et les preuves sont dans [`COMPLETE_FINAL_FUNCTIONAL_AUDIT.md`](COMPLETE_FINAL_FUNCTIONAL_AUDIT.md). Résultats automatisés : Vitest 122/122, E2E 36/36, acceptance 44/44. Ils attestent des comportements logiciels testés, pas d’une approbation métier exhaustive.

## 1. Éléments techniquement vérifiés

Les points ci-dessous ont fonctionné dans l’application locale et/ou dans les essais synthétiques documentés :

- Parcours publics principaux, recherche et états sans résultat du catalogue, fiche produit et réponse 404 d’un produit absent.
- Panier invité : ajout, quantité, persistance après actualisation, retrait et mise à jour du total; favoris invités persistants.
- Commande invitée au paiement à la livraison : validation côté serveur, calcul des montants, anti-double-soumission et mouvement de stock. Aucun paiement réel ni envoi réel n’a eu lieu.
- Authentification propriétaire, accès aux routes d’administration, CRUD produit et image couvert par l’acceptance, stock, commandes et permissions.
- Création/affectation de catégorie et marque; propagation vérifiée dans le catalogue.
- Modifications de prix d’options optiques, seuil et mode de livraison, FAQ, salon et page CMS : persistance et propagation constatées dans les schémas d’essai; valeurs temporaires restaurées.
- Ordonnances synthétiques : validation, stockage privé et accès autorisé/refusé selon les tests. Cela ne valide pas une politique de conservation.
- Compatibilité optique exacte : une combinaison sans décision correspondante reste bloquée; les états incompatibles/en attente sont refusés; les cas acceptés par les tests sont synthétiques uniquement.
- E-mail de commande : lignes d’outbox, affichage et retry exercés avec transport **discard**; aucun e-mail n’a été remis à un destinataire réel.
- Contrôles responsive sélectionnés à 390, 768, 1024 et 1440 px. L’audit n’est pas un test complet d’accessibilité ni un clic manuel de chaque commande de l’administration.

## 2. Checklist du propriétaire

À utiliser comme revue d’acceptation, avec les données et informations que l’entreprise a elle-même approuvées. Inscrire `À corriger`, `À décider` ou `Sans objet` au lieu de valider un élément inconnu.

### Boutique et expérience client

- [ ] Le nom, le logo/identité, les menus, les coordonnées, les liens de contact et WhatsApp sont exacts et autorisés.
- [ ] Les pages d’accueil, catégories mises en avant, produits vedettes, bannières, textes, boutons et liens représentent l’offre réelle.
- [ ] Les vues mobile et ordinateur sont acceptables; les chemins catalogue → produit → panier → commande sont compréhensibles.
- [ ] Les pages de livraison, retours, garanties, confidentialité, CGV et mentions légales sont relues par les personnes compétentes et approuvées.
- [ ] L’absence actuelle de formulaire newsletter est comprise. Toute future promesse d’inscription, de remise ou de désabonnement est validée avant activation.

### Catalogue, produits, prix et images

- [ ] Chaque produit réel a un nom, une description, une marque, une catégorie, un type et des attributs exacts.
- [ ] Les prix, prix barrés, taxes et éventuelles promotions sont exacts, autorisés et cohérents entre catalogue, fiche, panier et commande.
- [ ] Les variantes, références SKU, couleurs, compatibilité optique annoncée et disponibilité correspondent au produit réellement vendu.
- [ ] Les images sont autorisées à l’usage, représentent la bonne variante, sont suffisamment lisibles et apparaissent dans l’ordre voulu; l’image principale est correcte.
- [ ] Les produits brouillons, publiés, dépubliés, archivés et restaurés ont le comportement commercial attendu.
- [ ] Les catégories et marques sont exactes, visibles ou masquées selon la décision de l’entreprise, et leurs affectations publiques sont correctes.

### Stock et commandes

- [ ] Les quantités d’ouverture sont rapprochées du stock réel; les ajustements sont accompagnés d’un motif et d’un mouvement consultable.
- [ ] Les limites de vente en rupture/faible stock et les responsabilités de mise à jour du stock sont définies.
- [ ] Les coordonnées demandées au client, zones/frais/seuils de livraison, délais et conditions de retrait sont exacts.
- [ ] Le paiement à la livraison est bien le seul moyen autorisé à ce stade; aucune mention ne laisse croire qu’un paiement en ligne est disponible.
- [ ] Les transitions de commande, annulation, retour de stock, traitement, expédition, livraison et communication au client sont conformes au processus réellement opéré.
- [ ] Une procédure est définie pour surveiller la boîte de réception des demandes de contact. Le site annonce une réponse sous 24 heures ouvrées, mais le formulaire n’envoie pas automatiquement de notification ou d’accusé de réception.

### CMS et paramètres

- [ ] Le propriétaire sait modifier et contrôler une bannière, son image, son lien, son ordre et sa publication.
- [ ] L’ordre et la visibilité des sections d’accueil, catégories mises en avant et produits vedettes correspondent au choix éditorial.
- [ ] Une modification de page, FAQ ou salon est relue sur le site public après enregistrement.
- [ ] Adresse, téléphone, e-mail, WhatsApp, horaires, réseaux sociaux, annonce et pied de page utilisent les valeurs officielles.
- [ ] Les préférences d’e-mail propriétaire/client et les destinataires sont explicitement décidés; aucun envoi réel n’a été testé.

**Décisions ou corrections du propriétaire (références de lignes) :**

| Réf. | Point / décision | Responsable | Échéance | État |
|---|---|---|---|---|
| | | | | À décider |
| | | | | À décider |
| | | | | À décider |

## 3. Revue obligatoire par un opticien qualifié

### Ce que le système fait — et ne fait pas

Le système exige une décision exacte pour le **produit + variante + type de verre + indice + ensemble complet des traitements**. Une combinaison absente ou en attente n’est pas achetable; une combinaison déclarée incompatible est refusée. Les champs de prescription ne constituent pas une validation médicale et le système ne doit pas inventer de limites ou de plausibilité clinique.

Une décision enregistrée pendant les tests, même avec l’état « approuvé », est un fixture synthétique **TEST ONLY**. L’administration ne certifie pas à elle seule l’identité ou la qualification du réviseur. **Ne pas copier les approbations de test dans l’inventaire réel.**

### Checklist de décision professionnelle

- [ ] Confirmer l’identité, la qualification, le périmètre de responsabilité et le moyen de vérifier le signataire.
- [ ] Confirmer que l’inventaire utilisé est le catalogue réel approuvé pour l’environnement concerné; identifier chaque produit et chaque variante/SKU sans inférer la compatibilité depuis le nom, la forme ou le matériau.
- [ ] Pour chaque combinaison examinée, évaluer séparément le type de verre, l’indice et **l’ensemble exact** des traitements, y compris exclusions, associations et contraintes de montage.
- [ ] Choisir explicitement **APPROUVÉ**, **INCOMPATIBLE** ou **EN ATTENTE**. L’absence de revue reste en attente; elle ne vaut jamais approbation.
- [ ] Documenter les critères, limites de correction/dimensions ou conditions applicables, la justification, la date, le nom/qualification du réviseur et la référence de preuve autorisée.
- [ ] Définir qui peut saisir, contre-vérifier, modifier ou révoquer une décision et comment les changements de monture, variante, verre, indice ou traitement déclenchent une nouvelle revue.
- [ ] Examiner séparément l’impact sur commandes historiques et commandes en cours; ne pas réécrire leurs instantanés ou décider d’un suivi client sans procédure approuvée.
- [ ] Maintenir Progressive indisponible tant que sa remise en vente n’est pas explicitement approuvée et configurée. ADD/EP ne sont pas collectés actuellement.
- [ ] Signaler les combinaisons ou contrôles professionnels manquants au responsable du produit; ne pas contourner le blocage pour compléter un panier.

### Registre vierge — à compléter par l’opticien

Créer une ligne pour **chaque** combinaison exacte retenue dans le catalogue cible. Ce tableau est un formulaire vierge, pas une proposition de compatibilité.

| Produit / SKU | Variante / SKU | Type de verre | Indice | Ensemble exact de traitements | Décision (A/I/E) | Limites / conditions / justification | Nom et qualification vérifiable | Date | Réf. de preuve |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |
| | | | | | | | | | |
| | | | | | | | | | |

**A = approuvé, I = incompatible, E = en attente.** Une case vide ou une ligne incomplète est non validée et doit rester bloquée.

## 4. Décisions légales, commerciales et de conservation à obtenir

### Propriétaire / conseil compétent

- Raison sociale et identifiants officiels, adresse, coordonnées, propriétaire de la boutique et mentions obligatoires.
- Validation des CGV, confidentialité/cookies, consentement, retours, garanties, remboursement, fiscalité, livraison et délais réellement tenus.
- Exactitude des prix, promotions et conditions; décision sur l’éventuelle remise newsletter. Le formulaire d’inscription n’est pas actif sur la page d’accueil; ne pas annoncer de bénéfice ou désabonnement disponible sans opération correspondante.
- Acceptation du message de réponse sous 24 heures ouvrées et désignation d’un responsable qui surveille les demandes. À défaut, valider une correction de la promesse avant ouverture commerciale.
- Destinataires, textes, langues et activation des e-mails transactionnels, ainsi que la conduite à tenir sur une notification `SENDING` ambiguë. Le transport discard ne prouve pas une livraison SMTP.
- Durée et critères de conservation des ordonnances, accès autorisés, suppression, gestion des demandes de personnes, sauvegardes et incidents; validation par la personne compétente en matière de protection des données.
- Informations réelles des salons, horaires, stocks, disponibilité et capacité de répondre aux demandes.

### Opticien qualifié

- Décisions et justification du registre exact ci-dessus; limites de montage et de prescription applicables; règles de revue, contrôle et révocation.
- Décision séparée sur toute gamme progressive et tout champ optique supplémentaire. Aucune réactivation n’est implicite.

## 5. Éléments qui ne sont pas acceptés par ce dossier

| Catégorie | État au jour de l’audit |
|---|---|
| Vérifications techniques locales | Parcours synthétiques testés; aucun défaut logiciel reproductible confirmé dans le périmètre vérifié. Les tests automatisés ne remplacent pas la recette réelle de chaque produit ou contrôle. |
| Décisions du propriétaire | En attente : exactitude des produits/prix/stock, images/droits, CMS, coordonnées, pages juridiques, conditions commerciales, contact/SLA, marketing, e-mail et rétention des données. |
| Approbations professionnelles | En attente : aucune règle optique réelle validée. Aucune vente de verres correcteurs ne doit être déclarée approuvée sur la base des fixtures de test. |
| Infrastructure différée | Domaine/TLS, base hébergée et migration, stockage durable/privé, sauvegardes/restauration, SMTP réel, supervision, accès staging et paiements en ligne n’ont pas été mis en place ni testés dans ce travail. Aucun déploiement n’est autorisé par ce document. |

## 6. Signatures — revue, pas approbation présumée

La signature confirme uniquement que le signataire a effectué la revue indiquée et consigné les réserves. Une signature propriétaire ne remplace pas l’approbation optique; une signature d’opticien ne vaut pas validation juridique/commerciale.

### Revue propriétaire

- Nom et fonction : ______________________________________________
- Société / entité : ______________________________________________
- Environnement et date de revue : _________________________________
- Décision : ☐ Accepté pour la suite de la recette locale  ☐ Accepté avec réserves jointes  ☐ Refusé / corrections demandées
- Réserves, références et responsables : ____________________________
  ________________________________________________________________
- Signature : __________________________________ Date : ____________

### Revue professionnelle optique

- Nom : __________________________________________________________
- Qualification / organisme / moyen de vérification : _________________
- Catalogue, versions et références examinés : _______________________
- Registre optique complété annexé : ☐ Oui ☐ Non
- Décision : ☐ Revue uniquement — aucune approbation de vente  ☐ Décisions exactes annexées et signées  ☐ Refusé / revue complémentaire requise
- Limites et réserves : ____________________________________________
  ________________________________________________________________
- Signature : __________________________________ Date : ____________

### Suivi des actions et autorisation distincte

- Actions restantes / responsables / échéances : _____________________
  ________________________________________________________________
- **Aucune mise en production, activation de paiement, migration de base métier ou envoi réel d’e-mail n’est autorisé par ces signatures.** Toute étape d’infrastructure ou d’exploitation nécessite une décision et une procédure séparées.

## Références

- [`COMPLETE_FINAL_FUNCTIONAL_AUDIT.md`](COMPLETE_FINAL_FUNCTIONAL_AUDIT.md) — couverture, preuves, limites, résultats de tests et verdicts locaux.
- [`OPTICAL_COMPATIBILITY_REVIEW.md`](OPTICAL_COMPATIBILITY_REVIEW.md) — revue et registre technique de compatibilité.
- [`ORDER_EMAIL_NOTIFICATIONS.md`](ORDER_EMAIL_NOTIFICATIONS.md) — outbox, retry et limites de livraison.
- [`OWNER_UAT_AND_STAGING_READINESS.md`](OWNER_UAT_AND_STAGING_READINESS.md) — prérequis de recette et d’infrastructure; les étapes hébergées restent différées.
