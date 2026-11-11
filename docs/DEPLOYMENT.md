# Déploiement — AGHARAS VISION OPTIQUE

> **Document historique PostgreSQL.** Pour la version MariaDB actuelle et l'import
> Git sur Hostinger, suivre [HOSTINGER_GIT_DEPLOYMENT_FR.md](HOSTINGER_GIT_DEPLOYMENT_FR.md).
> Les commandes et versions ci-dessous ne s'appliquent pas à ce déploiement.

Application **Node.js** (runtime Next.js), base **PostgreSQL** et un volume
persistant pour les ordonnances. Elle ne peut pas être déployée en hébergement
statique.

> Avant toute mise en production, parcourir la
> [checklist go-live](#8-checklist-go-live). Plusieurs points sont bloquants
> (e-mails, rétention, comptes de démonstration).

---

## 1. Prérequis

| Élément | Version / remarque |
| --- | --- |
| Node.js | 20 LTS ou 22 LTS |
| npm | 10+ |
| PostgreSQL | 16+ (développé sur 18) |
| Reverse proxy | Nginx, Caddy ou équivalent, avec TLS |
| Stockage | Volume persistant pour `storage/ordonnances/` |

Ressources minimales indicatives : 1 vCPU, 1 Go de RAM, 10 Go de disque
(hors fichiers d'ordonnances).

---

## 2. Environnements

| Variable | Développement | Production |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://agharas:...@localhost:5432/agharas` | URL managée, TLS activé |
| `TEST_DATABASE_URL` | base `agharas_test` | absente |
| `AUTH_SECRET` | secret local | **32 octets aléatoires, unique** |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | `https://<domaine>` |
| `PRESCRIPTION_STORAGE_DIR` | `./storage/ordonnances` | chemin **absolu** sur volume dédié |
| `NODE_ENV` | `development` | `production` |

Les identifiants `SEED_*` ne doivent être définis qu'en développement.

---

## 3. Base de données

### Développement

```bash
docker compose up -d
npm run db:push
npm run db:seed
```

Le conteneur crée `agharas` et `agharas_test`
(`docker/initdb/01-create-test-db.sql`).

### Production — migrations versionnées

Le projet utilise actuellement `prisma db push` (pratique en développement, sans
historique). **Avant la production**, créer un historique de migrations sur une
base vierge :

```bash
npx prisma migrate dev --name init
```

Puis, en déploiement :

```bash
npx prisma migrate deploy
npx prisma generate
```

Ne **jamais** lancer `db push --force-reset` ni `db:seed` en production.

### Sauvegardes

- Dump quotidien : `pg_dump --format=custom`.
- Volume `storage/ordonnances/` sauvegardé **au même moment** que la base (les
  chemins stockés doivent rester cohérents).
- Tester une restauration complète au moins une fois avant le go-live.

---

## 4. Build et démarrage

```bash
npm ci
npx prisma migrate deploy
npm run build          # prisma generate + next build
npm run start -- --port 3000
```

Recommandé : superviser avec **systemd**, **PM2** ou un orchestrateur
(Docker/Kubernetes). Exemple systemd :

```ini
[Unit]
Description=AGHARAS VISION OPTIQUE
After=network.target postgresql.service

[Service]
Type=simple
User=agharas
WorkingDirectory=/srv/agharas
EnvironmentFile=/srv/agharas/.env.production
ExecStart=/usr/bin/npm run start -- --port 3000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Image Docker (exemple)

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "run", "start", "--", "--port", "3000"]
```

Monter un volume sur `PRESCRIPTION_STORAGE_DIR` (ex. `/data/ordonnances`) et
veiller à ce que l'utilisateur du processus puisse y écrire (mode `0600` sur les
fichiers).

---

## 5. Reverse proxy et TLS

Exemple Nginx :

```nginx
server {
  listen 443 ssl http2;
  server_name optique.example.ma;

  ssl_certificate     /etc/letsencrypt/live/optique.example.ma/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/optique.example.ma/privkey.pem;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    client_max_body_size 12m;   # aligné sur la limite des Server Actions
  }
}
```

- Rediriger HTTP → HTTPS.
- `client_max_body_size` ≥ 12 Mo (ordonnances jusqu'à 10 Mo + marge).
- Ne pas mettre en cache les routes `/compte`, `/admin`, `/api` ni
  `/commande/confirmation/*`.
- Ajouter une limitation de débit par IP au niveau du proxy (complément au
  limiteur applicatif en mémoire).

---

## 6. Persistance et sauvegardes

| Donnée | Emplacement | Sauvegarde |
| --- | --- | --- |
| Base | PostgreSQL | `pg_dump` quotidien + rétention |
| Ordonnances | `PRESCRIPTION_STORAGE_DIR` | Snapshot du volume |
| Images publiques | `public/images/` | Versionnées dans le dépôt |
| Secrets | Gestionnaire de secrets | Sauvegarde chiffrée hors ligne |

Les ordonnances sont des **données de santé** : chiffrer le volume au repos si
l'hébergeur ne le fait pas, restreindre les accès, et journaliser les
restaurations.

---

## 7. Supervision

- Vérifier la disponibilité de `GET /` (et éventuellement `/robots.txt`).
- Surveiller les erreurs 5xx et les pics d'échecs de connexion.
- Centraliser les logs (stdout du processus Node).
- Surveiller l'espace disque du volume d'ordonnances.
- Prévoir une alerte si la base est inaccessible (`db.ts` échouera au premier
  accès).

---

## 8. Checklist go-live

### Bloquants

- [ ] `AUTH_SECRET` de production généré (32 octets) et stocké hors du dépôt.
- [ ] Comptes de démonstration supprimés ou mots de passe changés.
- [ ] Transport e-mail configuré (réinitialisation + confirmation de commande).
- [ ] Politique de rétention des ordonnances validée et purge planifiée.
- [ ] Migrations versionnées appliquées (`prisma migrate deploy`).
- [ ] Contenus légaux réels : ICE, RC, IF, adresse, e-mails, téléphones.
- [ ] Logo officiel fourni et intégré.
- [ ] Sauvegarde base + volume testée (restauration incluse).
- [ ] TLS actif et redirection HTTP → HTTPS.

### Recommandés

- [ ] CSP stricte et HSTS au niveau du proxy.
- [ ] Rate limiting par IP au proxy + store partagé si multi-instances.
- [ ] MFA pour les comptes staff.
- [ ] Analyse antivirus des fichiers téléversés.
- [ ] Supervision/alerting et logs centralisés.
- [ ] Test de charge léger (catalogue, panier, commande).
- [ ] Vérification mobile réelle (390 px) et lecteur d'écran.
- [ ] `Lighthouse` sur accueil, catalogue et fiche produit.

---

## 9. Rollback

1. Redéployer la version précédente du build (artefact ou image étiquetée).
2. Si une migration est en cause : restaurer le dump pris avant déploiement
   (Prisma ne génère pas de rollback automatique).
3. Conserver le volume d'ordonnances intact : il n'est pas versionné avec le code.

---

## 10. Limites de l'hébergement actuel

- Développement réalisé sous Windows avec PostgreSQL local ; Docker n'était pas
  disponible sur la machine de développement. Le `docker-compose.yml` fourni
  n'a donc **pas été exécuté** dans cet environnement — il doit être validé sur
  la cible.
- Aucun pipeline CI/CD n'est encore en place (proposition dans
  `docs/TESTING.md`).
- Aucun déploiement réel n'a été effectué : ce document décrit la procédure
  cible, pas un environnement déjà en ligne.
