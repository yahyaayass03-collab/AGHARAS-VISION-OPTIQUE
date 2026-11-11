import { describe, expect, it } from "vitest";
import { verifyMigrationIntent } from "../../scripts/migration-safety.mjs";

const valid = {
  DATABASE_URL: "mysql://app:secret@127.0.0.1:3307/agharas_mariadb_test",
  MIGRATION_EXPECTED_DATABASE: "agharas_mariadb_test",
  MIGRATION_CONFIRM_TARGET: "agharas_mariadb_test",
  MIGRATION_TARGET_EMPTY_CONFIRMED: "true",
};

function rejectionReason(input: Parameters<typeof verifyMigrationIntent>[0], identity?: Parameters<typeof verifyMigrationIntent>[1]): string {
  const result = verifyMigrationIntent(input, identity);
  if (result.ok) throw new Error("Expected migration intent to be rejected.");
  return result.reason;
}

describe("explicit Prisma migration safety guard", () => {
  it("accepts only an explicitly confirmed MariaDB target with matching connected identity", () => {
    expect(verifyMigrationIntent(valid, { database: "agharas_mariadb_test", schema: "" })).toEqual({ ok: true });
  });

  it("blocks unconfirmed or mismatched targets and connected identity mismatch", () => {
    expect(rejectionReason({ ...valid, MIGRATION_TARGET_EMPTY_CONFIRMED: "false" })).toBe("backup_or_empty_target_not_confirmed");
    expect(rejectionReason({ ...valid, MIGRATION_CONFIRM_TARGET: "another_db" })).toBe("explicit_target_confirmation_mismatch");
    expect(rejectionReason(valid, { database: "another_db", schema: "" })).toBe("connected_target_identity_mismatch");
    expect(rejectionReason({ ...valid, DATABASE_URL: "mysql://app:secret@127.0.0.1:3307/another_db" })).toBe("url_database_does_not_match_expected_target");
  });

  it("rejects PostgreSQL, malformed, and database-less URLs", () => {
    expect(rejectionReason({ ...valid, DATABASE_URL: "postgresql://app:secret@localhost/db" })).toBe("database_url_must_use_mysql_provider");
    expect(rejectionReason({ ...valid, DATABASE_URL: "not-a-url" })).toBe("database_url_invalid");
    expect(rejectionReason({ ...valid, DATABASE_URL: "mysql://app:secret@localhost/" })).toBe("url_database_does_not_match_expected_target");
  });
});
