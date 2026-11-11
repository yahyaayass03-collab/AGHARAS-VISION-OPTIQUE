-- Stores optimized, owner-managed public catalogue/CMS images separately from
-- product rows. No existing records or customer prescription data are changed.
CREATE TABLE `PublicMediaObject` (
  `id` CHAR(32) NOT NULL,
  `mimeType` VARCHAR(32) NOT NULL,
  `sha256` CHAR(64) NOT NULL,
  `byteLength` INTEGER NOT NULL,
  `data` MEDIUMBLOB NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `PublicMediaObject_createdAt_idx` (`createdAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;
