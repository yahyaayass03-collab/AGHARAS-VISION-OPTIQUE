import { afterEach, describe, expect, it, vi } from "vitest";
import { sendOutboundEmail } from "@/lib/email";

afterEach(() => vi.unstubAllEnvs());

describe("outbound email transport", () => {
  it("discards messages in explicit local test mode without sending", async () => {
    vi.stubEnv("EMAIL_TRANSPORT", "discard");
    vi.stubEnv("NODE_ENV", "test");
    await expect(sendOutboundEmail({ to: "synthetic@example.invalid", subject: "Synthetic", text: "Not transmitted" })).resolves.toEqual({ status: "discarded" });
  });

  it("rejects header injection", async () => {
    vi.stubEnv("EMAIL_TRANSPORT", "discard");
    vi.stubEnv("NODE_ENV", "test");
    await expect(sendOutboundEmail({ to: "synthetic@example.invalid\r\nBcc: victim@example.invalid", subject: "Synthetic", text: "x" })).rejects.toThrow(/Destinataire/);
  });

  it("fails closed when smtp mode is selected without server settings", async () => {
    vi.stubEnv("EMAIL_TRANSPORT", "smtp");
    vi.stubEnv("SMTP_HOST", "");
    vi.stubEnv("EMAIL_FROM", "");
    await expect(sendOutboundEmail({ to: "synthetic@example.invalid", subject: "Synthetic", text: "x" })).rejects.toThrow(/SMTP_HOST/);
  });
});
