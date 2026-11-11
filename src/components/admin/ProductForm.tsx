"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveProductAction } from "@/app/actions/admin/catalog";
import type { AdminState } from "@/lib/admin";
import { centsToInput } from "@/lib/money";
import { ProductImagesField } from "@/components/admin/ProductImagesField";
import {
  AdminCheckbox,
  AdminField,
  AdminSelect,
  AdminTextArea,
  FormFeedback,
  SubmitButton,
} from "@/components/admin/FormBits";

export type ProductAdminValues = {
  id?: string;
  name: string;
  slug: string;
  subtitle: string | null;
  description: string;
  story: string | null;
  brandId: string;
  categoryId: string;
  type: string;
  gender: string;
  material: string | null;
  shape: string;
  sku: string;
  priceCents: number;
  compareAtCents: number | null;
  badge: string | null;
  isActive: boolean;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  lensCompatible: boolean;
  weightGrams: number | null;
  lensWidthMm: number | null;
  bridgeMm: number | null;
  templeLengthMm: number | null;
  images: Array<{ url: string }>;
};

const TYPE_OPTIONS = [
  { value: "OPTICAL", label: "Lunettes de vue" },
  { value: "SUNGLASSES", label: "Solaires" },
  { value: "CLIP", label: "Clips 2-en-1" },
  { value: "CONTACT_LENS", label: "Lentilles" },
  { value: "ACCESSORY", label: "Accessoires" },
];

const GENDER_OPTIONS = [
  { value: "FEMME", label: "Femme" },
  { value: "HOMME", label: "Homme" },
  { value: "MIXTE", label: "Mixte" },
  { value: "ENFANT", label: "Enfant" },
];

const SHAPE_OPTIONS = [
  { value: "PANTOS", label: "Pantos" },
  { value: "RONDE", label: "Ronde" },
  { value: "RECTANGULAIRE", label: "Rectangulaire" },
  { value: "PAPILLON", label: "Papillon / Cat-eye" },
  { value: "CERCLEE", label: "Cerclée" },
  { value: "PERCEE", label: "Percée (Rimless)" },
  { value: "AUTRE", label: "Autre" },
];

