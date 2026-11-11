"use client";

import { useActionState } from "react";
import { saveStoreAction } from "@/app/actions/admin/stores";
import { AdminCheckbox, AdminField, FormFeedback, SubmitButton } from "@/components/admin/FormBits";
import type { AdminState } from "@/lib/admin";

type StoreValues = {
  id: string; slug: string; name: string; city: string; address: string; phone: string;
  whatsapp: string | null; email: string | null; hours: string; sortOrder: number; isActive: boolean;
};

export function StoreForm({ store }: { store?: StoreValues }) {
  const [state, action] = useActionState<AdminState, FormData>(saveStoreAction, null);
  return <form action={action} className="space-y-3 border border-outline-variant bg-white p-4">
    {store && <input type="hidden" name="id" value={store.id} />}
    <FormFeedback state={state} />
    <div className="grid gap-3 sm:grid-cols-2">
      <AdminField name="name" label="Nom du salon" defaultValue={store?.name} required />
      <AdminField name="slug" label="Identifiant" defaultValue={store?.slug} required />
      <AdminField name="city" label="Ville" defaultValue={store?.city} required />
      <AdminField name="address" label="Adresse" defaultValue={store?.address} required />
      <AdminField name="phone" label="Téléphone" defaultValue={store?.phone} required />
      <AdminField name="whatsapp" label="WhatsApp" defaultValue={store?.whatsapp ?? ""} />
      <AdminField name="email" label="E-mail" type="email" defaultValue={store?.email ?? ""} />
      <AdminField name="hours" label="Horaires" defaultValue={store?.hours} required />
      <AdminField name="sortOrder" label="Ordre d'affichage" type="number" min={0} defaultValue={store?.sortOrder ?? 0} />
    </div>
    <AdminCheckbox name="isActive" label="Afficher ce salon" defaultChecked={store?.isActive ?? true} />
    <SubmitButton label={store ? "Enregistrer le salon" : "Ajouter le salon"} />
  </form>;
}
