"use server";

import { newsletterSchema } from "@/lib/validation";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export type FormState = {
  ok: boolean;
  message: string;
} | null;

export async function subscribeNewsletterAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = newsletterSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Adresse e-mail invalide.",
    };
  }

  const limit = rateLimit(`newsletter:${parsed.data.email}`, 3, 60_000);
  if (!limit.ok) {
    return { ok: false, message: "Veuillez patienter avant de réessayer." };
  }

  try {
    await db.newsletterSubscriber.upsert({
      where: { email: parsed.data.email },
      create: { email: parsed.data.email },
      update: { isActive: true },
    });
    return {
      ok: true,
      message:
        "Merci. Votre inscription au Cercle Privilège est bien enregistrée. Vous recevrez nos prochaines correspondances.",
    };
  } catch {
    return {
      ok: false,
      message: "Une erreur est survenue. Merci de réessayer.",
    };
  }
}
