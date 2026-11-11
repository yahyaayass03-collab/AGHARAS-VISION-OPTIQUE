# Hostinger — stockage durable des images de la boutique

**Portée :** images publiques de produits, catégories/marques, bannières CMS et logo téléversées par le propriétaire. Cette solution ne stocke aucune ordonnance dans la table des images. Elle n'a pas été déployée ni testée sur un compte Hostinger.

## Décision technique

Le volume filesystem de l'application n'est **pas réputé persistant**. Le code actuel savait vérifier qu'un chemin est absolu, créer des fichiers et empêcher certains chemins legacy de sortir du répertoire privé; il ne peut pas vérifier que Hostinger monte ce chemin au même endroit, lui donne des droits d'écriture au processus Node et le conserve après redémarrage/redéploiement. Un dossier créé dans File Manager ne prouve aucun de ces points.

Le nouveau mode `PUBLIC_MEDIA_STORAGE_DRIVER=mariadb` est donc la solution préparée pour les médias du propriétaire : fichiers vérifiés/décodés, orientation corrigée, redimensionnés en WebP, puis stockés dans `PublicMediaObject`, table InnoDB dédiée. Les pages produit et CMS continuent de ne sélectionner que leurs URL texte; le BLOB n'est lu qu'à la requête `/api/media/<identifiant>.webp`. Les URL à identifiants aléatoires restent stables au redéploiement tant que la ligne MariaDB est conservée. Le mode S3 précédent demeure disponible (`PUBLIC_MEDIA_STORAGE_DRIVER=object`, avec `OBJECT_STORAGE_DRIVER=s3`). Les anciens fichiers restent lisibles par le mode MariaDB via le backend objet configuré si la ligne BLOB n'existe pas.

Mesures : entrée JPEG/PNG/WebP uniquement, fichier ≤ **5 MiB**, dimensions ≤ **8 000 × 8 000** et ≤ **40 mégapixels**, sortie WebP ≤ **2 MiB** avec côté maximal de **2 400 px**. `PUBLIC_MEDIA_MAX_TOTAL_BYTES` impose une limite cumulative configurée par l'exploitant; la réservation est atomique en base. Le maximum doit être choisi à partir du quota hPanel réel, en laissant de la capacité pour les autres données et opérations; aucun quota Hostinger n'est présumé.

La route ne sert que des noms hexadécimaux correspondant à des images publiques, avec type MIME enregistré, `nosniff`, ETag et cache `immutable` (les URL sont versionnées par identifiant). Les documents privés ne passent pas par cette route. Les actions d'import restent protégées par les permissions propriétaire existantes. Au remplacement/suppression, la suppression physique n'a lieu qu'après vérification des références produit, snapshots de commande, catalogue, bannières, réglages et pages CMS; les images conservées dans un snapshot de commande ne sont pas supprimées.

Les migrations `20261110100000_hostinger_mariadb_public_media`, `20261111100000_public_media_quota` et `20261111110000_public_media_tombstones` ajoutent les tables images/quota et le marqueur de suppression, sans modifier les données métier existantes. Elles sont additives, mais nécessitent une sauvegarde vérifiée et les privilèges MariaDB de création de tables/index et d'ajout de colonne. La suppression laisse un tombstone de taille nulle afin qu'une URL supprimée ne retombe pas sur un ancien backend objet. Ne jamais appliquer sur une base métier avant sauvegarde, vérification de l'identité de la cible et revue du statut de migration.

## Variables Hostinger

Configurer les variables publiques au build **et** au runtime si Next.js les intègre au build. Aucune valeur secrète ne doit apparaître dans le ZIP ou un ticket.

