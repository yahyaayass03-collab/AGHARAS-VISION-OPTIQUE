import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  orderFindUnique: vi.fn(),
  notificationCreate: vi.fn(),
  notificationFindMany: vi.fn(),
  notificationUpdateMany: vi.fn(),
  notificationUpdate: vi.fn(),
  send: vi.fn(),
  settings: vi.fn(),
  log: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    order: { findUnique: mocks.orderFindUnique },
    orderEmailNotification: {
      create: mocks.notificationCreate,
      findMany: mocks.notificationFindMany,
      updateMany: mocks.notificationUpdateMany,
      update: mocks.notificationUpdate,
    },
  },
}));
vi.mock("@/lib/email", () => ({ sendOutboundEmail: mocks.send }));
vi.mock("@/lib/settings", () => ({ getSettings: mocks.settings }));
vi.mock("@/lib/operational-log", () => ({ logOperationalFailure: mocks.log }));

import {
  dispatchOrderEmailNotifications,
  enqueueOrderEmailNotifications,
  processPendingOrderEmailBatch,
} from "@/lib/order-email-notifications";
import { customerOrderConfirmationEmail } from "@/lib/order-email-templates";
import { formatDH } from "@/lib/money";

const sampleOrder = {
  id: "order_synthetic_1",
  reference: "AVO-2026-ABCD1234",
  createdAt: new Date("2026-11-05T10:00:00.000Z"),
  totalCents: 129900,
  paymentMethod: "CASH_ON_DELIVERY",
  shippingMethodName: "Livraison standard",
  city: "Casablanca",
  email: "client@example.invalid",
  items: [{ productName: "Monture synthétique", variantName: "Noir", quantity: 1, lineTotalCents: 129900, prescriptionId: "private-rx-id" }],
};

const notification = (id: string, kind: "OWNER_ORDER" | "CUSTOMER_CONFIRMATION", status = "PENDING") => ({
  id,
  kind,
  status,
  attempts: 0,
  orderId: sampleOrder.id,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("OWNER_EMAIL", "owner@example.invalid");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://shop.example.invalid");
  mocks.settings.mockResolvedValue({
    "order.owner_email_enabled": "true",
    "order.customer_confirmation_enabled": "true",
    "store.name": "Optique synthétique",
    "store.email": "contact@example.invalid",
    "store.phone": "+212600000000",
  });
  mocks.notificationCreate.mockResolvedValue({});
  mocks.notificationUpdateMany.mockResolvedValue({ count: 1 });
  mocks.notificationUpdate.mockResolvedValue({});
  mocks.send.mockResolvedValue({ status: "sent", messageId: "synthetic-message-id" });
});

afterEach(() => vi.unstubAllEnvs());

