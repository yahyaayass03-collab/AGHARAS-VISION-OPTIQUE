# Rapport — identité officielle AGHARAS VISION

**Date : 9 novembre 2026**  
**Portée : démonstration locale isolée uniquement — aucun déploiement ni hébergement.**

## Confirmation du propriétaire et verdict

Le 9 novembre 2026, le propriétaire a confirmé explicitement que le logo fourni est correct et que l’ancienne graphie `agharass vision` était une faute de frappe. Le nom officiel à afficher est **AGHARAS VISION**. Le nom et le logo d’origine sont maintenant cohérents et vérifiés sur la démonstration isolée à `http://127.0.0.1:3106/`.

## Identité et logo

- Nom public exact : **AGHARAS VISION**. Le champ CMS `store.name` est la source de vérité pour les éléments dynamiques; les valeurs de repli du code et les textes éditoriaux utilisent la même graphie.
- Source conservée sans modification : `pics/463485429_568149309219722_255371644098350474_n.jpg` — JPEG décodable, 1080 × 1080 px, 52 592 octets, sRGB, sans canal alpha.
- Dérivés optimisés, sans recoloration ni déformation :
  - `public/images/brand/agharass-vision-logo.webp` — carré, 1080 × 1080, WebP, environ 19 Ko.
  - `public/images/brand/agharass-vision-logo-header.webp` — recadrage des marges extérieures non essentielles, 700 × 765, WebP, environ 23 Ko; l’ensemble du mot-symbole et du dessin reste visible.
  - `src/app/icon.png` — icône carrée 256 × 256 px.
- Le CMS `store.logo_url` pointe vers `/images/brand/agharass-vision-logo-header.webp`. En-tête bureau/mobile, menu mobile, pied de page, connexion et enveloppe propriétaire utilisent le logo CMS. Les métadonnées sociales et les données LocalBusiness reprennent le même réglage.
- **Logo confirmé par le propriétaire :** le mot-symbole original « AGHARAS VISION » est la bonne identité. Le fichier source, les dérivés et l’icône restent inchangés; aucune retouche, recoloration ni génération de remplacement n’a été faite.

## Adresse, CMS et données

- Adresse publique exacte : **N° 13 Imm 08 , Lot 4 Al kheir,Cité Essalam,AGADIR**. Ville : **Agadir**.
- Paramètres CMS modifiés : `store.name = AGHARAS VISION`, `seo.default_title`, `seo.default_description`. Les réglages `store.logo_url`, `store.address` et `store.city` ont été vérifiés et conservés.
- Les deux éditeurs d’adresse existants ont été synchronisés : l’enregistrement d’un réglage met à jour le magasin actif principal dans la même transaction; l’enregistrement d’un magasin actif reporte son adresse/ville dans les réglages. La synchronisation a été exercée via Chromium dans les deux formulaires.
- Points de vente CMS dans `agharas_test.agharas_demo_refresh_20261108_01` : un seul actif à Agadir. L’ancien enregistrement Rabat est conservé mais désactivé; il n’est ni supprimé ni présenté comme une adresse active. L’enregistrement Casablanca existant a été réaffecté à l’adresse officielle d’Agadir.
- Valeurs après modification contrôlées : **12 produits, 1 commande, 0 règle optique**. Aucun instantané de commande, adresse de livraison client, stock produit, image de campagne, règle de compatibilité ou règle de paiement n’a été modifié dans le cadre des écritures CMS. Aucune écriture n’a visé `agharas/public`.
- Des coordonnées déjà présentes dans le CMS (téléphone/e-mail génériques) et la dénomination juridique de démonstration n’ont pas été présentées comme nouvellement vérifiées. La raison sociale `Agharas Vision SARL AU — démonstration` reste distincte du nom commercial.
- Les noms de villes dans la liste de livraison et les références de couverture de livraison ne constituent pas des adresses de magasin. Ils n’ont pas été convertis en succursales; le propriétaire doit valider séparément les zones et coordonnées de livraison avant toute publication commerciale.

