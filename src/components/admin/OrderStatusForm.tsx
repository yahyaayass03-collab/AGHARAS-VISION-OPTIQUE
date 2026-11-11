"use client";

import { useActionState } from "react";
import { updateOrderStatusAction } from "@/app/actions/admin/commerce";
import type { AdminState } from "@/lib/admin";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { AdminField, FormFeedback, SubmitButton } from "@/components/admin/FormBits";

export function OrderStatusForm({
  orderId,
  currentStatus,
  allowed,
}: {
  orderId: string;
  currentStatus: string;
  allowed: string[];
}) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    updateOrderStatusAction,
    null,
  );

  if (allowed.length === 0) {
    return (
      <div className="space-y-3">
        <FormFeedback state={state} />
        <p className="border border-outline-variant bg-surface-dim px-3 py-2.5 text-[0.76rem] text-on-surface-variant">
          Aucune transition n&apos;est possible depuis le statut «{" "}
          {ORDER_STATUS_LABELS[currentStatus] ?? currentStatus} ».
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />
      <FormFeedback state={state} />
      <AdminField
        label="Note interne (facultatif)"
        name="note"
        placeholder="Appel client, contrôle optique, information transporteur…"
        error={state?.fieldErrors?.note}
      />
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="order-status" className="field-label">
            Nouveau statut
          </label>
          <select
            id="order-status"
            name="status"
            required
            defaultValue={allowed[0]}
            className="admin-input"
          >
            {allowed.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status] ?? status}
                {status === "CANCELLED" ? " — restaure le stock" : ""}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton label="Mettre à jour" pendingLabel="Mise à jour…" />
      </div>
      <p className="text-[0.68rem] leading-relaxed text-outline">
        Le changement est horodaté et journalisé. L&apos;annulation restaure le
        stock des coloris concernés ; une commande livrée ou annulée est
        définitive.
      </p>
    </form>
  );
}
