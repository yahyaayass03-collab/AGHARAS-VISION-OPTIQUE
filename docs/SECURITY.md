# Sécurité — AGHARAS VISION OPTIQUE

Ce document décrit les contrôles en place, les décisions prises et **ce qui reste
à faire** avant une mise en production. Il ne constitue pas une certification :
un audit externe reste recommandé, notamment pour les données de santé
(ordonnances) et la conformité CNDP/RGPD.

---

## 1. Périmètre et actifs sensibles

| Actif | Sensibilité | Emplacement |
| --- | --- | --- |
| Mots de passe | Critique | Hash bcrypt en base |
| Sessions | Élevée | Jeton en cookie, empreinte SHA-256 en base |
| Ordonnances (fichiers + valeurs optiques) | **Donnée de santé** | Répertoire privé + PostgreSQL |
| Commandes et coordonnées | Personnelle | PostgreSQL |
| Comptes staff et permissions | Élevée | PostgreSQL |
| Journal d'audit | Élevée | PostgreSQL |
| Secret `AUTH_SECRET` | Critique | Variable d'environnement |

Le modèle de menace retenu : attaquant distant non authentifié, client
authentifié tentant d'accéder aux données d'autrui, et membre du staff disposant
de permissions limitées.

---

## 2. Authentification

### Mots de passe

- Hash **bcrypt, coût 12** (`src/lib/auth/password.ts`).
- Politique : 8 caractères minimum, majuscule, minuscule, chiffre et caractère
  spécial (`passwordIssues`), appliquée côté serveur (Zod) et rappelée dans
  l'interface.
- Comparaison via `bcrypt.compare` ; toute erreur renvoie `false`.
- Message de connexion **générique** (« E-mail ou mot de passe incorrect ») que
  le compte existe ou non, et que le compte soit désactivé ou non.
- Le seed crée des comptes de démonstration avec des mots de passe connus : ils
  doivent être supprimés ou changés avant toute exposition publique.

### Sessions

- Jeton aléatoire de 32 octets (hex, 256 bits d'entropie).
- Seule l'empreinte **SHA-256** est stockée (`Session.tokenHash`), jamais le
  jeton en clair.
- Cookie `agharas_session` : `httpOnly`, `SameSite=Lax`, `Secure` en production,
  `path=/`, expiration 30 jours (alignée sur `Session.expiresAt`).
- `getSessionUser()` vérifie l'existence, l'expiration **et** `user.isActive` à
  chaque requête ; résultat mis en cache pour la durée de la requête seulement.
- Révocation : suppression de la ligne en base (déconnexion, désactivation du
  compte, réinitialisation de mot de passe → toutes les sessions du compte sont
  supprimées).
- Aucune session « glissante » : la durée de vie est fixe.

### Réinitialisation de mot de passe

- Jeton de 32 octets, haché en SHA-256, **usage unique** (`usedAt`), expiration
  **1 heure**.
- Réponse générique identique pour un compte existant ou non (pas d'énumération
  par ce canal) ; 3 demandes / 10 min par adresse.
- **Aucun transport e-mail n'est configuré.** En développement, le lien est
  renvoyé dans la réponse (`devLink`) ; en production, seul un log serveur est
  écrit et l'utilisatrice ne reçoit rien. **C'est un bloqueur de production.**

### Inscription

- L'inscription révèle si une adresse est déjà utilisée (message dédié). C'est un
  compromis d'ergonomie assumé ; il permet une énumération partielle des comptes.
  À réévaluer si le risque est jugé inacceptable (réponse générique + e-mail de
  confirmation).

---

## 3. Autorisation

### Clients

- Refus par défaut : chaque page/action de l'espace client appelle
  `requireCustomer`/`requireUserAction`.
- **Autorisation objet** systématique : les requêtes filtrent par `userId`
  (adresses, ordonnances, commandes) avant toute lecture ou mutation. Un
  identifiant deviné ne suffit jamais.
- Les téléchargements d'ordonnances vérifient propriétaire **ou** permission
  staff ; les accès staff sont audités.

### Staff (RBAC)

- Permissions `module.action` stockées dans `Role.permissions`, évaluées par
  `hasPermission` (wildcards `module.*`, `*`, super-admin).
- `requirePermission` sur chaque page admin, `requirePermissionAction` sur chaque
  action : une page protégée ne suffit pas, l'action revérifie.
- La navigation admin est filtrée par permission, mais **la sécurité ne repose
  jamais sur l'interface**.
- `canGrantPermissions` empêche d'accorder un droit que l'on ne possède pas
  (wildcards inclus).
- Le rôle super-administrateur n'est pas modifiable ; les rôles système ne sont
  pas supprimables ; un super-administrateur ne peut être désactivé ni par un
  tiers ni par lui-même.
- Toute action sensible écrit un `AuditLog` : acteur, e-mail, action, entité,
  métadonnées, IP (`x-forwarded-for`), horodatage. L'échec d'écriture du journal
  ne casse pas l'opération métier (choix explicite).

---

## 4. Données de santé (ordonnances)

- Fichiers **hors de `public/`** (`PRESCRIPTION_STORAGE_DIR`), créés avec le mode
  `0600` et un nom aléatoire (timestamp + 16 octets).
- Validation **par signature binaire**, pas par le `Content-Type` déclaré :
  `%PDF-`, JPEG (`FF D8 FF`), PNG, HEIC/HEIF. Taille maximale 10 Mo.
- Nom d'origine assaini (normalisation, caractères non sûrs remplacés, longueur
  limitée) et conservé uniquement pour l'affichage.
