# Inventaire des écrans Stitch — AGHARAS VISION OPTIQUE

Source : `stitch_agharas_vision_optical_e_commerce/` (ne pas modifier).
Système de design : `haute_lunetterie_ditoriale/DESIGN.md` (« Haute Lunetterie Éditoriale »).

## Synthèse

| # | Dossier Stitch | Capture | Code | Route cible | Statut |
|---|---|---|---|---|---|
| 1 | `agharas_vision_optique_boutique_en_ligne_haute_lunetterie` | `screen.png` | `code.html` | `/` | Implémenté |
| 2 | `agharas_vision_optique_catalogue_recherche` | `screen.png` | `code.html` | `/catalogue` (+ `/catalogue/[slug]`) | Implémenté |
| 3 | `agharas_vision_optique_fiche_produit_le_marais_n_04_or_pur` | `screen.png` | `code.html` | `/produit/[slug]` | Implémenté |
| 4 | `agharas_vision_optique_configurateur_de_verres_correcteurs` | `screen.png` | `code.html` | `/configurateur/[slug]` | Implémenté |
| 5 | `agharas_vision_optique_mon_panier` | `screen.png` | `code.html` | `/panier` | Implémenté |
| 6 | `agharas_vision_optique_commande_livraison` | `screen.png` | `code.html` | `/commande` | Implémenté |
| 7 | `agharas_vision_optique_confirmation_de_commande` | `screen.png` | `code.html` | `/commande/confirmation/[reference]` | Implémenté |
| 8 | `agharas_vision_optique_connexion_espace_client` | `screen.png` | `code.html` | `/connexion` | Implémenté |
| 9 | `agharas_vision_optique_inscription_cr_ation_de_compte` | `screen.png` | `code.html` | `/inscription` | Implémenté |
| 10 | `agharas_vision_optique_mon_compte` | `screen.png` | `code.html` | `/compte` (+ sous-pages) | Implémenté |
| 11 | `agharas_vision_optique_mes_favoris` | `screen.png` | `code.html` | `/favoris` | Implémenté |
| 12 | `agharas_vision_optique_contact_conciergerie` | `screen.png` | `code.html` | `/contact` | Implémenté |
| 13 | `agharas_vision_optique_foire_aux_questions` | `screen.png` | `code.html` | `/faq` | Implémenté |
| 14 | `agharas_vision_optique_informations_livraison_mentions_l_gales` | `screen.png` | `code.html` | `/livraison`, `/retours`, `/confidentialite`, `/cgv`, `/mentions-legales` | Implémenté |
| 15 | `agharas_vision_optique_nos_boutiques_salons_priv_s` | `screen.png` | `code.html` | `/boutiques` | Implémenté |
| — | `haute_lunetterie_ditoriale/DESIGN.md` | — | Tokens | `src/app/globals.css` (`@theme`) | Implémenté |

> Tous les écrans listés sont implémentés. Les captures PNG sont conservées
> comme référence visuelle ; la fidélité a été reconstruite à partir du balisage
> HTML/Tailwind fourni (mêmes classes, mêmes espacements, mêmes contenus). Aucune
> comparaison pixel par pixel n'a été possible dans cet environnement (les
> images ne peuvent pas y être analysées visuellement) ; voir
> [`docs/IMPLEMENTATION_PROGRESS.md`](IMPLEMENTATION_PROGRESS.md).

## Système de design extrait

### Couleurs
- `primary` `#182C2D` (encre obsidienne), `primary-container` `#2E4243` (vert sapin)
- `gold` `#CFB56A` (champagne), `secondary` `#705C1A` (or profond, texte)
- `surface` `#FFFFFF`, `surface-dim` `#F7F8F6` (albâtre), `surface-container` `#F0F2EF`
- `outline-variant` `#E1E4E2` (filet 1 px), `on-surface-variant` `#424848`
- Aucune ombre portée, angles à 0 px, filets 1 px.

### Typographie
- Titres : **Bodoni Moda** (serif éditorial), 400–500, interlignage serré.
- Texte/UI : **Hanken Grotesk**, 300–600.
- Labels : majuscules, `0.15em` de tracking, 11 px.
- Prix : Hanken Grotesk, `1 850 DH`, espace insécable comme séparateur de milliers.

### Grille
- Canvas max `1440px`, marges latérales 24 px (mobile) / 48 px (desktop).
- 6 cartes collections, grille produits 4 colonnes desktop / 2 tablette / 1 mobile.
- Section hero 12 colonnes (6/6), sections à filets horizontaux.

## Détail par écran

