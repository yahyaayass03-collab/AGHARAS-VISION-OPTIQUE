import { afterEach, describe, expect, it, vi } from "vitest";
import { logOperationalFailure } from "@/lib/operational-log";

describe("operational failure logging", () => {
  afterEach(() => vi.restoreAllMocks());

  it("emits a structured identifier and safe error metadata without the message", () => {
    const output = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const operationId = logOperationalFailure("checkout.transaction_failed", new Error("secret prescription / customer@example.invalid"));
    const record = JSON.parse(String(output.mock.calls[0]?.[0]));
    expect(record).toMatchObject({ level: "error", event: "checkout.transaction_failed", operationId, errorName: "Error" });
    expect(operationId).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(record)).not.toContain("prescription");
    expect(JSON.stringify(record)).not.toContain("customer@example.invalid");
  });
});
