"use client";

import { useActionState } from "react";
import { adjustStockAction } from "@/app/actions/admin/catalog";
import type { AdminState } from "@/lib/admin";
import { FormFeedback } from "@/components/admin/FormBits";

export function StockAdjustForm({ variantId }: { variantId: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    adjustStockAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="variantId" value={variantId} />
      <div className="flex items-center justify-end gap-1.5">
        <label htmlFor={`delta-${variantId}`} className="sr-only">
          Ajustement
        </label>
        <input
          id={`delta-${variantId}`}
          name="delta"
          type="number"
          required
          placeholder="±"
          className="w-16 border border-outline-variant bg-white px-2 py-1.5 text-right text-[0.78rem] text-primary focus:border-primary"
        />
        <label htmlFor={`note-${variantId}`} className="sr-only">
          Motif
        </label>
        <input
          id={`note-${variantId}`}
          name="note"
          placeholder="Motif (facultatif)"
          maxLength={200}
          className="w-40 border border-outline-variant bg-white px-2 py-1.5 text-[0.75rem] text-primary focus:border-primary"
        />
        <button type="submit" className="btn-primary btn-sm px-3 py-1.5">
          Ajuster
        </button>
      </div>
      <FormFeedback state={state} />
    </form>
  );
}