### 1. Accueil — `/`
- Barre d'annonce collante, header 3 niveaux (marque + recherche + utilitaires, puis navigation).
- Hero éditorial 2 colonnes avec image campagne, 3 preuves (100 %, 48 h, 2 ans).
- 6 cartes collections (Femme, Homme, Solaires, Clips 2-en-1, Lentilles, Accessoires).
- 4 meilleures ventes (badge, essai 3D, swatches, prix, actions Aperçu/Configurer).
- Bloc « Verres correcteurs » avec simulateur de prix.
- Bannière saisonnière, 3 piliers de réassurance, newsletter, footer 4 colonnes.
- **Backend** : bannières, produits vedettes, catégories, nombre de modèles, réglages boutique.
- **Composants** : `SiteHeader`, `SiteFooter`, `ProductCard`, `SectionHeading`, `TrustBar`.

### 2. Catalogue — `/catalogue`
- Fil d'Ariane, en-tête éditorial, résultats, recherche avec suggestions.
- Filtres : catégorie, genre, prix, marque/atelier, forme, disponibilité.
- Tri (recommandés, prix ↑/↓, nouveautés, poids), pagination, chips actives.
- Panneau de filtres mobile, aide opticien, réassurance.
- **Backend** : requête Prisma filtrée/triée/paginée, comptes réels, query params URL.
- **Composants** : `CatalogFilters`, `ActiveFilters`, `SortSelect`, `Pagination`.

### 3. Fiche produit — `/produit/[slug]`
- Galerie principale + vignettes, badge, titre, prix, disponibilité, SKU.
- Sélecteur de coloris, guide des calibres (modale), caractéristiques techniques.
- Onglets : savoir-faire, dimensions, verres/traitements, expédition/retours.
- Encarts : livraison, garanties, conciergerie WhatsApp, produits associés.
- **Backend** : produit/variantes/images/stock, produits associés, avis interdits (fictifs).
- **Composants** : `ProductGallery`, `VariantSelector`, `SizeGuideDialog`, `ProductTabs`, `AddToCartForm`.

### 4. Configurateur de verres — `/configurateur/[slug]`
- Barre d'étapes 01 Correction → 02 Verres & traitements → 03 Ordonnance → 04 Récapitulatif.
- Panneau récapitulatif collant (monture, options, total, prise en charge).
- Choix correction (sans / avec), indices 1.50 → 1.74, traitements, prix transparents.
- Ordonnance : téléversement privé, saisie OD/OG (sphère, cylindre, axe, addition, EP), WhatsApp, plus tard.
- Validation orthoptique, JS client minimal, calcul serveur du prix.
- **Backend** : `LensType`, `LensIndex`, `LensTreatment`, règles de compatibilité, upload sécurisé.
- **Composants** : `LensWizard` (client), `PrescriptionForm`, `StepIndicator`, `SummaryCard`.

### 5. Panier — `/panier`
- Articles avec monture + configuration verres, prix détaillé, quantité, suppression, édition.
- Notes atelier, code promo, récapitulatif (sous-total, remise, livraison, total), mutuelle.
- État vide soigné, réassurance, cross-sell.
- **Backend** : panier persistant cookie + DB, recalcul serveur, coupon.
- **Composants** : `CartLine`, `QuantityStepper`, `CouponForm`, `OrderSummary`.

### 6. Commande — `/commande`
- Checkout invité, 3 étapes visuelles, coordonnées, adresse Maroc, livraison, paiement.
- Paiement à la livraison actif ; CMI en ligne explicitement « bientôt disponible ».
- Ordonnance & mutuelle, CGV, récapitulatif, total serveur, anti double-soumission.
- **Backend** : validation Zod, stock transactionnel, création commande, idempotence.
- **Composants** : `CheckoutForm`, `ShippingMethodPicker`, `PaymentMethodPicker`, `CheckoutSummary`.

### 7. Confirmation — `/commande/confirmation/[reference]`
- Référence, récapitulatif, adresse, règlement, statut, étapes suivantes, WhatsApp.
- Accès par référence **+ jeton non devinable** (invité) ou propriétaire connecté.
- **Backend** : commande, items snapshot, historique de statut.
- **Composants** : `OrderStatusBadge`, `OrderTimeline`.

