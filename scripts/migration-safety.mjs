export function verifyMigrationIntent(env, actualIdentity) {
  const required = ["DATABASE_URL", "MIGRATION_EXPECTED_DATABASE", "MIGRATION_CONFIRM_TARGET"];
  const missing = required.filter((key) => !env[key]?.trim());
  if (missing.length) return { ok: false, reason: "missing_required_configuration", keys: missing };
  if (env.MIGRATION_BACKUP_VERIFIED !== "true" && env.MIGRATION_TARGET_EMPTY_CONFIRMED !== "true") {
    return { ok: false, reason: "backup_or_empty_target_not_confirmed" };
  }
  if (env.MIGRATION_CONFIRM_TARGET !== env.MIGRATION_EXPECTED_DATABASE) {
    return { ok: false, reason: "explicit_target_confirmation_mismatch" };
  }

  let databaseUrl;
  try { databaseUrl = new URL(env.DATABASE_URL); } catch { return { ok: false, reason: "database_url_invalid" }; }
  if (databaseUrl.protocol !== "mysql:") return { ok: false, reason: "database_url_must_use_mysql_provider" };
  let databaseName;
  try { databaseName = decodeURIComponent(databaseUrl.pathname.replace(/^\//, "")); }
  catch { return { ok: false, reason: "database_url_invalid" }; }
  if (!databaseName || databaseName !== env.MIGRATION_EXPECTED_DATABASE) {
    return { ok: false, reason: "url_database_does_not_match_expected_target" };
  }
  if (actualIdentity && actualIdentity.database !== env.MIGRATION_EXPECTED_DATABASE) {
    return { ok: false, reason: "connected_target_identity_mismatch", actual: actualIdentity };
  }
  return { ok: true };
}
