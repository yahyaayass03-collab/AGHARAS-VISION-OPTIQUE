"use client";

import Link from "next/link";
import { useActionState } from "react";
import { sendContactMessageAction, type ContactState } from "@/app/actions/contact";
import { Icon } from "@/components/ui/Icon";

const SUBJECTS = [
  "Conseil sur une monture",
  "Verres & ordonnance",
  "Suivi de commande",
  "Retour ou garantie",
  "Mutuelles & tiers payant",
  "Rendez-vous en salon",
  "Autre demande",
];

export function ContactForm({ defaultSubject }: { defaultSubject?: string }) {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(
    sendContactMessageAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`flex items-start gap-2 border px-3 py-2.5 text-body-sm ${
            state.ok
              ? "border-success/30 bg-success/10 text-success"
              : "border-error/30 bg-error-container text-error"
          }`}
        >
          <Icon
            name={state.ok ? "check" : "alert"}
            size={16}
            className="mt-0.5 shrink-0"
          />
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="field-label">
            Nom complet
          </label>
          <input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            className="field"
          />
          {state?.fieldErrors?.name && (
            <p className="field-error-text">{state.fieldErrors.name}</p>
          )}
        </div>
        <div>
          <label htmlFor="contact-email" className="field-label">
            E-mail
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="field"
          />
          {state?.fieldErrors?.email && (
            <p className="field-error-text">{state.fieldErrors.email}</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-phone" className="field-label">
            Téléphone (facultatif)
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="0612345678"
            className="field"
          />
          {state?.fieldErrors?.phone && (
            <p className="field-error-text">{state.fieldErrors.phone}</p>
          )}
        </div>
        <div>
          <label htmlFor="contact-subject" className="field-label">
            Objet
          </label>
          <select
            id="contact-subject"
            name="subject"
            required
            defaultValue={defaultSubject ?? SUBJECTS[0]}
            className="field"
          >
            {SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
          {state?.fieldErrors?.subject && (
            <p className="field-error-text">{state.fieldErrors.subject}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="contact-message" className="field-label">
          Votre message
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          minLength={20}
          placeholder="Précisez votre demande, la référence de commande concernée ou vos disponibilités."
          className="field resize-y"
        />
        <p className="field-hint">
          20 caractères minimum. Ne transmettez pas de données médicales
          sensibles dans ce formulaire.
        </p>
        {state?.fieldErrors?.message && (
          <p className="field-error-text">{state.fieldErrors.message}</p>
        )}
      </div>

      <label className="flex items-start gap-2.5 text-body-sm text-on-surface-variant">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
        />
        <span>
          J&apos;accepte que mes informations soient utilisées pour traiter ma
          demande, conformément à la{" "}
          <Link href="/confidentialite" className="link-underline text-primary">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>
      {state?.fieldErrors?.consent && (
        <p className="field-error-text">{state.fieldErrors.consent}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full gap-2 py-3.5 sm:w-auto">
        <Icon name="mail" size={15} />
        {pending ? "Envoi en cours…" : "Envoyer ma demande"}
      </button>
    </form>
  );
}
