# Guide de prise en main — démonstration AGHARAS VISION

> Guide de démonstration locale. Les intitulés et captures ne remplacent pas une recette réelle avec le propriétaire. N’effectuez pas de commandes de test sur la base métier.

## Identité officielle intégrée

- Nom public affiché : **AGHARAS VISION**. Il est modifiable dans **Paramètres → Maison → Nom de la maison**.
- Logo fourni par le propriétaire : `pics/463485429_568149309219722_255371644098350474_n.jpg`. Dérivés sans recoloration : `public/images/brand/agharass-vision-logo-header.webp` (logo compact, chemin CMS actif) et `public/images/brand/agharass-vision-logo.webp` (format carré). Les métadonnées sociales utilisent le chemin logo CMS actif. Ce chemin est éditable dans **Paramètres → Maison → Logo**.
- Adresse du magasin : **N° 13 Imm 08 , Lot 4 Al kheir,Cité Essalam,AGADIR**. Elle est modifiable dans **Paramètres → Contact & salon** et dans **Adresse du magasin**. Le lien d’itinéraire est une recherche d’adresse Google Maps, sans coordonnées inventées.
- Un seul enregistrement magasin est actif dans le schéma de démonstration. L’ancien enregistrement Rabat est désactivé et conservé, pas supprimé. Ne le réactivez pas sans confirmation du propriétaire.
- L’adresse saisie dans **Paramètres** et celle de l’enregistrement du magasin principal sont synchronisées lors de l’enregistrement; les deux formulaires ont été vérifiés.
- Confirmation du propriétaire (9 novembre 2026) : le logo fourni est le bon logo officiel; le nom correct est **AGHARAS VISION**. L’image source a été préservée sans modification.
- Verdict identité : **BRAND NAME CORRECTED — VERIFIED**. Voir [`AGHARASS_BRAND_IDENTITY_UPDATE.md`](AGHARASS_BRAND_IDENTITY_UPDATE.md). Captures Chromium : `artifacts/brand-identity-update/`.

## 1. Démarrer l’application localement

### Démonstration locale actualisée et vérifiée le 9 novembre 2026

Une version optimisée de démonstration est actuellement disponible sur **http://127.0.0.1:3106/**. Elle utilise une base synthétique isolée (`agharas_test`, schéma `agharas_demo_refresh_20261108_01`) : 12 produits fictifs, une commande seed, Progressive désactivé et aucune décision de compatibilité optique. L’identité et l’adresse officielles fournies sont appliquées à ce seul schéma; les anciens points de vente sont désactivés dans l’interface publique. Le serveur est en mode production Next.js local; e-mail en mode `discard`; stockage filesystem local réservé aux tests. Ne la reliez pas à la base `agharas/public` et ne la rendez pas accessible hors de cette machine.

Pour redémarrer cette instance, le processus doit conserver `NEXT_DIST_DIR=.next-brand-identity-20261109` et `DATABASE_URL` explicitement réglé sur le schéma synthétique `agharas_test.agharas_demo_refresh_20261108_01`, avec `APP_ENVIRONMENT=test`, `EMAIL_TRANSPORT=discard`, `OWNER_EMAIL=admin@agharas.local`, `OBJECT_STORAGE_DRIVER=filesystem` et des chemins absolus locaux distincts pour `PUBLIC_MEDIA_DIR` et `PRESCRIPTION_STORAGE_DIR`. Les identifiants de connexion PostgreSQL et du compte propriétaire restent dans la configuration locale protégée; ne les copiez pas dans un document ou un message. Si la cible de base ne peut pas être confirmée comme le schéma synthétique, n’effectuez aucune écriture et demandez l’aide de la personne responsable.

#### Redémarrage vérifié (PowerShell, sans migration ni seed)

Depuis `D:\PROJETs\e-agharass-vision`, après avoir vérifié que PostgreSQL local fonctionne et que `.env` contient le `TEST_DATABASE_URL` local autorisé, exécuter ce bloc dans un terminal dédié. Il construit `DATABASE_URL` à partir de `TEST_DATABASE_URL` (sans afficher ses identifiants), impose la base et le schéma de démonstration, puis vérifie l’identité réelle via Prisma avant de démarrer. En cas d’incertitude ou d’échec, le bloc s’arrête. Ne remplacez pas la cible par `DATABASE_URL` métier.