export function ProductForm({
  product,
  brands,
  categories,
}: {
  product?: ProductAdminValues;
  brands: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    saveProductAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {product?.id && <input type="hidden" name="id" value={product.id} />}
      <FormFeedback state={state} />

      <section className="admin-card space-y-4">
        <h2 className="font-serif text-xl text-primary">Identité du produit</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <AdminField
            label="Nom"
            name="name"
            required
            defaultValue={product?.name}
            error={state?.fieldErrors?.name}
            placeholder="Le Marais N°04 Or Pur"
          />
          <AdminField
            label="Slug (URL)"
            name="slug"
            required
            defaultValue={product?.slug}
            error={state?.fieldErrors?.slug}
            hint="Minuscules, chiffres et tirets. Ex. le-marais-n04-or-pur"
          />
        </div>
        <AdminField
          label="Sous-titre"
          name="subtitle"
          defaultValue={product?.subtitle ?? ""}
          error={state?.fieldErrors?.subtitle}
          placeholder="Acétate italien, finitions à la main"
        />
        <AdminTextArea
          label="Description"
          name="description"
          rows={5}
          required
          defaultValue={product?.description}
          error={state?.fieldErrors?.description}
          hint="20 caractères minimum. Texte affiché sur la fiche produit."
        />
        <AdminTextArea
          label="Savoir-faire / histoire"
          name="story"
          rows={4}
          defaultValue={product?.story ?? ""}
          error={state?.fieldErrors?.story}
          hint="Facultatif. Affiché dans l'onglet « Savoir-faire »."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <AdminSelect
            label="Marque / atelier"
            name="brandId"
            required
            defaultValue={product?.brandId}
            options={brands.map((brand) => ({ value: brand.id, label: brand.name }))}
            error={state?.fieldErrors?.brandId}
          />
          <AdminSelect
            label="Catégorie"
            name="categoryId"
            required
            defaultValue={product?.categoryId}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            error={state?.fieldErrors?.categoryId}
          />
          <AdminSelect
            label="Type"
            name="type"
            required
            defaultValue={product?.type ?? "OPTICAL"}
            options={TYPE_OPTIONS}
            error={state?.fieldErrors?.type}
          />
        </div>
      </section>

      <section className="admin-card space-y-4">
        <h2 className="font-serif text-xl text-primary">Tarification & référence</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminField
            label="Prix de vente (DH)"
            name="price"
            required
            inputMode="decimal"
            defaultValue={product ? centsToInput(product.priceCents) : ""}
            error={state?.fieldErrors?.price}
            placeholder="1850.00"
          />
          <AdminField
            label="Prix barré (DH)"
            name="compareAtPrice"
            inputMode="decimal"
            defaultValue={
              product?.compareAtCents ? centsToInput(product.compareAtCents) : ""
            }
            error={state?.fieldErrors?.compareAtPrice}
            hint="Facultatif, doit être supérieur au prix."
          />
          <AdminField
            label="Référence SKU"
            name="sku"
            required
            defaultValue={product?.sku}
            error={state?.fieldErrors?.sku}
            placeholder="AVO-MAR-004"
          />
          <AdminField
            label="Badge"
            name="badge"
            defaultValue={product?.badge ?? ""}
            error={state?.fieldErrors?.badge}
            placeholder="Édition limitée"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AdminSelect
            label="Genre"
            name="gender"
            required
            defaultValue={product?.gender ?? "MIXTE"}
            options={GENDER_OPTIONS}
            error={state?.fieldErrors?.gender}
          />
          <AdminSelect
            label="Forme"
            name="shape"
            required
            defaultValue={product?.shape ?? "AUTRE"}
            options={SHAPE_OPTIONS}
            error={state?.fieldErrors?.shape}
          />
          <AdminField
            label="Matière"
            name="material"
            defaultValue={product?.material ?? ""}
            error={state?.fieldErrors?.material}
            placeholder="Acétate biosourcé"
          />
        </div>
      </section>

      <section className="admin-card space-y-4">
        <h2 className="font-serif text-xl text-primary">Mesures & poids</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminField
            label="Poids (g)"
            name="weightGrams"
            type="number"
            min={0}
            max={500}
            defaultValue={product?.weightGrams ?? ""}
            error={state?.fieldErrors?.weightGrams}
          />
          <AdminField
            label="Largeur verre (mm)"
            name="lensWidthMm"
            type="number"
            min={30}
            max={70}
            defaultValue={product?.lensWidthMm ?? ""}
            error={state?.fieldErrors?.lensWidthMm}
          />
          <AdminField
            label="Pont (mm)"
            name="bridgeMm"
            type="number"
            min={10}
            max={30}
            defaultValue={product?.bridgeMm ?? ""}
            error={state?.fieldErrors?.bridgeMm}
          />
          <AdminField
            label="Branches (mm)"
            name="templeLengthMm"
            type="number"
            min={100}
            max={160}
            defaultValue={product?.templeLengthMm ?? ""}
            error={state?.fieldErrors?.templeLengthMm}
          />
        </div>
      </section>

      <section className="admin-card space-y-4">
        <h2 className="font-serif text-xl text-primary">Visuels</h2>
        <ProductImagesField initialUrls={product?.images.map((image) => image.url) ?? []} />
      </section>

      <section className="admin-card space-y-4">
        <h2 className="font-serif text-xl text-primary">Publication</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminCheckbox
            label="Produit actif"
            name="isActive"
            defaultChecked={product?.isActive ?? false}
            hint="Créez d'abord un brouillon, ajoutez un coloris en stock, puis publiez depuis la fiche produit."
          />
          <AdminCheckbox
            label="Mis en avant"
            name="isFeatured"
            defaultChecked={product?.isFeatured ?? false}
          />
          <AdminCheckbox
            label="Nouveauté"
            name="isNew"
            defaultChecked={product?.isNew ?? false}
          />
          <AdminCheckbox
            label="Meilleure vente"
            name="isBestseller"
            defaultChecked={product?.isBestseller ?? false}
          />
          <AdminCheckbox
            label="Compatible verres correcteurs"
            name="lensCompatible"
            defaultChecked={product?.lensCompatible ?? true}
            hint="Détermine l'accès au configurateur de verres."
          />
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton
          label={product ? "Enregistrer les modifications" : "Créer le produit"}
        />
        <Link href="/admin/produits" className="btn-quiet">
          Annuler
        </Link>
      </div>
    </form>
  );
}
