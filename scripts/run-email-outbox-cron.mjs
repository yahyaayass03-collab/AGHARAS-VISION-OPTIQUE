const origin = process.env.NEXT_PUBLIC_SITE_URL;
const secret = process.env.CRON_SECRET;

if (!origin || !secret || Buffer.byteLength(secret) < 32) {
  console.error(JSON.stringify({ event: "cron.email_outbox.configuration_error" }));
  process.exit(2);
}

let endpoint;
try {
  const site = new URL(origin);
  if (site.protocol !== "https:" || site.username || site.password || site.pathname !== "/") {
    throw new Error("Invalid origin");
  }
  endpoint = new URL("/api/internal/cron/email-outbox", site);
} catch {
  console.error(JSON.stringify({ event: "cron.email_outbox.configuration_error" }));
  process.exit(2);
}

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, accept: "application/json" },
    signal: AbortSignal.timeout(100_000),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error(JSON.stringify({ event: "cron.email_outbox.http_error", status: response.status }));
    process.exit(1);
  }
  console.log(JSON.stringify({ event: "cron.email_outbox.completed", ...payload }));
} catch {
  console.error(JSON.stringify({ event: "cron.email_outbox.request_failed" }));
  process.exit(1);
}