```powershell
$ErrorActionPreference = 'Stop'
Set-Location 'D:\PROJETs\e-agharass-vision'

$env:PLAYWRIGHT_BROWSERS_PATH = 'D:\PROJETs\e-agharass-vision\.playwright-browsers'
$env:NEXT_DIST_DIR = '.next-brand-identity-20261109'
$env:NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:3106'
$env:APP_ENVIRONMENT = 'test'
$env:EMAIL_TRANSPORT = 'discard'
$env:OBJECT_STORAGE_DRIVER = 'filesystem'
$env:PUBLIC_MEDIA_DIR = 'C:\Users\admin\AppData\Local\Temp\opencode\agharas-demo-refresh-storage\public'
$env:PRESCRIPTION_STORAGE_DIR = 'C:\Users\admin\AppData\Local\Temp\opencode\agharas-demo-refresh-storage\prescriptions'
$env:OWNER_EMAIL = 'admin@agharas.local'

$env:DATABASE_URL = node --input-type=module -e @'
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
require('@next/env').loadEnvConfig(process.cwd());
const raw = process.env.TEST_DATABASE_URL;
if (!raw) throw new Error('TEST_DATABASE_URL absent');
const u = new URL(raw);
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(u.hostname) || u.pathname !== '/agharas_test') {
  throw new Error('Cible refusée : seule la base locale agharas_test est autorisée');
}
u.searchParams.set('schema', 'agharas_demo_refresh_20261108_01');
process.stdout.write(u.toString());
'@
if ($LASTEXITCODE -ne 0 -or -not $env:DATABASE_URL) { throw 'Préparation de la cible isolée échouée' }

node --input-type=module -e @'
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
try {
  const [id] = await db.$queryRaw`SELECT current_database() AS database, current_schema() AS schema`;
  console.log(`Cible vérifiée : ${id.database}/${id.schema}`);
  if (id.database !== 'agharas_test' || id.schema !== 'agharas_demo_refresh_20261108_01') throw new Error('Identité inattendue; arrêt');
} finally { await db.$disconnect(); }
'@
if ($LASTEXITCODE -ne 0) { throw 'Vérification réelle de la base échouée; serveur non démarré' }

New-Item -ItemType Directory -Force -Path $env:PUBLIC_MEDIA_DIR, $env:PRESCRIPTION_STORAGE_DIR | Out-Null
if (Get-NetTCPConnection -State Listen -LocalPort 3106 -ErrorAction SilentlyContinue) {
  throw 'Le port 3106 est déjà occupé. Ne terminez pas son processus sans en identifier le propriétaire.'
}
npm run start -- --hostname 127.0.0.1 --port 3106
```

Le dernier ordre reste au premier plan : attendre `Ready`, puis ouvrir `http://127.0.0.1:3106/`. Arrêter uniquement ce processus avec `Ctrl+C` dans ce terminal. Avant le redémarrage, si 3106 est déjà occupé, identifier le processus et ne pas l’arrêter à l’aveugle. Le bloc ne lance ni migration, ni seed, ni écriture de données métier. Pour une simple vérification après démarrage, `Invoke-WebRequest http://127.0.0.1:3106/` doit renvoyer HTTP 200.

Prérequis : Node.js compatible avec le projet, npm, PostgreSQL local démarré, dépendances installées (`npm install`) et fichier `.env` configuré par la personne responsable. Ne partagez pas `.env`, mots de passe, clés d’authentification ou données de clients.

Dans un terminal, depuis le dossier du projet :

```powershell
npm run dev -- --hostname 127.0.0.1 --port 3002
```

Ouvrez ensuite `http://127.0.0.1:3002/`. Le port 3000 peut être utilisé par une autre application : ne l’arrêtez pas et ne le réaffectez pas. Pour arrêter le serveur Agharas, utilisez `Ctrl+C` dans son terminal.

Les services nécessaires à une démonstration complète sont PostgreSQL et le serveur Next.js. Les services e-mail et paiement ne doivent pas être activés pour une démonstration locale. Utilisez une base synthétique dédiée pour les essais qui créent des commandes ou modifient le stock.

## 2. Accès propriétaire

Accédez à **Connexion administrateur** puis utilisez uniquement le compte propriétaire provisionné de façon sécurisée par le responsable technique. Aucun identifiant ni mot de passe n’est publié dans ce guide. Si l’accès est refusé, demandez au responsable de vérifier le compte et la configuration propriétaire; ne contournez pas les contrôles d’accès.

## 3. Produits et stock

