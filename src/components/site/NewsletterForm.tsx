"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { subscribeNewsletterAction, type FormState } from "@/app/actions/newsletter";
import { Icon } from "@/components/ui/Icon";

const initialState: FormState = null;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="btn-primary shrink-0 disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "Inscription…" : "S'inscrire"}
    </button>
  );
}

export function NewsletterForm() {
  const [state, formAction] = useActionState(subscribeNewsletterAction, initialState);

  return (
    <div className="mx-auto max-w-xl">
      <form action={formAction} className="flex flex-col gap-0 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Votre adresse électronique
        </label>
        <input
          id="newsletter-email"
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="Votre adresse électronique…"
          className="field flex-1 border-r-0 py-3.5"
        />
        <SubmitButton />
      </form>
      <div aria-live="polite" className="mt-3 min-h-[1.25rem]">
        {state && (
          <p
            className={`flex items-center justify-center gap-2 text-body-sm ${
              state.ok ? "text-success" : "text-error"
            }`}
          >
            <Icon name={state.ok ? "check" : "alert"} size={16} />
            {state.message}
          </p>
        )}
      </div>
      <p className="mt-1 text-[0.7rem] text-outline">
        Désabonnement en un clic à tout moment. Données traitées conformément à notre
        politique de confidentialité.
      </p>
    </div>
  );
}
