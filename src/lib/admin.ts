import "server-only";

import type { ZodError } from "zod";

export type AdminState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
} | null;

export function toFieldErrors(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export function checked(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

/** Traduit une erreur Prisma lisible en message utilisateur. */
export function prismaMessage(error: unknown, fallback: string): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
  ) {
    return "Cette valeur unique (slug, référence ou e-mail) est déjà utilisée.";
  }
  return fallback;
}
