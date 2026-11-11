# Host agharasvision.com on Hostinger — step-by-step

This guide matches the current MariaDB version of this project. It does not mean the Hostinger account has been accessed or the application has been deployed.

## 1. Confirm Node.js support in your plan

Hostinger currently lists **Unlimited** with **5 Web Apps**, including managed Next.js support. Confirm your individual subscription in hPanel: open **Websites → Add website / Create site** and look for **Node.js Apps / Web App**. Labels can vary between accounts and older subscriptions.

The required deployment type is **Next.js with server rendering**. Your app needs Node.js **22.23.0 or newer within 22.x**. Its build script rejects Node 20, older Node 22 releases, and Node 24.

If the Node.js option is missing, send Hostinger support:

> My domain is agharasvision.com and my plan is Unlimited Web Hosting. Does this specific account support managed Next.js SSR applications? My project uses Next.js 15, Prisma 6 and MariaDB/MySQL, and requires Node >=22.23.0 <23. Please confirm the available Node 22 patch version, the database hostname reachable from the app, and how I can run one-time Prisma migration commands or use Remote MySQL from my computer.

Continue once this is confirmed. If a website already occupies the domain, preserve its files and database and ask how to attach the new Node app; do not delete it to free the domain.

## 2. Prepare the project on your Windows computer

Open PowerShell in the project:

```powershell
Set-Location 'D:\PROJETs\e-agharass-vision-mariadb'
node --version
```

The result must be at least `v22.23.0`, within Node 22.

Install the locked dependencies if needed:

```powershell
npm ci
```

Run each setup command separately and resolve any failure before continuing.

## 3. Create the application database

1. In the hosting dashboard, open **Databases → Management / MySQL Databases**.
2. Create a new, empty database, for example with suffix `agharas`.
3. Create its database user and password, and grant that user access to this database.
4. Record the complete names, including Hostinger's account prefixes.
5. Hostinger's managed Node.js database guide specifies **`127.0.0.1:3306`** for its hosted app-to-database connection. Confirm with support if your account uses a different database arrangement.
6. Open phpMyAdmin and confirm you selected the new, empty database. Record the server version; `SELECT VERSION();` can show it.

The runtime URL has this structure:

```text
mysql://DB_USER:URL_ENCODED_PASSWORD@127.0.0.1:3306/DB_NAME?connection_limit=5&connect_timeout=15&pool_timeout=10
```

Replace every placeholder. Percent-encode special characters in the password, for example `@` → `%40`, `#` → `%23`, and `%` → `%25`. Include any TLS options required by Hostinger.

This loopback address is for the app running on Hostinger. Your Windows computer must use the external hostname from **Remote MySQL**, not `127.0.0.1`.

## 4. Create your business mailbox

1. Open **Emails → agharasvision.com → Manage**.
2. Create a mailbox such as `contact@agharasvision.com`, if it does not already exist.
3. Set its mailbox password.
4. Open **Connect Apps & Devices / Manual configuration** and copy the SMTP settings.

For Hostinger Email, the usual settings are `smtp.hostinger.com`, port `465`, with the full mailbox address as the username. Use the settings shown for your actual email service if they differ. The app also supports port `587` with STARTTLS.

The SMTP password is the mailbox password, not the Hostinger login password. The app requires `EMAIL_FROM` to be a plain email address, such as `contact@agharasvision.com`.

Verify the email service's MX, SPF and DKIM records in its dashboard. Preserve these records when attaching the website domain.

## 5. Set up uploaded-file storage

The current production configuration requires **S3-compatible object storage**, including for private prescription uploads. A hosting disk or the Daily Backup add-on does not replace this requirement.

One compatible choice is Cloudflare R2:

1. Sign in to Cloudflare and enable **R2 Object Storage**. Review the provider's pricing when activating it.
2. Choose **Create bucket** and name it, for example, `agharasvision-uploads`.
3. Leave public bucket access disabled.
4. In R2, open **Manage API Tokens**.
5. Create an R2 API token with **Object Read & Write** access limited to this bucket.
6. Save the generated **Access Key ID**, **Secret Access Key**, and **S3 endpoint**.

