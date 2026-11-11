"use client";
import { useActionState, useState } from "react";
import { saveOpticalDecisionAction } from "@/app/actions/admin/optical-compatibility";
import { FormFeedback, SubmitButton } from "@/components/admin/FormBits";
import type { AdminState } from "@/lib/admin";

type Option = { id: string; name: string };
type Product = Option & { variants: Option[] };
export function OpticalDecisionForm({ products, lenses, indices, treatments }: { products: Product[]; lenses: Option[]; indices: Option[]; treatments: Option[] }) {
  const [state, action] = useActionState<AdminState, FormData>(saveOpticalDecisionAction, null);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const variants = products.find((product) => product.id === productId)?.variants ?? [];
  return <form action={action} className="space-y-4 border border-outline-variant bg-white p-4">
    <FormFeedback state={state} />
    <p className="text-body-sm">Chaque décision porte sur ce coloris, ce verre, cet indice et l'ensemble exact des traitements sélectionnés. Une combinaison différente reste en attente.</p>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="field-label">Produit<select className="admin-input" name="productId" value={productId} onChange={(event) => setProductId(event.target.value)} required>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="field-label">Coloris<select key={productId} className="admin-input" name="variantId" required>{variants.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="field-label">Type de verre<select className="admin-input" name="lensTypeId" required>{lenses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label className="field-label">Indice<select className="admin-input" name="lensIndexId" required>{indices.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
    </div>
    <fieldset><legend className="field-label">Traitements de cette combinaison</legend><div className="grid gap-2 sm:grid-cols-2">{treatments.map((item) => <label key={item.id} className="text-body-sm"><input type="checkbox" name="treatmentIds" value={item.id} /> {item.name}</label>)}</div></fieldset>
    <label className="field-label">Décision<select className="admin-input" name="status" defaultValue="PENDING_REVIEW"><option value="PENDING_REVIEW">En attente de validation</option><option value="APPROVED">Compatible — Validé</option><option value="INCOMPATIBLE">Incompatible</option></select></label>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="field-label">Vérifié par (professionnel)<input name="reviewer" maxLength={160} className="admin-input" /></label>
      <label className="field-label">Date de validation<input name="reviewDate" type="date" className="admin-input" /></label>
    </div>
    <label className="field-label">Référence ou note de revue<input name="evidence" maxLength={1000} className="admin-input" /></label>
    <label className="flex gap-2 text-body-sm"><input type="checkbox" name="confirmed" /> Je confirme que la décision validée ou incompatible correspond à une revue réelle par le professionnel indiqué.</label>
    <SubmitButton label="Enregistrer" />
  </form>;
}
