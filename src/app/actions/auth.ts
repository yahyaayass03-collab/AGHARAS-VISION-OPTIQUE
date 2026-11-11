"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroyCurrentSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { rateLimit } from "@/lib/rate-limit";
import { isOwner } from "@/lib/auth/owner";
import { loginSchema } from "@/lib/validation";

export type AuthState = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string>;
} | null;

/** Seules les destinations internes sont acceptées (pas d'open redirect). */
function safeNext(value: string | null | undefined): string {
  if (!value) return "/admin";
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value;
}

/**
 * Connexion réservée au propriétaire / à l'équipe d'administration.
 * La boutique publique ne propose ni inscription ni connexion client.
 */
export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Identifiants invalides.",
    };
  }

  const limit = rateLimit(`login:${parsed.data.email}`, 6, 5 * 60_000);
  if (!limit.ok) {
    return {
      ok: false,
      message: `Trop de tentatives. Réessayez dans ${limit.retryAfterSeconds} secondes.`,
    };
  }

  const user = await db.user.findUnique({
    where: { email: parsed.data.email },
    include: { role: true },
  });

  // Message identique pour un compte inexistant, inactif, sans droit
  // d'administration ou un mot de passe erroné : aucune énumération possible.
  const invalid: AuthState = {
    ok: false,
    message: "Identifiants administrateur incorrects.",
  };

  if (!user || !user.isActive) return invalid;
  if (!isOwner(user)) {
    return invalid;
  }

  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return invalid;

  await createSession(user.id);

  revalidatePath("/", "layout");
  redirect(safeNext(parsed.data.next));
}

export async function logoutAction(): Promise<void> {
  await destroyCurrentSession();
  revalidatePath("/", "layout");
  redirect("/");
}
