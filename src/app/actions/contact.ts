"use server";

import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validation";

export type ContactState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
} | null;

export async function sendContactMessageAction(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    subject: formData.get("subject"),
    message: formData.get("message"),
    consent: formData.get("consent"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Formulaire incomplet.",
      fieldErrors,
    };
  }

  const limit = rateLimit(`contact:${parsed.data.email}`, 3, 10 * 60_000);
  if (!limit.ok) {
    return {
      ok: false,
      message: "Trop de messages envoyés. Merci de patienter avant de réessayer.",
    };
  }

  await db.contactMessage.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
  });

  return {
    ok: true,
    message:
      "Votre message a bien été transmis à notre conciergerie. Nous vous répondons sous 24 h ouvrées.",
  };
}
