-- Database-enforced fail-closed optical review invariant.
ALTER TABLE `OpticalCompatibilityRule`
  ADD CONSTRAINT `OpticalCompatibilityRule_review_check`
  CHECK (
    `status` = 'PENDING_REVIEW'
    OR (
      `reviewer` IS NOT NULL
      AND CHAR_LENGTH(TRIM(`reviewer`)) > 0
      AND `reviewedAt` IS NOT NULL
    )
  );

-- Shared transaction-scoped row lock for checkout and optical rule changes.
INSERT INTO `DatabaseMutex` (`id`) VALUES ('optical-review-checkout');
