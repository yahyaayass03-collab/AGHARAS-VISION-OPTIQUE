import "server-only";

import type { Prisma } from "@prisma/client";

/**
 * Lock the singleton InnoDB mutex row inside the caller's interactive
 * transaction. The lock is released by InnoDB on commit/rollback and works
 * across application instances sharing this MariaDB database.
 */
export async function lockOpticalReviewCheckout(tx: Prisma.TransactionClient): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT \`id\` FROM \`DatabaseMutex\`
    WHERE \`id\` = ${"optical-review-checkout"}
    FOR UPDATE
  `;
  if (rows.length !== 1) {
    throw new Error("MariaDB optical/checkout mutex row is missing; refusing to continue.");
  }
}
