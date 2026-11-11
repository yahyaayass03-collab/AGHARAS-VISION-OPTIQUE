CREATE TYPE "OrderEmailKind" AS ENUM ('OWNER_ORDER', 'CUSTOMER_CONFIRMATION');
CREATE TYPE "OrderEmailStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'DISCARDED', 'FAILED');

CREATE TABLE "OrderEmailNotification" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "kind" "OrderEmailKind" NOT NULL,
  "status" "OrderEmailStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderEmailNotification_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrderEmailNotification_orderId_kind_key"
  ON "OrderEmailNotification"("orderId", "kind");
CREATE INDEX "OrderEmailNotification_status_createdAt_idx"
  ON "OrderEmailNotification"("status", "createdAt");

ALTER TABLE "OrderEmailNotification"
  ADD CONSTRAINT "OrderEmailNotification_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
