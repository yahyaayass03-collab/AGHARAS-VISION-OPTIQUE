-- Keep the catalogue rows so historical order snapshots and references remain valid.
-- Progressive lenses are inactive for all new configurations.
UPDATE "LensType"
SET "isActive" = false,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "kind" = 'PROGRESSIVE'::"LensKind"
  AND "isActive" = true;
