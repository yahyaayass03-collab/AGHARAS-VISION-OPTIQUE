import "server-only";

import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { sendOutboundEmail } from "@/lib/email";
import { getSettings } from "@/lib/settings";
import { logOperationalFailure } from "@/lib/operational-log";
import { customerOrderConfirmationEmail, ownerOrderEmail } from "@/lib/order-email-templates";

type NotificationSettings = Record<string, string>;

export async function enqueueOrderEmailNotifications(
  tx: Prisma.TransactionClient,
  order: { id: string; email: string },
  settings: NotificationSettings,
): Promise<void> {
  const records: Array<{ orderId: string; kind: "OWNER_ORDER" | "CUSTOMER_CONFIRMATION" }> = [];
  if (settings["order.owner_email_enabled"] !== "false") {
    records.push({ orderId: order.id, kind: "OWNER_ORDER" });
  }
  if (settings["order.customer_confirmation_enabled"] === "true" && order.email.trim()) {
    records.push({ orderId: order.id, kind: "CUSTOMER_CONFIRMATION" });
  }
  for (const record of records) {
    await tx.orderEmailNotification.create({ data: record });
  }
}

function safeErrorCode(error: unknown): string {
  if (error && typeof error === "object") {
    const value = (error as { code?: unknown }).code;
    if ((typeof value === "string" || typeof value === "number") && /^[A-Za-z0-9_-]{1,40}$/.test(String(value))) {
      return String(value);
    }
  }
  return "DELIVERY_FAILED";
}

function ownerOrderAddress(): string {
  const address = process.env.OWNER_EMAIL?.trim();
  if (!address || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    throw Object.assign(new Error("Owner notification recipient is not configured."), { code: "OWNER_EMAIL_MISSING" });
  }
  return address;
}

function adminOrderUrl(orderId: string): string | undefined {
  try {
    const origin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) return undefined;
    return new URL(`/admin/commandes/${encodeURIComponent(orderId)}`, origin).toString();
  } catch {
    return undefined;
  }
}

/**
 * Delivers durable outbox rows only after the order transaction has committed.
 * A conditional status update claims each row, so concurrent checkout replays
 * cannot send the same notification concurrently. Failed rows require an
 * explicit replay or owner retry; sent/discarded rows are terminal.
 */
export async function dispatchOrderEmailNotifications(
  orderId: string,
  options: { retryFailed?: boolean } = {},
): Promise<void> {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true, emailNotifications: true },
  });
  if (!order) return;

  const settings = await getSettings();
  for (const notification of order.emailNotifications) {
    const retryable = notification.status === "PENDING" || (options.retryFailed === true && notification.status === "FAILED");
    if (!retryable) continue;

    const enabled = notification.kind === "OWNER_ORDER"
      ? settings["order.owner_email_enabled"] !== "false"
      : settings["order.customer_confirmation_enabled"] === "true";
    if (!enabled) {
      await db.orderEmailNotification.updateMany({
        where: { id: notification.id, status: notification.status },
        data: { status: "DISCARDED", lastErrorCode: "WORKFLOW_DISABLED" },
      });
      continue;
    }

    const claimed = await db.orderEmailNotification.updateMany({
      where: {
        id: notification.id,
        status: options.retryFailed ? { in: ["PENDING", "FAILED"] } : "PENDING",
      },
      data: { status: "SENDING", attempts: { increment: 1 }, lastAttemptAt: new Date(), lastErrorCode: null },
    });
    if (claimed.count !== 1) continue;

    try {
      let message;
      if (notification.kind === "OWNER_ORDER") {
        message = ownerOrderEmail(order, ownerOrderAddress(), adminOrderUrl(order.id));
      } else {
        if (!order.email.trim()) {
          await db.orderEmailNotification.update({ where: { id: notification.id }, data: { status: "DISCARDED", lastErrorCode: "CUSTOMER_EMAIL_MISSING" } });
          continue;
        }
        message = customerOrderConfirmationEmail(order, order.email, {
          name: settings["store.name"] ?? "",
          email: settings["store.email"] ?? "",
          phone: settings["store.phone"] ?? "",
        });
      }
      const result = await sendOutboundEmail(message);
      await db.orderEmailNotification.update({
        where: { id: notification.id },
        data: { status: result.status === "sent" ? "SENT" : "DISCARDED", sentAt: result.status === "sent" ? new Date() : null, lastErrorCode: null },
      });
    } catch (error) {
      const errorCode = safeErrorCode(error);
      await db.orderEmailNotification.update({
        where: { id: notification.id },
        data: { status: "FAILED", lastErrorCode: errorCode },
      });
      logOperationalFailure("order_email.delivery_failed", error);
    }
  }
}

export async function dispatchPendingOrderEmails(orderId: string, retryFailed = false): Promise<void> {
  try {
    await dispatchOrderEmailNotifications(orderId, { retryFailed });
  } catch (error) {
    // Delivery is best-effort after commit; diagnostics must never unwind a committed order.
    logOperationalFailure("order_email.dispatch_failed", error);
  }
}

/**
 * Finite cron batch. A stale SENDING row is ambiguous (SMTP may already have
 * accepted it), so it is parked as FAILED for explicit owner review, never
 * automatically resent. Only a bounded number of distinct orders is claimed.
 */
export async function processPendingOrderEmailBatch(batchSize = 2): Promise<{
  selectedOrders: number;
  ambiguousRowsParked: number;
}> {
  const limit = Math.max(1, Math.min(2, Math.floor(batchSize)));
  const staleBefore = new Date(Date.now() - 15 * 60_000);
  const ambiguous = await db.orderEmailNotification.updateMany({
    where: { status: "SENDING", lastAttemptAt: { lt: staleBefore } },
    data: { status: "FAILED", lastErrorCode: "AMBIGUOUS_SENDING" },
  });
  const pending = await db.orderEmailNotification.findMany({
    where: { status: "PENDING" },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: limit,
    select: { orderId: true },
  });
  const orderIds = [...new Set(pending.map((row) => row.orderId))];
  for (const orderId of orderIds) {
    await dispatchOrderEmailNotifications(orderId);
  }
  return { selectedOrders: orderIds.length, ambiguousRowsParked: ambiguous.count };
}

export async function currentOrderEmailSettings(): Promise<NotificationSettings> {
  return getSettings();
}
