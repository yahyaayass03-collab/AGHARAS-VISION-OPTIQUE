"use client";

import { useActionState } from "react";
import { saveLensOptionAction } from "@/app/actions/admin/lenses";
import { AdminCheckbox, AdminField, FormFeedback, SubmitButton } from "@/components/admin/FormBits";
import { centsToInput } from "@/lib/money";
import type { AdminState } from "@/lib/admin";
import { jsonStringList } from "@/lib/json-string-list";

export function LensOptionForm({ kind, item }: { kind: "type" | "index" | "treatment"; item: { id: string; name: string; priceCents: number; isActive: boolean; productTypes?: unknown } }) {
  const [state, action] = useActionState<AdminState, FormData>(saveLensOptionAction, null);
  return <form action={action} className="space-y-3 border border-outline-variant bg-white p-4">
    <input type="hidden" name="kind" value={kind} />
    <input type="hidden" name="id" value={item.id} />
    <h3 className="font-serif text-lg text-primary">{item.name}</h3>
    <FormFeedback state={state} />
    <AdminField name="price" label="Prix supplémentaire (DH)" defaultValue={centsToInput(item.priceCents)} inputMode="decimal" required />
    {kind === "type" && <fieldset className="space-y-1 text-body-sm text-primary">
      <legend>Types de produits compatibles</legend>
      <p className="text-on-surface-variant">À confirmer par votre opticien avant activation. Ne cochez que les compatibilités validées.</p>
      {([
        ["OPTICAL", "Montures optiques"], ["SUNGLASSES", "Solaires"], ["CLIP", "Clips"],
        ["CONTACT_LENS", "Lentilles"], ["ACCESSORY", "Accessoires"],
      ] as const).map(([value, label]) => <label key={value} className="flex gap-2">
        <input type="checkbox" name="productTypes" value={value} defaultChecked={jsonStringList(item.productTypes).includes(value)} />{label}
      </label>)}
    </fieldset>}
    <AdminCheckbox name="isActive" label="Disponible dans le configurateur" defaultChecked={item.isActive} />
    <SubmitButton label="Enregistrer" />
  </form>;
}