1. Ouvrez **Produits**, puis choisissez la création ou l’édition d’un produit.
2. Complétez les informations nécessaires : nom, référence, marque, catégorie, type, description et prix. Vérifiez les montants avant l’enregistrement.
3. Ajoutez les variantes/coloris avec une référence distincte et le stock correspondant.
4. Ajoutez les photos depuis la fiche produit; contrôlez l’aperçu et l’ordre des images avant d’enregistrer.
5. Enregistrez d’abord en brouillon, prévisualisez, puis publiez seulement après validation des textes, prix, photos et disponibilité.
6. Les corrections de quantité se font dans **Stock**. Vérifiez le mouvement enregistré et l’affichage public après modification.
7. La dépublication retire le produit de la vente. L’archivage et la restauration ne signifient pas automatiquement republication.

Effectuez ces opérations uniquement sur une base de recette ou des produits réels explicitement approuvés.

## 4. Accueil et contenu (CMS)

Dans **Apparence**, modifiez les bannières, l’ordre/visibilité des sections et les catégories mises en avant. Enregistrez, puis contrôlez l’accueil public sur ordinateur et téléphone.

Dans **Contenu**, gérez les pages, questions fréquentes et textes disponibles dans l’interface. Toute mention légale, coordonnée, garantie, délai ou promesse commerciale doit être fournie et approuvée par le propriétaire; ne remplacez pas les textes par des valeurs inventées. Vérifiez immédiatement les changements sur la page publique correspondante.

## 5. Verres et compatibilité optique

Les types de verres, indices et traitements définissent les options et leurs prix. La compatibilité doit être décidée séparément pour chaque combinaison exacte de monture, variante, type, indice et ensemble de traitements par un opticien qualifié.

Les états sont **APPROVED**, **INCOMPATIBLE** et **PENDING**. L’absence de décision reste en attente et ne doit jamais être interprétée comme une approbation. Les données synthétiques d’essai ne sont pas des validations professionnelles et ne doivent pas être recopiées dans le catalogue réel.

## 6. Commandes

Dans **Commandes**, recherchez une commande, ouvrez son détail et utilisez uniquement les transitions proposées et autorisées. Contrôlez le total, le mode de paiement à la livraison (COD), l’historique et les mouvements de stock. Les tests de commande peuvent modifier le stock : faites-les exclusivement sur une base synthétique isolée.

Les notifications de test doivent utiliser le transport `discard`. Ne configurez pas SMTP réel et n’envoyez pas de messages à des clients sans autorisation explicite.

## 7. Ordonnances, confidentialité et limitations

Les ordonnances sont des données sensibles : ne les téléversez pas dans une démonstration sans données fictives autorisées. Leur consultation est réservée aux sessions autorisées. N’utilisez jamais un lien public pour les partager. La politique de conservation/suppression doit être décidée par le propriétaire et les responsables compétents.

Les paiements en ligne et la mise en production publique ne font pas partie de cette livraison locale. Les textes métier/légaux, l’approbation optique, les coordonnées réelles, les tarifs/délais de livraison et les contenus marketing demandent encore une validation explicite.

## 8. Sauvegarde et récupération

Avant toute intervention sur une base métier, le responsable technique doit réaliser et vérifier une sauvegarde PostgreSQL ainsi que la sauvegarde des fichiers associés, puis confirmer la possibilité de restauration sur une copie isolée. Ce guide ne fournit aucune commande de réinitialisation, de migration destructive ou de restauration sur la base métier. Ne lancez pas `db:seed`, `db:push`, `db:migrate` ou un test d’acceptation avant d’avoir confirmé la cible isolée.

## 9. Script court de démonstration client (environ 8 minutes)

**Introduction (30 s).** « Voici une démonstration locale utilisant des données fictives. Elle permet de parcourir l’expérience et l’administration; elle ne constitue pas une autorisation de vendre en ligne. Aujourd’hui, nous n’enregistrons aucune modification. »

