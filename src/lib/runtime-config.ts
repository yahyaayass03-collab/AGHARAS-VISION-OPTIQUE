export type RuntimeEnvironment = Record<string, string | undefined>;

const isLocalHost = (host: string) =>
  host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]";
const isAbsolutePath = (value: string) => value.startsWith("/") || /^[a-z]:[\\/]/i.test(value);

export function validatePublicSiteOrigin(value: string | undefined): string[] {
  try {
    const origin = new URL(value ?? "");
    if (origin.protocol !== "https:" || isLocalHost(origin.hostname) || origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash) {
      return ["NEXT_PUBLIC_SITE_URL doit être l'origine HTTPS publique, sans chemin, identifiant ni paramètre."];
    }
    return [];
  } catch {
    return ["NEXT_PUBLIC_SITE_URL doit être configurée avec l'origine HTTPS officielle."];
  }
}

export function validateRuntimeConfiguration(env: RuntimeEnvironment): string[] {
  if (env.NODE_ENV !== "production") return [];
  if (env.APP_ENVIRONMENT === "test") return [];

  const errors: string[] = [];
  if (env.APP_ENVIRONMENT !== "staging" && env.APP_ENVIRONMENT !== "production") {
    errors.push("APP_ENVIRONMENT doit valoir staging ou production au démarrage du runtime de production.");
  }

  errors.push(...validatePublicSiteOrigin(env.NEXT_PUBLIC_SITE_URL));

  try {
    const db = new URL(env.DATABASE_URL ?? "");
    if (db.protocol !== "mysql:" || !db.hostname || !db.username || !db.pathname.replace(/^\//, "")) {
      errors.push("DATABASE_URL doit être une URL MariaDB/MySQL valide fournie par Hostinger.");
    }
  } catch {
    errors.push("DATABASE_URL MariaDB/MySQL valide est requise.");
  }

  if (Buffer.byteLength(env.AUTH_SECRET ?? "", "utf8") < 32 || /remplacer|placeholder|change.?me|example|dev.?secret/i.test(env.AUTH_SECRET ?? "")) {
    errors.push("AUTH_SECRET doit contenir au moins 32 octets aléatoires uniques.");
  }
  if (Buffer.byteLength(env.CRON_SECRET ?? "", "utf8") < 32 || /placeholder|change.?me|example/i.test(env.CRON_SECRET ?? "")) {
    errors.push("CRON_SECRET doit contenir au moins 32 octets aléatoires uniques.");
  }
  if (!env.OWNER_EMAIL || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(env.OWNER_EMAIL)) {
    errors.push("OWNER_EMAIL doit désigner le compte propriétaire provisionné hors bande.");
  }
  if (["SEED_ADMIN_EMAIL", "SEED_ADMIN_PASSWORD", "SEED_STAFF_EMAIL", "SEED_STAFF_PASSWORD", "SEED_CUSTOMER_EMAIL", "SEED_CUSTOMER_PASSWORD", "OWNER_PASSWORD"].some((key) => env[key])) {
    errors.push("Les identifiants SEED_* et OWNER_PASSWORD de provisionnement doivent être absents du runtime staging/production.");
  }

  const driver = env.OBJECT_STORAGE_DRIVER ?? "filesystem";
  if (driver === "filesystem") {
    if (env.NODE_ENV === "production") {
      errors.push("Le stockage filesystem n'est pas admis en production hébergée sans volume persistant vérifié; configurez OBJECT_STORAGE_DRIVER=s3.");
    }
    for (const key of ["PRESCRIPTION_STORAGE_DIR", "PUBLIC_MEDIA_DIR"] as const) {
      if (!env[key] || !isAbsolutePath(env[key]!)) {
        errors.push(`${key} doit pointer vers un volume persistant absolu.`);
      }
    }
  } else if (driver === "s3") {
    if (!env.OBJECT_STORAGE_BUCKET || !env.OBJECT_STORAGE_REGION) {
      errors.push("OBJECT_STORAGE_BUCKET et OBJECT_STORAGE_REGION sont requis pour le stockage S3 privé.");
    }
    if (Boolean(env.OBJECT_STORAGE_ACCESS_KEY_ID) !== Boolean(env.OBJECT_STORAGE_SECRET_ACCESS_KEY)) {
      errors.push("Les identifiants S3 doivent être fournis ensemble ou via le rôle d'identité de l'hébergeur.");
    }
    if (env.OBJECT_STORAGE_ENDPOINT) {
      try {
        if (new URL(env.OBJECT_STORAGE_ENDPOINT).protocol !== "https:") errors.push("OBJECT_STORAGE_ENDPOINT doit utiliser HTTPS.");
      } catch {
        errors.push("OBJECT_STORAGE_ENDPOINT doit être une URL HTTPS valide.");
      }
    }
  } else {
    errors.push("OBJECT_STORAGE_DRIVER doit valoir filesystem ou s3.");
  }

  const publicMediaDriver = env.PUBLIC_MEDIA_STORAGE_DRIVER ?? "object";
  if (publicMediaDriver !== "object" && publicMediaDriver !== "mariadb") {
    errors.push("PUBLIC_MEDIA_STORAGE_DRIVER doit valoir mariadb ou object.");
  }
  if (publicMediaDriver === "mariadb") {
    const limit = Number(env.PUBLIC_MEDIA_MAX_TOTAL_BYTES);
    if (!Number.isSafeInteger(limit) || limit < 2 * 1024 * 1024) {
      errors.push("PUBLIC_MEDIA_MAX_TOTAL_BYTES doit être un entier d'au moins 2097152 octets.");
    }
  }

  const mailMode = env.EMAIL_TRANSPORT;
  if (mailMode === "smtp") {
    const port = Number(env.SMTP_PORT ?? 587);
    if (!env.EMAIL_FROM || !env.SMTP_HOST || !Number.isInteger(port) || port < 1 || port > 65535) {
      errors.push("EMAIL_FROM, SMTP_HOST et SMTP_PORT valides sont requis avec EMAIL_TRANSPORT=smtp.");
    }
    if (Boolean(env.SMTP_USER) !== Boolean(env.SMTP_PASSWORD)) {
      errors.push("Les identifiants SMTP doivent être fournis ensemble.");
    }
  } else if (mailMode === "discard" && env.APP_ENVIRONMENT !== "staging") {
    errors.push("EMAIL_TRANSPORT=discard n'est permis que pour les tests et le staging sans envoi réel.");
  } else if (mailMode !== "discard") {
    errors.push("EMAIL_TRANSPORT doit être explicitement smtp ou discard.");
  }

  return errors;
}

export function assertRuntimeConfiguration(env: RuntimeEnvironment = process.env): void {
  const errors = validateRuntimeConfiguration(env);
  if (errors.length) throw new Error(`Configuration de staging/production invalide:\n- ${errors.join("\n- ")}`);
}