### 8. Connexion — `/connexion`
- Split éditorial image + formulaire, identifiant, mot de passe, mémorisation.
- Lien mot de passe oublié, WhatsApp « sans mot de passe » (assistance, pas d'auth bypass).
- **Backend** : sessions DB, bcrypt, cookies httpOnly, limitation de débit.
- **Composants** : `AuthShell`, `LoginForm`.

### 9. Inscription — `/inscription`
- Prénom, nom, e-mail, téléphone, mot de passe + confirmation, consentements.
- Indicateur de robustesse, garanties Maison, lien connexion.
- **Backend** : Zod, e-mail unique, hachage, session immédiate.
- **Composants** : `RegisterForm`, `PasswordStrength`.

### 10. Espace client — `/compte`
- Sidebar (aperçu, commandes, ordonnances, adresses, favoris, paramètres, déconnexion).
- Cartes commandes récentes, statut atelier, adresses, encarts conseiller.
- **Backend** : données du client uniquement, contrôle d'accès objet.
- **Composants** : `AccountSidebar`, `OrderCard`, `AddressCard`.

### 11. Favoris — `/favoris`
- Grille de favoris, ajout panier/configurateur, retrait, partage, essai à domicile.
- Invité : favoris liés au cookie puis fusionnés à la connexion.
- **Backend** : `Wishlist` par jeton/utilisateur.
- **Composants** : `WishlistGrid`, `WishlistButton`.

### 12. Contact — `/contact`
- Formulaire (nom, e-mail, objet, message, consentement), WhatsApp, coordonnées.
- Cartes boutiques, horaires, réassurance.
- **Backend** : `ContactMessage`, limitation de débit, notification interne.
- **Composants** : `ContactForm`, `StoreCard`.

### 13. FAQ — `/faq`
- Recherche, catégories, accordéons, encarts conseiller et rendez-vous.
- **Backend** : `FaqItem` administrable, recherche serveur.
- **Composants** : `FaqAccordion`, `FaqSearch`.

### 14. Informations légales — `/livraison`, `/retours`, `/confidentialite`, `/cgv`, `/mentions-legales`
- Sommaire ancré, sections numérotées, encarts, FAQ, CTA.
- **Backend** : `ContentPage` administrable ; valeurs légales (ICE, RC, CNDP) en **placeholders**.
- **Composants** : `LegalLayout`, `LegalSection`.

### 15. Boutiques — `/boutiques`
- 2 salons, services, équipements, prise de RDV (modale), essai à domicile.
- **Backend** : boutiques en réglages/contenu ; aucune donnée réelle inventée.
- **Composants** : `StoreProfile`, `AppointmentForm`.

## Écrans absents du export Stitch (conçus dans le système existant)
- `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe/[token]`
- `/compte/commandes`, `/compte/commandes/[reference]`, `/compte/adresses`, `/compte/ordonnances`, `/compte/profil`
- `/a-propos`, `/mentions-legales`
- `/admin` et l'ensemble du back-office
- Pages d'erreur `404` / `500`, états de chargement

## Actifs

- **Logo** : aucun fichier logo fourni. Le design Stitch utilise un
  patte-de-mot typographique (« AGHARAS VISION OPTIQUE » + « Haute Lunetterie »)
  avec pictogramme `visibility`. Ce patte-de-mot est repris tel quel ; aucun logo
  n'a été inventé. À remplacer dès réception du fichier officiel.
- **Images** : 30 visuels Stitch valides importés dans `public/images/stitch/`
  (manifeste : `public/images/stitch/manifest.json`). Ils servent de données de
  démonstration. **13 visuels sont indisponibles** : les URL d'origine
  (`lh3.googleusercontent.com/aida/…`) renvoient désormais une page HTML au lieu
  de l'image ; les fichiers corrompus ont donc été retirés de `public/` et sont
  consignés `status: "indisponible"` dans le manifeste. Aucun visuel de
  remplacement n'a été inventé : les références concernées ont été repointées
  vers des visuels Stitch valides du même export.
- **Formats** : `nos_boutiques_salons_priv_s-04.png` et `-05.png` sont des PNG
  (extension `.jpg` d'origine corrigée) ; les 28 autres fichiers sont de vrais
  JPEG.
- **Polices** : Bodoni Moda + Hanken Grotesk via `next/font/google`.
- **Icônes** : Material Symbols (auto-hébergé via `material-symbols`) — remplacé
  par des icônes SVG locales pour éviter une dépendance lourde si nécessaire.

## Incertitudes / dépendances manquantes
- Contenus légaux réels (ICE, RC, IF, agrément CNDP), téléphones, adresses et
  e-mails des boutiques : **placeholders explicitement identifiés**.
- Logo officiel : absent.
- Passerelle CMI : non configurée → paiement en ligne désactivé.
- Aucune note/avis client réels → aucun avis ni notation structurée publiés.
