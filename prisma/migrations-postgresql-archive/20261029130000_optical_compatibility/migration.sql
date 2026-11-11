-- Aucune décision médicale n'est créée pour les données existantes.
CREATE TYPE "OpticalReviewStatus" AS ENUM ('APPROVED', 'INCOMPATIBLE', 'PENDING_REVIEW');
CREATE TABLE "OpticalCompatibilityRule" (
  "id" TEXT NOT NULL,
  "signature" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "variantId" TEXT NOT NULL,
  "lensTypeId" TEXT NOT NULL,
  "lensIndexId" TEXT NOT NULL,
  "treatmentIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "status" "OpticalReviewStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
  "reviewer" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "evidence" TEXT,
  "actorEmail" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OpticalCompatibilityRule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OpticalCompatibilityRule_review_check" CHECK ("status" = 'PENDING_REVIEW' OR ("reviewer" IS NOT NULL AND length(trim("reviewer")) > 0 AND "reviewedAt" IS NOT NULL))
);
CREATE UNIQUE INDEX "OpticalCompatibilityRule_signature_key" ON "OpticalCompatibilityRule"("signature");
CREATE INDEX "OpticalCompatibilityRule_productId_variantId_idx" ON "OpticalCompatibilityRule"("productId", "variantId");
CREATE INDEX "OpticalCompatibilityRule_status_idx" ON "OpticalCompatibilityRule"("status");
ALTER TABLE "OpticalCompatibilityRule" ADD CONSTRAINT "OpticalCompatibilityRule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpticalCompatibilityRule" ADD CONSTRAINT "OpticalCompatibilityRule_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpticalCompatibilityRule" ADD CONSTRAINT "OpticalCompatibilityRule_lensTypeId_fkey" FOREIGN KEY ("lensTypeId") REFERENCES "LensType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OpticalCompatibilityRule" ADD CONSTRAINT "OpticalCompatibilityRule_lensIndexId_fkey" FOREIGN KEY ("lensIndexId") REFERENCES "LensIndex"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