describe("order notification outbox", () => {
  it("queues one owner notice and only queues customer mail when enabled with an address", async () => {
    const tx = { orderEmailNotification: { create: mocks.notificationCreate } } as never;
    await enqueueOrderEmailNotifications(tx, { id: sampleOrder.id, email: sampleOrder.email }, {
      "order.owner_email_enabled": "true",
      "order.customer_confirmation_enabled": "true",
    });
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(2);
    expect(mocks.notificationCreate).toHaveBeenNthCalledWith(1, { data: { orderId: sampleOrder.id, kind: "OWNER_ORDER" } });
    expect(mocks.notificationCreate).toHaveBeenNthCalledWith(2, { data: { orderId: sampleOrder.id, kind: "CUSTOMER_CONFIRMATION" } });

    mocks.notificationCreate.mockClear();
    await enqueueOrderEmailNotifications(tx, { id: sampleOrder.id, email: "" }, {
      "order.owner_email_enabled": "true",
      "order.customer_confirmation_enabled": "true",
    });
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(1);
    expect(mocks.notificationCreate).toHaveBeenCalledWith({ data: { orderId: sampleOrder.id, kind: "OWNER_ORDER" } });
  });

  it("sends French owner/customer messages only once and marks successful outbox rows", async () => {
    const rows = [notification("n-owner", "OWNER_ORDER"), notification("n-customer", "CUSTOMER_CONFIRMATION")];
    mocks.orderFindUnique.mockResolvedValue({ ...sampleOrder, emailNotifications: rows });
    await dispatchOrderEmailNotifications(sampleOrder.id);
    expect(mocks.send).toHaveBeenCalledTimes(2);
    const ownerMessage = mocks.send.mock.calls[0]![0];
    const customerMessage = mocks.send.mock.calls[1]![0];
    expect(ownerMessage.to).toBe("owner@example.invalid");
    expect(ownerMessage.subject).toContain(sampleOrder.reference);
    expect(ownerMessage.text).toContain("Gérer cette commande");
    expect(ownerMessage.text).toContain("Monture synthétique");
    expect(ownerMessage.text).toContain(formatDH(sampleOrder.totalCents));
    expect(ownerMessage.text).toContain("Paiement à la livraison");
    expect(ownerMessage.text).not.toContain("client@example.invalid");
    expect(customerMessage.to).toBe(sampleOrder.email);
    expect(customerMessage.text).toContain("nous avons bien reçu votre commande");
    expect(customerMessage.text).toContain("ne vaut ni validation professionnelle");
    expect(customerMessage.text).toContain("Livraison standard");
    expect(customerMessage.text).toContain("Casablanca");
    expect(customerMessage.text).not.toContain("private-rx-id");
    expect(customerMessage.text).not.toContain("ordonnance.pdf");
    expect(mocks.notificationUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.notificationUpdate.mock.calls.map((call) => call[0].data.status)).toEqual(["SENT", "SENT"]);

    mocks.send.mockClear();
    mocks.orderFindUnique.mockResolvedValue({
      ...sampleOrder,
      emailNotifications: rows.map((row) => ({ ...row, status: "SENT" })),
    });
    await dispatchOrderEmailNotifications(sampleOrder.id, { retryFailed: true });
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("records failed delivery safely and retries only when explicitly requested", async () => {
    const row = notification("n-owner", "OWNER_ORDER");
    let status = "PENDING";
    mocks.orderFindUnique.mockImplementation(async () => ({
      ...sampleOrder,
      emailNotifications: [{ ...row, status }],
    }));
    mocks.notificationUpdateMany.mockImplementation(async ({ where, data }) => {
      if (where.status === status) {
        status = data.status;
        return { count: 1 };
      }
      if (where.status?.in?.includes(status)) {
        status = data.status;
        return { count: 1 };
      }
      return { count: 0 };
    });
    mocks.notificationUpdate.mockImplementation(async ({ data }) => {
      status = data.status;
      return {};
    });
    mocks.send.mockRejectedValueOnce(Object.assign(new Error("SMTP secret and customer@example.invalid"), { code: "ETIMEDOUT" }));

    await dispatchOrderEmailNotifications(sampleOrder.id);
    expect(status).toBe("FAILED");
    expect(mocks.notificationUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ lastErrorCode: "ETIMEDOUT" }) }));
    expect(mocks.log).toHaveBeenCalledWith("order_email.delivery_failed", expect.any(Error));

    mocks.send.mockClear();
    await dispatchOrderEmailNotifications(sampleOrder.id);
    expect(mocks.send).not.toHaveBeenCalled();

    mocks.send.mockResolvedValueOnce({ status: "sent", messageId: "synthetic-retry" });
    await dispatchOrderEmailNotifications(sampleOrder.id, { retryFailed: true });
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(status).toBe("SENT");
  });

  it("does not send when the owner destination is missing and honors disabled workflows", async () => {
    vi.stubEnv("OWNER_EMAIL", "");
    const ownerRow = notification("n-owner", "OWNER_ORDER");
    mocks.orderFindUnique.mockResolvedValue({ ...sampleOrder, emailNotifications: [ownerRow] });
    await dispatchOrderEmailNotifications(sampleOrder.id);
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.notificationUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "FAILED", lastErrorCode: "OWNER_EMAIL_MISSING" }) }));

    mocks.notificationUpdate.mockClear();
    mocks.settings.mockResolvedValue({ "order.owner_email_enabled": "false" });
    await dispatchOrderEmailNotifications(sampleOrder.id, { retryFailed: true });
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.notificationUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "DISCARDED", lastErrorCode: "WORKFLOW_DISABLED" }) }));
  });

  it("parks ambiguous stale sends and caps cron selection at two orders", async () => {
    mocks.notificationUpdateMany.mockResolvedValueOnce({ count: 3 });
    mocks.notificationFindMany.mockResolvedValue([
      { orderId: "order_synthetic_1" },
      { orderId: "order_synthetic_1" },
      { orderId: "order_synthetic_2" },
    ]);
    mocks.orderFindUnique.mockResolvedValue({ ...sampleOrder, emailNotifications: [] });

    const result = await processPendingOrderEmailBatch(500);

    expect(result).toEqual({ selectedOrders: 2, ambiguousRowsParked: 3 });
    expect(mocks.notificationUpdateMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({ status: "SENDING", lastAttemptAt: expect.objectContaining({ lt: expect.any(Date) }) }),
      data: { status: "FAILED", lastErrorCode: "AMBIGUOUS_SENDING" },
    }));
    expect(mocks.notificationFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: "PENDING" }, take: 2 }));
    expect(mocks.orderFindUnique).toHaveBeenCalledTimes(2);
    expect(mocks.send).not.toHaveBeenCalled();
  });
});

describe("customer confirmation template", () => {
  it("is French, gives order-receipt-only meaning and escapes dynamic HTML", () => {
    const message = customerOrderConfirmationEmail(sampleOrder, sampleOrder.email, {
      name: "Maison <Synthétique>", email: "contact@example.invalid", phone: "+212600000000",
    });
    expect(message.subject).toContain("Réception de votre commande");
    expect(message.text).toContain("aucune date d'expédition n'est promise");
    expect(message.html).toContain("Maison &lt;Synthétique&gt;");
    expect(message.html).not.toContain("<Synthétique>");
  });
});
