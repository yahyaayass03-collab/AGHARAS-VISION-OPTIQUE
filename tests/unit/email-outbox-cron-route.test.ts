import { beforeEach, describe, expect, it, vi } from "vitest";

const { processBatch } = vi.hoisted(() => ({ processBatch: vi.fn() }));
vi.mock("@/lib/order-email-notifications", () => ({
  processPendingOrderEmailBatch: processBatch,
}));

import { POST } from "@/app/api/internal/cron/email-outbox/route";

describe("bounded email-outbox cron endpoint", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "s".repeat(48);
    processBatch.mockReset();
  });

  it("rejects missing, invalid, and short bearer secrets", async () => {
    const absent = await POST(new Request("https://shop.example/api/internal/cron/email-outbox", { method: "POST" }));
    const invalid = await POST(new Request("https://shop.example/api/internal/cron/email-outbox", {
      method: "POST",
      headers: { authorization: `Bearer ${"x".repeat(48)}` },
    }));
    expect(absent.status).toBe(401);
    expect(invalid.status).toBe(401);
    expect(processBatch).not.toHaveBeenCalled();
  });

  it("runs only the fixed small batch and returns non-sensitive counts", async () => {
    processBatch.mockResolvedValue({ selectedOrders: 1, ambiguousRowsParked: 0 });
    const response = await POST(new Request("https://shop.example/api/internal/cron/email-outbox", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(await response.json()).toEqual({ ok: true, selectedOrders: 1, ambiguousRowsParked: 0 });
    expect(processBatch).toHaveBeenCalledOnce();
    expect(processBatch).toHaveBeenCalledWith(2);
  });

  it("returns generic errors without exposing provider details", async () => {
    processBatch.mockRejectedValue(new Error("SMTP password/customer@example.com"));
    const response = await POST(new Request("https://shop.example/api/internal/cron/email-outbox", {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
    }));
    expect(response.status).toBe(500);
    expect(await response.text()).not.toMatch(/SMTP password|customer@example.com/);
  });
});
