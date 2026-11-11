-- Tombstones prevent deleted MariaDB-backed URLs from falling through to a
-- legacy object-storage backend and accidentally reappearing.
ALTER TABLE `PublicMediaObject`
  ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT FALSE;