Configuration:

```text
OBJECT_STORAGE_DRIVER=s3
OBJECT_STORAGE_BUCKET=agharasvision-uploads
OBJECT_STORAGE_REGION=auto
OBJECT_STORAGE_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
OBJECT_STORAGE_ACCESS_KEY_ID=YOUR_R2_ACCESS_KEY_ID
OBJECT_STORAGE_SECRET_ACCESS_KEY=YOUR_R2_SECRET_ACCESS_KEY
```

Use the exact endpoint Cloudflare provides. These are the generated S3 credentials, not a general Cloudflare API token. Using R2 does not require moving your domain's DNS to Cloudflare. Local filesystem path variables can be omitted with this configuration.

## 6. Create the database tables

The following route uses your Windows computer to run Prisma against Hostinger's database. It requires **Remote MySQL access**. Hostinger documents that managed-app npm commands cannot be run through ordinary hosting SSH. If Remote MySQL is unavailable, ask support for a supported migration workflow before proceeding. Hostinger supports build-time Prisma commands, but this project's migration guards and one-time owner setup need a deliberate configuration rather than changing the build command blindly.

### Allow the connection

1. In hPanel, open **Databases → Remote MySQL**, if available.
2. Allow your current public IP address for the new database.
3. Copy the external database hostname. It may differ from the hostname used by the hosted app.
4. Build a migration connection URL with that hostname and any required TLS settings.

### Run Prisma

In your project PowerShell window:

```powershell
$env:DATABASE_URL = Read-Host 'Paste the remote database connection URL'
npm run db:generate
```

For the intentionally empty database created in step 3:

```powershell
$env:MIGRATION_EXPECTED_DATABASE = 'REPLACE_WITH_FULL_DATABASE_NAME'
$env:MIGRATION_CONFIRM_TARGET = 'REPLACE_WITH_FULL_DATABASE_NAME'
$env:MIGRATION_TARGET_EMPTY_CONFIRMED = 'true'
npm run db:deploy
```

Both database names must match the real database name exactly. The script verifies the connected database identity before applying the versioned migrations.

Then check:

```powershell
npx prisma migrate status
```

Expected result: the database schema is up to date. Tables should now appear in phpMyAdmin.

For an existing business database, use the documented backup-confirmed migration procedure instead of the empty-database flag. Do not use the demo seed, `db push`, or `migrate reset` to initialize production.

## 7. Create the administrator account

Keep the same PowerShell window and database connection:

```powershell
$env:OWNER_EMAIL = 'contact@agharasvision.com'
$securePassword = Read-Host 'Choose the administrator password' -AsSecureString
$env:OWNER_PASSWORD = [System.Net.NetworkCredential]::new('', $securePassword).Password
npm run owner:provision
Remove-Item Env:OWNER_PASSWORD
Remove-Variable securePassword
```

Choose the email you actually want to use as administrator. The password must contain at least eight characters, an uppercase letter, a lowercase letter, a digit and a symbol.

Expected output reports that the owner account was created. Running this command again for an existing owner changes its password and revokes previous sessions.

## 8. Generate the application secrets and upload archive

Run this command twice, keeping the two different results:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Use the first result as `AUTH_SECRET`, and the second as `CRON_SECRET`.

Generate a fresh deployment ZIP from the current source:

```powershell
npm run package:hostinger
```

Output:

```text
dist/hostinger-business-package.zip
```

The filename contains `business`, but the archive is usable on a compatible Unlimited plan. The archive has `package.json` at its root and excludes local secrets, dependencies, generated builds, private uploads and demo seed data. Hostinger must install and build it on Linux.

## 9. Add the Node.js application

1. Open **Websites → Add website → Node.js App**.
2. Select **Upload your website files**.
3. Upload `dist/hostinger-business-package.zip`.
4. Associate `agharasvision.com`, following hPanel's domain workflow. If it is already attached to another site, use the supported reassignment process.
5. Review the build settings:

| Setting | Value |
| --- | --- |
| Framework | Next.js, server-rendered |
| Node.js | 22.x; actual patch must be >=22.23.0 |
| Project root | Directory containing `package.json` |
| Package manager | npm |
| Install command, if editable | `npm ci` |
| Build command | `npm run build` |
| Output, if requested | `.next` |
| Start command, if requested | `npm run start` |
| Entry file | Use the Next.js preset; no custom entry file |

Add the environment variables before triggering the final build. Keep development build dependencies available during installation; TypeScript, Prisma and Tailwind are needed for the build.

## 10. Configure environment variables

In the Node app's **Environment variables** section, enter each name and value separately. Replace the placeholders below; do not paste inline comments as values.

### Application

```dotenv
NODE_ENV=production
APP_ENVIRONMENT=staging
NEXT_PUBLIC_SITE_URL=https://agharasvision.com
NEXT_PUBLIC_CONTACT_EMAIL=contact@agharasvision.com
NEXT_PUBLIC_WHATSAPP_NUMBER=REPLACE_WITH_REAL_BUSINESS_NUMBER
OWNER_EMAIL=contact@agharasvision.com
AUTH_SECRET=REPLACE_WITH_FIRST_GENERATED_SECRET
CRON_SECRET=REPLACE_WITH_SECOND_GENERATED_SECRET
DATABASE_URL=REPLACE_WITH_DATABASE_URL_FOR_THE_HOSTED_APP
```

`staging` initially adds search-engine noindex headers while you configure the shop. It is not a login barrier. Switch it to `production` when ready to launch. `OWNER_EMAIL` must match the account created in step 7.

Use your actual mailbox and contact details. If Hostinger manages `NODE_ENV`, verify it uses `production`.

### Storage

Add all six R2 variables from step 5.

### Email

```dotenv
EMAIL_TRANSPORT=smtp
EMAIL_FROM=contact@agharasvision.com
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=contact@agharasvision.com
SMTP_PASSWORD=REPLACE_WITH_MAILBOX_PASSWORD
```

Use the actual SMTP details from step 4. Do not add `OWNER_PASSWORD`, `SEED_*`, test database variables, or migration confirmation variables to the web app's environment.

The `NEXT_PUBLIC_*` variables are embedded at build time, so changing them requires rebuilding the app.

## 11. Deploy and connect HTTPS

1. Click **Deploy / Build**.
2. Open the deployment logs.
3. Confirm dependency installation, Prisma Client generation, and the Next.js build succeed.
4. Confirm the app starts successfully in runtime logs.
5. Follow hPanel's DNS instructions for `agharasvision.com` and, if used, `www.agharasvision.com`.
6. Preserve the business email DNS records.
7. Wait for DNS resolution and the HTTPS certificate to become active.
8. Open `https://agharasvision.com`.

Use the DNS destination provided by hPanel rather than an assumed server IP. If you use a temporary domain for initial testing, set `NEXT_PUBLIC_SITE_URL` to that HTTPS origin and rebuild again when switching to the final domain.

## 12. Populate the shop

Log in at:

```text
https://agharasvision.com/admin/connexion
```

Use the owner email and password from step 7. Relevant administration pages:

| Page | Purpose |
| --- | --- |
| `/admin/parametres` | Business settings and existing shipping methods |
| `/admin/categories` | Product categories |
| `/admin/marques` | Brands |
| `/admin/produits` | Products |
| `/admin/stock` | Inventory |
| `/admin/apparence` | Storefront appearance |
| `/admin/contenu` | Site content |
| `/admin/verres` | Lens configuration |

The deployment ZIP does not transfer your local database or uploaded files. A new database starts without your product catalogue. Add your real business content or arrange a separate transfer of existing business data.

### Initialize a shipping method on a fresh database

The current administration form edits existing shipping methods but does not create them. If the `ShippingMethod` table is empty, initialize your real delivery method before testing checkout.

In phpMyAdmin, select the application database and open **SQL**. The following is a template for one standard delivery method. Replace `REPLACE_WITH_PRICE_IN_CENTIMES` with your actual fee: for example, 40 DH is `4000`. Adjust the name and description to match your service.

