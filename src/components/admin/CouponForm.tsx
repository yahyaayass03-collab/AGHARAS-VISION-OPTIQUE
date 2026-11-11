"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveCouponAction } from "@/app/actions/admin/commerce";
import type { AdminState } from "@/lib/admin";
import {
  AdminCheckbox,
  AdminField,
  AdminSelect,
  AdminTextArea,
  FormFeedback,
  SubmitButton,
} from "@/components/admin/FormBits";

export type CouponValues = {
  id: string;
  code: string;
  description: string;
  type: "PERCENT" | "FIXED";
  value: string;
  minSubtotal: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  isActive: boolean;
};

export function CouponForm({
  coupon,
  onDone,
}: {
  coupon?: CouponValues;
  onDone?: string;
}) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    saveCouponAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      {coupon?.id && <input type="hidden" name="id" value={coupon.id} />}
      <FormFeedback state={state} />

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField
          label="Code"
          name="code"
          required
          defaultValue={coupon?.code}
          placeholder="CERCLE10"
          hint="Lettres et chiffres, sans espace. Converti en majuscules."
          error={state?.fieldErrors?.code}
        />
        <AdminSelect
          label="Type de remise"
          name="type"
          required
          defaultValue={coupon?.type ?? "PERCENT"}
          options={[
            { value: "PERCENT", label: "Pourcentage du sous-total" },
            { value: "FIXED", label: "Montant fixe en dirhams" },
          ]}
          error={state?.fieldErrors?.type}
        />
        <AdminField
          label="Valeur"
          name="value"
          type="number"
          step="1"
          min={1}
          required
          defaultValue={coupon?.value}
          placeholder="10"
          hint="Pourcentage (1 à 100) ou montant en dirhams selon le type."
          error={state?.fieldErrors?.value}
        />
        <AdminField
          label="Seuil minimum (DH)"
          name="minSubtotal"
          defaultValue={coupon?.minSubtotal}
          placeholder="800"
          hint="Sous-total minimum requis. Laisser vide si aucun seuil."
          error={state?.fieldErrors?.minSubtotal}
        />
        <AdminField
          label="Début de validité"
          name="startsAt"
          type="date"
          defaultValue={coupon?.startsAt}
          error={state?.fieldErrors?.startsAt}
        />
        <AdminField
          label="Fin de validité"
          name="endsAt"
          type="date"
          defaultValue={coupon?.endsAt}
          error={state?.fieldErrors?.endsAt}
        />
        <AdminField
          label="Utilisations maximum"
          name="usageLimit"
          type="number"
          min={1}
          defaultValue={coupon?.usageLimit}
          placeholder="Illimité"
          hint="Nombre total de commandes pouvant utiliser ce code."
          error={state?.fieldErrors?.usageLimit}
        />
      </div>

      <AdminTextArea
        label="Description interne"
        name="description"
        rows={2}
        defaultValue={coupon?.description}
        placeholder="Offre de bienvenue du Cercle Privilège…"
        error={state?.fieldErrors?.description}
      />

      <AdminCheckbox
        label="Code actif"
        name="isActive"
        defaultChecked={coupon?.isActive ?? true}
        hint="Un code inactif est refusé au panier, même s'il n'est pas expiré."
      />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton label={coupon ? "Enregistrer les modifications" : "Créer le code"} />
        {onDone && (
          <Link href={onDone} className="btn-quiet btn-sm">
            Annuler
          </Link>
        )}
      </div>
    </form>
  );
}
