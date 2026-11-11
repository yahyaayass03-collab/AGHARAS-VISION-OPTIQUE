-- Adds an atomic, application-enforced cap for media BLOB growth. Existing
-- business data and media records are untouched.
CREATE TABLE `PublicMediaQuota` (
  `id` VARCHAR(32) NOT NULL,
  `bytesUsed` INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE=InnoDB;

INSERT INTO `PublicMediaQuota` (`id`, `bytesUsed`) VALUES ('public-media', 0);