```sql
INSERT INTO `ShippingMethod`
  (`id`, `code`, `name`, `description`, `priceCents`, `isActive`, `sortOrder`)
VALUES
  ('shipping_standard', 'STANDARD', 'Livraison standard',
   'Livraison à domicile', REPLACE_WITH_PRICE_IN_CENTIMES, 1, 0);
```

Run this only once for a new method. Afterwards, edit its name and price through `/admin/parametres`. If importing existing business data instead, use its shipping methods.

## 13. Schedule pending order emails

The project includes an email outbox processing script.

1. Open the Node website dashboard → **Advanced → Cron Jobs**.
2. Start with a schedule of every five minutes: `*/5 * * * *`.
3. Use the following command, replacing `YOUR_HOSTINGER_USERNAME` with the actual hosting username and confirming the deployed paths:

```sh
/opt/alt/alt-nodejs22/root/bin/node --env-file=/home/YOUR_HOSTINGER_USERNAME/domains/agharasvision.com/hbuilds/config/.env /home/YOUR_HOSTINGER_USERNAME/domains/agharasvision.com/hbuilds/current/nodejs/scripts/run-email-outbox-cron.mjs
```

Keep it on one line. Hostinger limits the command to 255 characters. The `--env-file` argument is necessary because cron does not automatically inherit the Node application's environment variables.

Inspect the cron output after it runs. The script calls the protected POST endpoint `/api/internal/cron/email-outbox`; successful output includes `cron.email_outbox.completed`.

The endpoint processes at most two orders per invocation, so adjust the schedule to order volume and the plan's limits if a backlog develops.

## 14. Test and launch

Verify:

- Home page, catalogue and product images load.
- Administrator login works.
- A product image upload remains available after a redeployment.
- A test cash-on-delivery order has correct product totals, shipping and stock changes.
- The order appears in `/admin/commandes`.
- Confirmation email arrives and cron completes successfully.
- A prescription upload can be read by the authorized administrator.
- Mobile navigation and checkout work.

When ready, change `APP_ENVIRONMENT` to `production` and redeploy. Confirm the storefront no longer sends the staging `X-Robots-Tag: noindex` header.

Verify what your Daily Backup add-on covers for the Node app and database. R2 objects are held by a separate provider and need their own recovery arrangement.

After the one-time database setup, close the administrative PowerShell session and remove the temporary Remote MySQL IP authorization if you no longer need it.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| No Node.js option | Ask Hostinger to confirm your exact Unlimited plan entitlement |
| `requires_node_22_23_or_newer_within_22_x` | Actual build Node version, not just the major-version selector |
| Prisma P1001 | Database host/port, app connectivity, Remote MySQL IP rules if running locally |
| Prisma P1000 | Full prefixed username, password and URL encoding |
| Missing tables / Prisma P2021 | Migration ran against the same database used by the app |
| Runtime configuration error | Required secrets, site URL, owner email, storage and SMTP variables |
| S3 access error | Bucket, endpoint and bucket-scoped R2 S3 credentials |
| SMTP login error | Mailbox username/password, SMTP host/port |
| No shipping choices | Active rows in `ShippingMethod` |
| Old URL in links | Change `NEXT_PUBLIC_SITE_URL` and rebuild |
| Cron fails | Paths, Node version, env file, HTTPS origin and `CRON_SECRET` |

## Official references

- [Hostinger Node.js deployment](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger)
- [Hostinger Node.js build settings](https://docs.hostinger.com/node.js/build-settings.md)
- [Hostinger managed Node.js database connection](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [Hostinger Remote MySQL](https://www.hostinger.com/support/1583546-how-to-set-up-remote-mysql-access-in-hostinger/)
- [Hostinger Email settings](https://www.hostinger.com/support/4305847-set-up-hostinger-email-on-your-applications-and-devices/)
- [Hostinger Node.js cron jobs](https://www.hostinger.com/support/how-to-run-cron-jobs-for-node-js-websites-at-hostinger/)
- [Cloudflare R2 S3 setup](https://developers.cloudflare.com/r2/get-started/s3/)

Project-specific migration reference: `docs/HOSTINGER_MARIADB_DEPLOYMENT_FR.md`. Older project deployment documents contain PostgreSQL/Neon instructions; this guide uses the current MariaDB schema.