## Présentation, référencement et itinéraire

- Nom et logo CMS propagés aux titres de page, au gabarit SEO, au nom d’application, aux métadonnées Open Graph/Twitter, au favicon, aux libellés accessibles, à l’en-tête/pied de page, au menu mobile, à la connexion, à l’espace propriétaire, aux e-mails transactionnels, aux confirmations de commande et aux messages WhatsApp concernés. Chromium a confirmé `application-name`, `og:site_name`, `og:title`, `og:image`, `twitter:card`, `twitter:title` et `twitter:image` sur le serveur final.
- Les titres SEO courants des 12 produits de démonstration ont été corrigés de l’ancien suffixe vers `AGHARAS VISION`. L’action n’a modifié aucun snapshot de commande.
- Adresse affichée sur Contact, Notre adresse et pied de page. Les données `LocalBusiness` utilisent le nom CMS, l’adresse d’Agadir et le chemin du logo CMS.
- Itinéraire : recherche d’adresse Google Maps encodée (`/maps/search/?api=1&query=…`). La requête comprend l’adresse fournie, Agadir et Maroc; aucune latitude/longitude ni épingle précise n’est affirmée.

## Vérification et captures

- Production Next.js locale, répertoire isolé : `.next-brand-identity-20261109`; build terminé avec succès. Le réglage temporaire de worker mémoire a été retiré de `next.config.ts` après compilation.
- TypeScript : `npm run typecheck` — PASS.
- Tests Vitest complets : `npm test` — **20 fichiers, 126 tests réussis**.
- E2E Chromium ciblés sur le serveur final, lecture/navigation uniquement : navigation et responsive — **14/14 réussis**, dont le menu mobile, les liens propriétaires, et les vues 390, 768 et 1440 px. Aucun échec de requête réel ni erreur console; les annulations de préchargements RSC attendues sont ignorées.
- Contrôle responsive manuel : 390, 768, 1024 et 1440 px, sans débordement horizontal dans les mesures réalisées.
- Captures produites sous `artifacts/brand-identity-update/` : `storefront-390.png`, `storefront-768.png`, `storefront-1024.png`, `storefront-1440.png`, `cms-settings-final.png`, `cms-stores-final.png`.
- Contrôles Chromium finaux sur `http://127.0.0.1:3106/` : 12 routes publiques en HTTP 200; nom, adresse, titres, itinéraires, données LocalBusiness et CMS contrôlés; favicon HTTP 200; aucune image cassée; aucune erreur runtime/hydratation; aucun ancien emplacement présenté comme actif. Après correction du titre Open Graph produit, la page d’accueil et une fiche produit ont été recontrôlées : `og:title`, `og:site_name`, titre visible et nom d’application contiennent le nom officiel.
- `git diff --check` — PASS (avertissements Git de conversion CRLF seulement).
- E2E de commande/paiement non exécutés : ils créent des mutations de commande/stock qui ne sont pas nécessaires à cette mise à jour d’identité. Les règles de checkout et de paiement en ligne n’ont pas été changées.

## Éléments conservés intentionnellement

- Identifiant juridique de démonstration, à confirmer par le propriétaire; il ne remplace pas le nom d’affichage.
- Ancienne entrée de magasin Rabat, inactive et conservée pour référence; aucune adresse client ni donnée d’ancienne commande n’a été réécrite.
- Villes de livraison (ex. Casablanca/Rabat) et données de couverture de livraison, qui ne sont pas des adresses de boutique.
- Nom du paquet, répertoires/chemins d’assets techniques et historique de migrations conservés. Le nom juridique de démonstration est distinct du nom public et n’a pas été modifié.

## Verdict final

**BRAND NAME CORRECTED — VERIFIED**  
Le propriétaire a confirmé que le logo fourni est correct et que **AGHARAS VISION** est le nom officiel. Cette graphie, le vrai logo et l’adresse exacte sont visibles et vérifiés sur l’application réelle locale. Aucun hébergement ni déploiement n’a été effectué.
