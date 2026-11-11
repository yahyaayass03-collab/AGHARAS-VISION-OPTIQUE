"use client";

import { useActionState } from "react";
import { loginAction, type AuthState } from "@/app/actions/auth";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Icon } from "@/components/ui/Icon";

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}

      {state && !state.ok && (
        <p
          role="alert"
          className="flex items-start gap-2 border border-error/30 bg-error-container px-3 py-2.5 text-body-sm text-error"
        >
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {state.message}
        </p>
      )}

      <div>
        <label htmlFor="login-email" className="field-label">
          Identifiant · adresse e-mail
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="vous@exemple.ma"
          className="field"
        />
        {state?.fieldErrors?.email && (
          <p className="field-error-text">{state.fieldErrors.email}</p>
        )}
      </div>

      <div>
        <PasswordInput
          name="password"
          label="Mot de passe"
          autoComplete="current-password"
          error={state?.fieldErrors?.password}
        />
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full gap-2 py-3.5">
        <Icon name="lock" size={15} />
        {pending ? "Connexion…" : "Se connecter"}
        {!pending && <Icon name="arrow-right" size={15} />}
      </button>

      <p className="text-center text-[0.68rem] leading-relaxed text-outline">
        Accès strictement réservé à l&apos;administration. Les clients n&apos;ont
        pas besoin de compte pour commander.
      </p>
    </form>
  );
}
