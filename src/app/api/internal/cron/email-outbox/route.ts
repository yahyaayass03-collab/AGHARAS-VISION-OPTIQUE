import { timingSafeEqual } from "node:crypto";
import { processPendingOrderEmailBatch } from "@/lib/order-email-notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization") ?? "";
  if (!secret || Buffer.byteLength(secret) < 32 || !authorization.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice(7));
  const expected = Buffer.from(secret);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export async function POST(request: Request): Promise<Response> {
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await processPendingOrderEmailBatch(2);
    return Response.json({ ok: true, ...result }, {
      headers: { "Cache-Control": "private, no-store, max-age=0" },
    });
  } catch {
    // Do not emit email contents, customer details, credentials or provider errors.
    console.error(JSON.stringify({ event: "cron.email_outbox.failed" }));
    return Response.json({ error: "Email outbox processing failed" }, { status: 500 });
  }
}