- `resolveStoredPath` normalise le chemin et refuse toute sortie du répertoire
  configuré (path traversal).
- Téléchargement via route handler Node :
  - session obligatoire ;
  - propriétaire ou `prescriptions.view` ;
  - `Content-Disposition: attachment` (pas d'affichage inline) ;
  - `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`.
- Suppression possible par la cliente (fichier + ligne) ; revue staff tracée
  (statut, note, `reviewedById`, `reviewedAt`).
- **Rétention : aucune purge automatisée.** La conservation est actuellement
  indéfinie. Une durée doit être validée (recommandation : la durée strictement
  nécessaire à la commande et aux obligations légales) puis implémentée par une
  tâche planifiée avec audit. **Bloqueur de conformité.**

---

## 5. Validation et robustesse des entrées

- Tous les formulaires sont validés par **Zod côté serveur** (les types client ne
  font qu'améliorer l'UX).
- Les montants, quantités, remises et frais de port sont recalculés serveur à
  partir de la base : un prix envoyé par le client n'est jamais utilisé.
- Les identifiants référencés (variante, mode de livraison, coupon, adresse) sont
  rechargés et vérifiés (`isActive`, propriétaire) avant usage.
- Le paiement en ligne est refusé côté serveur, même si le champ est falsifié ;
  `payment.online_enabled` est forcé à `"false"` et `payment.cod_enabled` à
  `"true"` à l'enregistrement des réglages.
- Le contenu éditorial est transformé en nœuds React (échappement automatique)
  par un parseur maison (`lib/content.ts`) : aucun HTML brut n'est injecté.

---

## 6. CSRF, sessions et cookies

- Les mutations passent par des **Server Actions** : Next.js vérifie l'origine de
  la requête (protection CSRF intégrée) et les actions ne sont pas de simples
  endpoints GET.
- Cookie de session `SameSite=Lax` + `httpOnly` : non lisible en JavaScript, non
  envoyé sur les requêtes cross-site de type POST.
- Aucun jeton CSRF applicatif supplémentaire n'est implémenté ; à ajouter si des
  routes API sensibles en écriture sont introduites.
- Cookies panier/favoris invités : opaques, `httpOnly`, durée limitée
  (6 mois / 12 mois), sans donnée personnelle.

---

## 7. Limitation de débit

Implémentation en mémoire, par processus (`src/lib/rate-limit.ts`) :

| Action | Limite |
| --- | --- |
| Connexion | 6 / 5 min par e-mail |
| Inscription | 3 / 10 min par e-mail |
| Mot de passe oublié | 3 / 10 min par e-mail |
| Commande | 4 / 10 min par e-mail |
| Contact | 3 / 10 min par e-mail |
| Newsletter | 3 / 1 min par e-mail |

Limites connues : la clé est l'e-mail (pas l'IP), et le compteur est propre à
chaque instance. En multi-instances ou derrière un autoscale, remplacer par un
store partagé (Redis) et ajouter une limite par IP au niveau du reverse proxy.

