# Intégration des visuels premium Agharas

**État :** intégration appliquée au schéma de démonstration isolé et vérifiée dans le navigateur local. Aucun déploiement effectué.

## Visuels et emplacements

Tous les originaux sont des PNG paysage de **1672 × 941 px**, décodés avec succès et conservés sans modification dans `pics/Agharas_Vision_Images/`. Les dérivés WebP gardent les mêmes dimensions et proportions.

| Source PNG | Taille originale | Emplacement constaté | Dérivé optimisé |
|---|---:|---|---|
| `01_Hero_Accueil_Agharas.png` | 1 774 202 octets | Accueil — visuel principal du hero, bannière CMS `home-hero` | `public/images/promotional/agharas-hero.webp` — 81 226 octets |
| `02_Collection_Femme.png` | 2 277 753 octets | Accueil — carte de catégorie Femme, lien existant `/catalogue/femme` | `public/images/promotional/agharas-femme.webp` — 141 554 octets |
| `03_Nos_Collections.png` | 2 239 853 octets | Accueil — bannière « Nos collections », dans la section de collections existante; CTA `/catalogue` | `public/images/promotional/agharas-collections.webp` — 184 412 octets |
| `04_Collection_Homme.png` | 2 092 213 octets | Accueil — carte de catégorie Homme, lien existant `/catalogue/homme` | `public/images/promotional/agharas-homme.webp` — 103 850 octets |
| `05_Notre_Boutique.png` | 2 321 956 octets | `/a-propos` — bannière CMS « Notre univers » avec légende indiquant explicitement qu’il s’agit d’un visuel conceptuel | `public/images/promotional/agharas-boutique.webp` — 232 596 octets |
| `06_Univers_Agharas.png` | 2 329 142 octets | Accueil — bloc de marque dans la section de confiance existante, bannière CMS « L’univers Agharas » | `public/images/promotional/agharas-univers.webp` — 144 272 octets |

Chaque dérivé est au format WebP, mesure 1672 × 941 px et est livré à la taille d’écran par le pipeline `next/image` déjà configuré. Les cartes Femme/Homme conservent leurs slugs et liens issus des catégories existantes.

## CMS et données

- Les images restent éditables par le propriétaire : le hero et les nouvelles bannières utilisent les enregistrements `Banner`; Femme/Homme utilisent les champs d’image des catégories.
- Le formulaire CMS existant expose maintenant l’emplacement `Page d'accueil` ou `Page À propos` à partir du champ `Banner.position` existant. Les images, textes et liens restent modifiables depuis le CMS.
- Le seed utilise également les six nouveaux chemins d’image. Il n’a pas été exécuté sur une base métier.
- Les enregistrements de démonstration ont été mis à jour via l’interface propriétaire sur **`agharas_test.agharas_demo_refresh_20261108_01`**, après vérification de l’identité et de la baseline. Après écriture : 12 produits, 1 commande, 0 règle optique; la bannière promotionnelle `home-promo` demeure inchangée. Les trois nouveaux placements ont été créés; les références hero et catégories Femme/Homme ont été actualisées.
- L’image de boutique est décrite comme conceptuelle et ne prétend pas représenter le magasin réel.

## Vérifications

| Vérification | Résultat |
|---|---|
| Présence, format, dimensions, orientation paysage et décodage des six originaux | PASS |
| Dérivés WebP, dimensions et tailles de fichiers | PASS |
| Build de production isolé (`.next-premium-images-20261108`) | PASS |
| TypeScript (`tsc --noEmit`) | PASS |
| Vitest | PASS — 18 fichiers, 122 tests |
| Parcours CMS en navigateur : création des placements et changement temporaire/restauration d’une image | PASS — persistance vérifiée |
| Pages `/` et `/a-propos`, à 390, 768, 1024 et 1440 px | PASS — HTTP 200, aucune image cassée, aucun débordement horizontal |
| Erreurs navigateur et réponses HTTP pour les nouveaux médias pendant la passe finale | PASS — aucune |
| Régression navigateur de l’exception d’hydratation React #418 observée une fois pendant une première passe large | PASS à la re-vérification — non reproduite sur routes seules ni durant une nouvelle navigation aux quatre largeurs; l’occurrence isolée reste notée |
| `git diff --check` | PASS — avertissements Git de conversion LF/CRLF uniquement |
| Suite Playwright générale | SKIP — elle couvre des mutations métier hors périmètre; les parcours CMS et responsive ont été exécutés sur le schéma isolé dédié |
| Déploiement / stockage externe / port 3000 | NON EFFECTUÉ |

## Captures de vérification

Captures pleine page du schéma de démonstration :

- `artifacts/premium-images-integration/demo-home-390.png`
- `artifacts/premium-images-integration/demo-home-768.png`
- `artifacts/premium-images-integration/demo-home-1024.png`
- `artifacts/premium-images-integration/demo-home-1440.png`
- `artifacts/premium-images-integration/demo-about-390.png`
- `artifacts/premium-images-integration/demo-about-768.png`
- `artifacts/premium-images-integration/demo-about-1024.png`
- `artifacts/premium-images-integration/demo-about-1440.png`
- `artifacts/premium-images-integration/cms-banners-demo.png`
- Données d’observation navigateur/CMS : `artifacts/premium-images-integration/demo-integration-evidence.json`

Après bascule de l’instance de démonstration sur le port habituel **3106**, les mêmes routes et quatre largeurs ont été revalidés sans erreurs navigateur ni média :

- `artifacts/premium-images-integration/final-home-{390,768,1024,1440}.png`
- `artifacts/premium-images-integration/final-about-{390,768,1024,1440}.png`
- `artifacts/premium-images-integration/final-demo-cms-3106.png`
- `artifacts/premium-images-integration/final-demo-3106-evidence.json`

## Fichiers d’implémentation concernés

- `src/app/(site)/page.tsx`
- `src/components/site/ContentArticle.tsx`
- `src/components/admin/ContentForms.tsx`
- `src/app/admin/contenu/page.tsx`
- `src/app/actions/admin/system.ts`
- `src/lib/validation.ts`
- `prisma/seed.ts`
- `public/images/promotional/agharas-{hero,femme,collections,homme,boutique,univers}.webp`

## Verdict

**ALL IMAGES INTEGRATED — VERIFIED** sur le site local et dans le schéma synthétique explicitement identifié ci-dessus. Aucun schéma métier ou `agharas/public` n’a été modifié.