1. **Vitrine et catalogue (1 min)** — ouvrir l’accueil, montrer les rubriques, puis le catalogue, les filtres et une fiche produit. Parcourir les informations et variantes sans ajouter au panier ni transmettre de commande.
2. **Optique (1 min)** — ouvrir le configurateur d’une monture et montrer le statut **en attente**. Expliquer que l’absence d’une décision explicite d’un opticien bloque la combinaison; ne pas tenter de contourner le blocage ni présenter les données de test d’acceptation comme des décisions métier.
3. **Connexion et tableau de bord (1 min)** — le propriétaire se connecte avec son compte local sécurisé. Montrer le tableau de bord, puis la navigation; ne pas partager le mot de passe ni enregistrer de formulaire.
4. **Produits (1 min)** — dans **Produits**, parcourir une fiche, ses variantes, prix, visibilité et photos. Montrer les champs uniquement; ne pas créer, éditer, publier, dépublier, archiver ou téléverser.
5. **Stock / inventaire (45 s)** — ouvrir **Stock & inventaire**, montrer les quantités et l’historique disponibles. Ne pas ajuster de quantité et ne pas créer de mouvement.
6. **Commandes (1 min)** — ouvrir **Commandes**, consulter la commande de démonstration et ses détails/historique. Ne pas changer de statut, expédier, annuler, rembourser ou déclencher une notification.
7. **CMS (1 min)** — parcourir **Apparence de l’accueil** et **Contenu**; montrer les sections, bannières, pages et FAQ. Ne pas enregistrer, publier ni modifier de texte.
8. **Paramètres (45 s)** — consulter les paramètres et expliquer quels éléments restent à fournir/valider. Ne pas modifier les coordonnées, options ou réglages.
9. **Questions et retour (1 min)** — remplir la checklist ci-dessous avec le client, sans écrire ses réponses dans l’application.

**Actions sûres pendant la séance :** navigation et consultation en lecture seule, ouverture/fermeture de menus, inspection des formulaires sans soumission, consultation des fiches et de la commande seed. **À ne pas faire :** enregistrer ou publier, régler le stock, changer une commande, envoyer un message, téléverser une ordonnance/image, ajouter au panier ou effectuer un checkout. Une commande enregistrée modifierait l’état synthétique et n’est pas nécessaire à la présentation.

## 10. Checklist de retour et d’acceptation client

Noter les commentaires hors de l’application; aucun changement ne sera appliqué pendant la réunion.

- [ ] Le parcours accueil → catalogue → fiche produit est-il compréhensible ? Commentaires : ____________________
- [ ] Les noms, descriptions, prix et variantes sont-ils présentés comme attendu ? Éléments à corriger : ____________________
- [ ] La navigation mobile et les libellés sont-ils clairs ? Appareil / remarque : ____________________
- [ ] Les informations de stock montrées sont-elles utiles ? Besoins de suivi : ____________________
- [ ] Les informations affichées sur une commande couvrent-elles le besoin opérationnel ? ____________________
- [ ] Les sections d’accueil, pages et FAQ attendues sont-elles identifiées ? ____________________
- [ ] Quels rôles et niveaux d’accès l’équipe doit-elle avoir ? ____________________
- [ ] Les coordonnées, horaires, livraison, retours, garanties et mentions légales réels ont-ils été fournis et approuvés ? Oui / Non / Responsable : ____________________
- [ ] Les décisions exactes de compatibilité optique ont-elles été documentées par un opticien qualifié ? Oui / Non / Référentiel attendu : ____________________
- [ ] Quelle durée de conservation et procédure de suppression des ordonnances sont requises ? Décideur : ____________________
- [ ] Les paiements, notifications, sauvegardes et stockage privé ont-ils des responsables et exigences définis ? ____________________
- [ ] Décision de recette locale : [ ] poursuivre les retours [ ] corrections demandées [ ] revue métier requise. Responsable / date : ____________________

Cette checklist est un recueil de retours, pas une validation de conformité légale, une approbation professionnelle optique ou une autorisation de mise en ligne.

## 11. Checklist de recette propriétaire (parcours modifiants — hors démonstration)

- [ ] Connexion propriétaire et accès refusé pour une session non autorisée.
- [ ] (Uniquement lors d’une recette distincte, sur schéma synthétique neuf/autorisé) créer/modifier un produit synthétique, photo, variante et stock; vérifier le rendu public.
- [ ] (Même restriction) modifier une bannière ou section CMS et vérifier sa publication.
- [ ] Vérifier prix et disponibilité d’un produit publié.
- [ ] (Même restriction) passer une commande invitée COD de test en base isolée; vérifier une seule commande, confirmation et stock.
- [ ] Rechercher la commande et vérifier les transitions permises.
- [ ] Confirmer que les options optiques non approuvées restent bloquées.
- [ ] Tester l’accès ordonnance avec utilisateur autorisé et refusé, avec fichier synthétique seulement.
- [ ] Contrôler l’affichage mobile et les liens de contact/WhatsApp.
- [ ] Faire approuver les contenus commerciaux/légaux et décisions optiques avant toute mise en service réelle.