---

## 8. En-têtes et transport

`next.config.ts` applique à toutes les réponses :

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
```

`poweredByHeader: false` (pas de `X-Powered-By`).

**Absents à ce stade** (à ajouter au reverse proxy ou dans Next) :

- `Content-Security-Policy` stricte (nonces) — dépend des scripts inline de
  Next ;
- `Strict-Transport-Security` (HSTS) — à activer après validation du domaine et
  du TLS ;
- `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy` ;
- TLS : à terminer au reverse proxy (aucun TLS géré par l'application).

---

## 9. Secrets et configuration

- `AUTH_SECRET` doit être généré aléatoirement (32 octets) et **différent par
  environnement**. Ne jamais committer `.env` / `.env.local` (ignorés par Git).
- Les identifiants de base et du seed sont des valeurs de développement.
- `NEXT_PUBLIC_*` est public par construction : n'y placer aucun secret.
- Le seed ne doit **jamais** tourner sur la base de production.
- Recommandé en production : gestionnaire de secrets (Vault, SSM, Doppler…),
  rotation de `AUTH_SECRET` avec invalidation des sessions.

---

## 10. Journalisation et supervision

- `AuditLog` couvre les actions staff sensibles (stock, commandes, ordonnances,
  clients, promotions, contenu, réglages, utilisateurs/rôles).
- Les erreurs applicatives sont rendues par `error.tsx` en français, sans détail
  technique exposé à l'utilisatrice.
- Aucun outil APM/alerting n'est branché : à prévoir (logs centralisés, alerte sur
  erreurs 5xx et pics de connexions échouées).

---

## 11. Ce qui reste à faire avant production

| Priorité | Point | Détail |
| --- | --- | --- |
| **Bloquant** | Transport e-mail | Réinitialisation, confirmation de commande, notifications |
| **Bloquant** | Rétention des ordonnances | Durée validée + purge planifiée + audit |
| **Bloquant** | Secrets et comptes de démo | Rotation, suppression des comptes seed |
| **Bloquant** | Migrations versionnées | `prisma migrate deploy` en CI/CD |
| Élevée | CSP + HSTS | Reverse proxy avec TLS et en-têtes complets |
| Élevée | Rate limiting distribué | Redis + limite par IP |
| Élevée | Sauvegardes testées | Base + volume ordonnances, restauration vérifiée |
| Moyenne | MFA staff | Facteur additionnel pour les comptes admin |
| Moyenne | Purge des sessions | Tâche planifiée sur `expiresAt` |
| Moyenne | Supervision | Logs centralisés, alertes 5xx, audit consultable |
| Faible | Énumération à l'inscription | Réponse générique + confirmation e-mail |
| Faible | Analyse antivirus | Scanner les PDF téléversés (ClamAV ou service managé) |
| Faible | Chiffrement au repos | Chiffrement disque/volume pour les ordonnances |

---

## 12. Signalement

Aucune adresse de sécurité publique n'est définie. Avant mise en ligne, publier
une adresse `security@` et une politique de divulgation responsable.