| Variable | Valeur / règle |
|---|---|
| `NODE_ENV` | `production` |
| `APP_ENVIRONMENT` | `staging` pour la recette protégée; `production` seulement à l'ouverture autorisée. À définir au build/runtime. |
| `DATABASE_URL` | URL réelle MariaDB hPanel `mysql://…`; ne pas copier une URL d'exemple. |
| `NEXT_PUBLIC_SITE_URL` | Origine HTTPS officielle uniquement, sans chemin/query/fragment; build/runtime. |
| `OWNER_EMAIL` | Adresse du propriétaire provisionnée hors bande. |
| `AUTH_SECRET` | Secret aléatoire unique d'au moins 32 octets; coffre de secrets. |
| `CRON_SECRET` | Secret aléatoire indépendant d'au moins 32 octets; ne jamais placer dans une URL. |
| `PUBLIC_MEDIA_STORAGE_DRIVER` | `mariadb` pour cette solution. |
| `PUBLIC_MEDIA_MAX_TOTAL_BYTES` | Entier ≥ `2097152`, choisi **sous** le budget de base réellement confirmé dans hPanel. Aucun chiffre de quota n'est fourni par ce dépôt. |
| `OBJECT_STORAGE_DRIVER` | Pour l'état actuel de l'application, `s3` reste requis en runtime production pour les fichiers privés d'ordonnance. Les clés/paires/endpoint dépendent du fournisseur; l'adaptateur S3 est conservé. La persistance de ces documents exige une solution privée confirmée. |
| `OBJECT_STORAGE_BUCKET`, `OBJECT_STORAGE_REGION` | Requis avec `OBJECT_STORAGE_DRIVER=s3`; valeurs réelles du stockage privé. |
| `OBJECT_STORAGE_ENDPOINT` | Facultatif; HTTPS si défini. |
| `OBJECT_STORAGE_ACCESS_KEY_ID`, `OBJECT_STORAGE_SECRET_ACCESS_KEY` | Facultatifs ensemble si l'identité du fournisseur est disponible; sinon paire réelle, jamais communiquée. |
| `EMAIL_TRANSPORT` | `discard` en staging; `smtp` en production uniquement après autorisation et configuration SMTP réelle. |
| `OWNER_FIRST_NAME`, `OWNER_LAST_NAME` | Facultatifs; utilisés seulement lors de la création initiale, valeurs par défaut nominatives sinon. |
| `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` | Coordonnées publiques réelles. WhatsApp recommandé en international `+212…`; le code accepte 8–15 chiffres après normalisation. |
| `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | SMTP seulement : expéditeur/hôte/port valides; identifiants optionnels mais en paire. Ne pas renseigner pour `discard`. |

`OWNER_PASSWORD` est un secret **ponctuel**, fourni uniquement au processus de `npm run owner:provision` après migration; ne jamais le laisser dans hPanel/runtime. Ne pas définir `SEED_*`, `TEST_DATABASE_URL` ni lancer le seed de démo sur les données métier.

## Test requis sur le vrai compte Hostinger

1. Créer une application Node/Next de **staging non publique**, restreinte par authentification réseau/edge. Relever dans hPanel le runtime Node exact, le nom réel de la racine et les limites/quota de la base MariaDB; ne pas supposer MariaDB 11.8.9 ni une limite particulière sans lecture hPanel.
2. Appliquer les deux migrations sur une base staging distincte et sauvegardable, avec l'identité de connexion vérifiée. Mesurer le coût BLOB réel; contrôler les sauvegardes/restaurations hPanel avec cette table présente.
3. Avec l'identité du processus Node (pas seulement File Manager), téléverser par le Dashboard des images synthétiques de produit, de bannière et de logo; vérifier affichage public, ETag, remplacement, retrait, et autorisation (une session anonyme ne peut pas soumettre d'import). Contrôler que les blobs sont dans `PublicMediaObject`, que les références restent des URL, et que les commandes/formulaires/mesures continuent d'être persistés en MariaDB.
4. Enregistrer les mêmes URL et empreintes d'image, redémarrer le processus, puis refaire les requêtes. Ensuite effectuer un **vrai redéploiement Hostinger** avec une version de fichiers applicatifs fraîche, sans supprimer/modifier la base; vérifier à nouveau les mêmes URL et octets depuis le Dashboard et le site.
5. Vérifier la taille/quota MariaDB, les temps de réponse, l'impact sur la sauvegarde, la restauration d'une image et le comportement à quota atteint. Les anciens liens cassés doivent donner 404; aucun contenu privé ne doit être servi par `/api/media`.

Créer un fichier dans File Manager ou réussir le test sur filesystem local n'est pas une preuve de stockage Hostinger persistant. Le test réel de redéploiement ci-dessus n'a pas été exécuté; aucune affirmation de persistance Hostinger n'est faite.

## Validation locale de cette modification

Le stockage local sur MariaDB isolée a vérifié les deux premières migrations, BLOB, lecture avec un second client Prisma, quota et tests d'optimisation; le tombstone/migration finale a ensuite été ajouté mais n'a pas encore passé la suite complète. Un build frais dans une copie locale a réussi avant ce dernier changement et une campagne Playwright a atteint **39/44** avec deux échecs (URL supprimée tombée sur le backend S3 de test et test prescription sans backend privé local), trois cas non exécutés. Le correctif tombstone et l'environnement privé de test D: n'ont pas été recompilés/rerelancés car C: est descendu à 0,091 Go libre. Aucun résultat final de redémarrage/redéploiement local n'est revendiqué. Une copie locale ne remplace en aucun cas le test de vrai redéploiement Hostinger, sa version MariaDB, son quota, son processus Node, ni ses sauvegardes.

**Verdict local actuel : `HOSTINGER-ONLY IMAGE STORAGE BLOCKED`.** Ne pas publier ni déployer ce changement. Aucun ZIP candidat pour cette modification n'a été créé. Reprendre la validation après libération prudente d'espace C: (sans effacer des fichiers inconnus), puis passer tout le typecheck/build/tests et le test local de relancement depuis les fichiers frais.
