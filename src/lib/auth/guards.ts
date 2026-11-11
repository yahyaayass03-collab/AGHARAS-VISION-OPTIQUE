import "server-only";

import { redirect } from "next/navigation";
import { getSessionUser, accessSubject, type SessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { isOwner } from "@/lib/auth/owner";

export class AuthorizationError extends Error {
  constructor(message = "Accès refusé.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requirePermission(
  permission: string,
  options?: { forbiddenRedirect?: string },
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/connexion?suivant=${encodeURIComponent("/admin")}`);
  if (!isOwner(user) || !hasPermission(accessSubject(user), permission)) {
    redirect(options?.forbiddenRedirect ?? "/admin/acces-refuse");
  }
  return user;
}

export async function assertPermission(permission: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthorizationError("Authentification requise.");
  if (!isOwner(user) || !hasPermission(accessSubject(user), permission)) {
    throw new AuthorizationError(
      "Votre rôle ne permet pas cette opération.",
    );
  }
  return user;
}

export async function canAccessAdmin(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  return isOwner(user);
}
