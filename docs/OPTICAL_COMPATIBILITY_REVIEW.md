# Revue professionnelle des compatibilités optiques

**Statut : validation professionnelle requise.** Ce document n'est pas une prescription, une validation médicale, ni une liste de combinaisons approuvées. Les décisions ci-dessous doivent être documentées par un opticien qualifié avant leur utilisation commerciale. Un premier mécanisme technique existe ; ses limites et son état de vérification figurent dans `docs/OPTICAL_COMPATIBILITY_ENGINE_ACCEPTANCE.md`.

## Règles techniques existantes, sans valeur d'approbation médicale

- Une fiche produit comporte un indicateur « compatible avec des verres ».
- Chaque type de verre dispose d'une liste de types de produits autorisés et d'un état actif/inactif. Le configurateur filtre les types disponibles, et le serveur vérifie les sélections à l'ajout au panier et à la commande.
- Les indices et les traitements disposent d'un état actif et d'un prix. Le moteur existant vérifie notamment les limites de correction configurées pour certains indices quand les données de l'ordonnance le permettent.
- Les prix et options de commande sont conservés dans les instantanés historiques. Un changement de prix ou de disponibilité d'une option peut imposer une reconfiguration du panier.

Ces règles ne prouvent pas qu'une association monture/verre/traitement est validée par un professionnel. Un nouvel écran (`/admin/verres/compatibilite`) enregistre une décision pour une combinaison exacte — produit, coloris, type de verre, indice et ensemble complet de traitements — avec réviseur, date, preuve facultative et confirmation explicite. Tant qu'aucune décision correspondante n'existe, la combinaison reste « en attente » et n'est pas achetable. Une conversation WhatsApp ne vaut jamais approbation et ne modifie aucune règle.

## Canal WhatsApp officiel

Le numéro officiel **+212 628-889950** est le seul numéro publié. Il est enregistré dans `store.whatsapp`, modifiable par le propriétaire dans « Paramètres de la boutique », et utilisé pour tous les liens `https://wa.me/212628889950`. Les messages contextuels sont en français, encodés dans l'URL, et ne contiennent ni valeur d'ordonnance (sphère, cylindre, axe, addition), ni identité client, ni référence de commande. Les liens d'aide affichés lorsqu'une sélection optique est bloquée servent uniquement à demander conseil : ils ne contournent pas le contrôle serveur.

## Tableau de décision à remplir par l'opticien

Copier une ligne par combinaison. Utiliser « En attente » tant qu'aucune revue identifiable n'a eu lieu ; ne pas interpréter une case vide comme une approbation.

| Produit / référence | Type et forme de monture | Type de verre / indice | Traitements, y compris associations | Statut : approuvé / incompatible / en attente | Limites et conditions de pose | Nom et qualification de l'opticien | Date et référence du document de validation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| À compléter | À compléter | À compléter | À compléter | En attente | À compléter | À compléter | À compléter |

## Questions à trancher

1. Quelles associations de montures, types de verre, indices et traitements sont expressément approuvées, interdites ou conditionnelles ? Fournir les références produit et les versions applicables.
2. Certaines associations nécessitent-elles un contrôle individuel de l'ordonnance, de la forme, des dimensions ou du montage ? Qui le réalise et comment le documenter ?
3. Quels traitements sont compatibles entre eux et lesquels doivent être exclus ensemble ?
4. Quelles options historiquement vendues ont réellement été validées, et quelles preuves sont disponibles ? Les commandes existantes restent des archives, pas des approbations implicites.
5. Qui peut saisir une décision dans l'administration et quels nom, qualification, date et justificatif permettent d'attester la revue ?
6. Quelle communication doit être adressée au client quand une option devient en attente ou incompatible après l'ajout au panier ?

## Préalables à l'activation d'un futur contrôle détaillé

- Définir une transition explicite : toute configuration nouvellement proposée et non revue doit être en attente et non achetable. Ne pas attribuer automatiquement le statut approuvé aux données historiques.
- Inventorier les configurations actuellement proposées et faire valider leur maintien par l'opticien avant activation ; communiquer tout changement aux clients plutôt que le rendre silencieux.
- Conserver les décisions, leur auteur, la preuve professionnelle, leur date et les changements dans un journal. Préserver intégralement les instantanés de commande existants.
- Réutiliser une même validation autoritative à la configuration, à l'ajout et à la modification du panier et au moment de la transaction de commande. Tester les modifications concurrentes de règles ainsi que les refus sans commande ni mouvement de stock.

En attendant ces décisions et cette implémentation, ne pas présenter le configurateur comme une validation professionnelle exhaustive et ne pas considérer le périmètre optique comme prêt pour la production.
