"use client";

import { useActionState } from "react";
import { saveShippingMethodAction } from "@/app/actions/admin/shipping";
import { AdminField, FormFeedback, SubmitButton } from "@/components/admin/FormBits";
import { centsToInput } from "@/lib/money";
import type { AdminState } from "@/lib/admin";

export function ShippingMethodForm({ method }: { method: { id: string; code: string; name: string; priceCents: number; freeFromCents: number | null } }) {
  const [state, action] = useActionState<AdminState, FormData>(saveShippingMethodAction, null);
  return <form action={action} className="space-y-3 border border-outline-variant bg-white p-4">
    <input type="hidden" name="id" value={method.id} />
    <p className="eyebrow">{method.code}</p>
    <FormFeedback state={state} />
    <AdminField name="name" label="Nom du mode de livraison" defaultValue={method.name} required />
    <div className="grid gap-3 sm:grid-cols-2">
      <AdminField name="price" label="Frais (DH)" inputMode="decimal" defaultValue={centsToInput(method.priceCents)} required />
      <AdminField name="freeFrom" label="Offerte à partir de (DH)" inputMode="decimal" defaultValue={method.freeFromCents == null ? "" : centsToInput(method.freeFromCents)} />
    </div>
    <SubmitButton label="Enregistrer la livraison" />
  </form>;
}
