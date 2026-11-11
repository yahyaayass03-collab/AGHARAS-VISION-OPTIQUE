"use client";

import { useActionState } from "react";
import { saveVariantAction } from "@/app/actions/admin/catalog";
import type { AdminState } from "@/lib/admin";
import {
  AdminField,
  FormFeedback,
  SubmitButton,
} from "@/components/admin/FormBits";

export function VariantForm({
  productId,
  productSlug,
}: {
  productId: string;
  productSlug: string;
}) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    saveVariantAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="slug" value={productSlug} />
      <FormFeedback state={state} />
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField
          label="Coloris"
          name="colorName"
          required
          placeholder="Or pur"
          error={state?.fieldErrors?.colorName}
        />
        <AdminField
          label="Couleur (hexadécimal)"
          name="colorHex"
          required
          type="color"
          defaultValue="#CFB56A"
          error={state?.fieldErrors?.colorHex}
          hint="Sélecteur de couleur natif."
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <AdminField
          label="SKU variante"
          name="sku"
          required
          placeholder="AVO-MAR-004-OR"
          error={state?.fieldErrors?.sku}
        />
        <AdminField
          label="Prix spécifique (DH)"
          name="price"
          inputMode="decimal"
          placeholder="Laisser vide = prix produit"
          error={state?.fieldErrors?.price}
        />
        <AdminField
          label="Stock initial"
          name="stock"
          type="number"
          min={0}
          max={9999}
          defaultValue={0}
          error={state?.fieldErrors?.stock}
        />
      </div>
      <SubmitButton
        label="Ajouter le coloris"
        pendingLabel="Ajout…"
        className="btn-primary btn-sm"
      />
    </form>
  );
}
