"use client";

import { useActionState } from "react";
import { reviewPrescriptionAction } from "@/app/actions/admin/commerce";
import type { AdminState } from "@/lib/admin";
import { FormFeedback } from "@/components/admin/FormBits";

export function PrescriptionReviewForm({
  prescriptionId,
  status,
}: {
  prescriptionId: string;
  status: string;
}) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    reviewPrescriptionAction,
    null,
  );

  const decided = status === "VERIFIED" || status === "REJECTED";

  return (
    <form action={formAction} className="mt-2 space-y-2">
      <input type="hidden" name="id" value={prescriptionId} />
      <FormFeedback state={state} />
      <label
        htmlFor={`review-note-${prescriptionId}`}
        className="block text-[0.62rem] uppercase tracking-[0.1em] text-on-surface-variant"
      >
        Motif / note de contrôle
      </label>
      <textarea
        id={`review-note-${prescriptionId}`}
        name="reviewNote"
        rows={2}
        maxLength={500}
        placeholder="Contrôle optique, pièce illisible, correction à confirmer…"
        className="admin-input"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="status"
          value="VERIFIED"
          disabled={decided}
          className="btn-primary btn-sm"
        >
          Valider
        </button>
        <button
          type="submit"
          name="status"
          value="REJECTED"
          disabled={decided}
          className="btn-quiet btn-sm text-error"
        >
          Refuser
        </button>
        {decided && (
          <span className="self-center text-[0.68rem] text-outline">
            Décision déjà enregistrée — contactez le client si un nouveau
            contrôle est nécessaire.
          </span>
        )}
      </div>
    </form>
  );
}
