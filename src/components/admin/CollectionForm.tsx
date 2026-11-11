"use client";

import { useActionState } from "react";
import { saveCollectionAction } from "@/app/actions/admin/collections";
import { AdminCheckbox, AdminField, AdminTextArea, FormFeedback, SubmitButton } from "@/components/admin/FormBits";
import type { AdminState } from "@/lib/admin";

type Collection = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  tagline?: string | null;
};

export function CollectionForm({ kind, item }: { kind: "category" | "brand"; item?: Collection }) {
  const [state, action] = useActionState<AdminState, FormData>(saveCollectionAction, null);
  return (
    <form action={action} className="space-y-3 border border-outline-variant bg-white p-4">
      <input type="hidden" name="kind" value={kind} />
      {item && <input type="hidden" name="id" value={item.id} />}
      <FormFeedback state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField name="name" label="Nom" required defaultValue={item?.name} error={state?.fieldErrors?.name} />
        <AdminField name="slug" label="Identifiant (URL)" required defaultValue={item?.slug} error={state?.fieldErrors?.slug} />
      </div>
      {kind === "category" && <AdminField name="tagline" label="Accroche" defaultValue={item?.tagline ?? ""} />}
      <AdminTextArea name="description" label="Description" rows={2} defaultValue={item?.description ?? ""} />
      <AdminField name="sortOrder" label="Ordre d'affichage" type="number" min={0} defaultValue={item?.sortOrder ?? 0} />
      <AdminField name="imageUrl" label="Image existante (chemin local)" defaultValue={item?.imageUrl ?? ""} />
      <label className="block text-body-sm text-primary">
        {kind === "brand" ? "Importer le logo" : "Importer l'image de collection"} (JPEG, PNG, WebP · 5 Mo)
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="admin-input mt-1" />
      </label>
      {item?.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt={`Visuel ${item.name}`} className="h-24 max-w-full object-contain" />
      )}
      <AdminCheckbox name="isActive" label="Visible sur la boutique" defaultChecked={item?.isActive ?? true} />
      <SubmitButton label={item ? "Enregistrer" : "Ajouter"} />
    </form>
  );
}
