import "server-only";

import nodemailer from "nodemailer";

export type OutboundEmail = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type EmailResult = { status: "sent"; messageId: string } | { status: "discarded" };

function requireHeaderSafe(value: string, label: string): void {
  if (!value.trim() || /[\r\n]/.test(value)) throw new Error(`${label} invalide.`);
}

export async function sendOutboundEmail(message: OutboundEmail): Promise<EmailResult> {
  requireHeaderSafe(message.to, "Destinataire e-mail");
  requireHeaderSafe(message.subject, "Objet e-mail");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(message.to)) throw new Error("Adresse e-mail destinataire invalide.");

  const mode = process.env.EMAIL_TRANSPORT;
  if (mode === "discard" && (process.env.NODE_ENV !== "production" || process.env.APP_ENVIRONMENT === "staging" || process.env.APP_ENVIRONMENT === "test")) {
    // Test/dev sink: deliberately does not log, persist, or transmit message data.
    return { status: "discarded" };
  }
  if (mode !== "smtp") {
    throw new Error("EMAIL_TRANSPORT doit être configuré sur smtp; en recette locale utilisez discard.");
  }

  const from = process.env.EMAIL_FROM?.trim();
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!from || !host || !Number.isInteger(port) || port < 1 || port > 65535 || Boolean(user) !== Boolean(pass)) {
    throw new Error("EMAIL_FROM, SMTP_HOST/SMTP_PORT et des identifiants SMTP complets si requis sont nécessaires.");
  }
  requireHeaderSafe(from, "Expéditeur e-mail");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(from)) throw new Error("Adresse expéditeur e-mail invalide.");

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: port !== 465,
    auth: user && pass ? { user, pass } : undefined,
    tls: { rejectUnauthorized: true },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  const sent = await transporter.sendMail({ from, to: message.to, subject: message.subject, text: message.text, html: message.html });
  return { status: "sent", messageId: sent.messageId };
}
