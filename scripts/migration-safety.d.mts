export function verifyMigrationIntent(
  env: Record<string, string | undefined>,
  actualIdentity?: { database: string; schema: string },
): { ok: true } | { ok: false; reason: string; keys?: string[]; actual?: { database: string; schema: string } };
