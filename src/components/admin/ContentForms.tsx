"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  saveContentPageAction,
  saveFaqAction,
  saveBannerAction,
} from "@/app/actions/admin/system";
import type { AdminState } from "@/lib/admin";
import {
  AdminCheckbox,
  AdminField,
  AdminSelect,
  AdminTextArea,
  FormFeedback,
  SubmitButton,
} from "@/components/admin/FormBits";

export type ContentPageValues = {
  id: string;
  slug: string;
  title: string;
  intro: string;
  body: string;
  metaDescription: string;
  isPublished: boolean;
};

export function ContentPageForm({
  page,
  slugOptions,
}: {
  page?: ContentPageValues;
  slugOptions?: Array<{ value: string; label: string }>;
}) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    saveContentPageAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      {page?.id && <input type="hidden" name="id" value={page.id} />}
      <FormFeedback state={state} />

      <div className="grid gap-3 sm:grid-cols-2">
        {slugOptions && !page ? (
          <AdminSelect
            label="Page du site"
            name="slug"
            required
            options={slugOptions}
            hint="Chaque page correspond à une route statique de la boutique."
            error={state?.fieldErrors?.slug}
          />
        ) : (
          <AdminField
            label="Slug (URL)"
            name="slug"
            required
            defaultValue={page?.slug}
            placeholder="livraison"
            hint="Minuscules, chiffres et tirets. Une page publiée est accessible à /slug."
            error={state?.fieldErrors?.slug}
          />
        )}
        <AdminField
          label="Titre"
          name="title"
          required
          defaultValue={page?.title}
          placeholder="Livraison & expédition"
          error={state?.fieldErrors?.title}
        />
      </div>

      <AdminTextArea
        label="Introduction"
        name="intro"
        rows={2}
        defaultValue={page?.intro}
        placeholder="Résumé affiché sous le titre et dans les métadonnées."
        error={state?.fieldErrors?.intro}
      />

      <AdminTextArea
        label="Contenu"
        name="body"
        rows={18}
        required
        defaultValue={page?.body}
        placeholder={"## Titre de section\n\nTexte du paragraphe…\n\n- Élément de liste\n\n> Encadré de mise en garde"}
        hint="Format texte : ## et ### pour les intertitres, - pour les listes, > pour les encadrés, **gras** pour l'emphase."
        error={state?.fieldErrors?.body}
      />

      <AdminField
        label="Méta-description SEO"
        name="metaDescription"
        defaultValue={page?.metaDescription}
        placeholder="160 caractères maximum."
        error={state?.fieldErrors?.metaDescription}
      />

      <AdminCheckbox
        label="Page publiée"
        name="isPublished"
        defaultChecked={page?.isPublished ?? true}
        hint="Une page dépubliée n'est plus accessible sur la boutique."
      />

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton label={page ? "Enregistrer la page" : "Créer la page"} />
        <Link href="/admin/contenu?onglet=pages" className="btn-quiet btn-sm">
          Retour à la liste
        </Link>
      </div>
    </form>
  );
}

export type FaqValues = {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
};

export function FaqForm({ item, onDone }: { item?: FaqValues; onDone?: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    saveFaqAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      {item?.id && <input type="hidden" name="id" value={item.id} />}
      <FormFeedback state={state} />

      <AdminField
        label="Question"
        name="question"
        required
        defaultValue={item?.question}
        placeholder="Comment choisir la taille de ma monture ?"
        error={state?.fieldErrors?.question}
      />
      <AdminTextArea
        label="Réponse"
        name="answer"
        rows={4}
        required
        defaultValue={item?.answer}
        error={state?.fieldErrors?.answer}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField
          label="Catégorie"
          name="category"
          required
          defaultValue={item?.category}
          placeholder="Montures, Verres, Livraison…"
          error={state?.fieldErrors?.category}
        />
        <AdminField
          label="Ordre d'affichage"
          name="sortOrder"
          type="number"
          min={0}
          max={999}
          defaultValue={item?.sortOrder ?? 0}
          error={state?.fieldErrors?.sortOrder}
        />
      </div>
      <AdminCheckbox
        label="Question visible sur la FAQ"
        name="isActive"
        defaultChecked={item?.isActive ?? true}
      />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton label={item ? "Enregistrer la question" : "Ajouter la question"} />
        {onDone && (
          <Link href={onDone} className="btn-quiet btn-sm">
            Annuler
          </Link>
        )}
      </div>
    </form>
  );
}

export type BannerValues = {
  id: string;
  key: string;
  position: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLabel: string;
  ctaHref: string;
  sortOrder: number;
  isActive: boolean;
};

export function BannerForm({ banner, onDone }: { banner?: BannerValues; onDone?: string }) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    saveBannerAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      {banner?.id && <input type="hidden" name="id" value={banner.id} />}
      <FormFeedback state={state} />

      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField
          label="Clé technique"
          name="key"
          required
          defaultValue={banner?.key}
          placeholder="home-hero"
          hint="Identifiant stable utilisé par la page d'accueil."
          error={state?.fieldErrors?.key}
        />
        <AdminField
          label="Sur-titre"
          name="eyebrow"
          defaultValue={banner?.eyebrow}
          placeholder="Atelier & Maison d'Optique"
          error={state?.fieldErrors?.eyebrow}
        />
        <AdminSelect
          label="Emplacement"
          name="position"
          defaultValue={banner?.position ?? "home"}
          options={[
            { value: "home", label: "Page d'accueil" },
            { value: "about", label: "Page À propos" },
          ]}
          hint="Le visuel, les textes et le lien restent modifiables dans le CMS."
          error={state?.fieldErrors?.position}
        />
      </div>

      <AdminField
        label="Titre"
        name="title"
        required
        defaultValue={banner?.title}
        placeholder="Voyez la différence. Affirmez votre style."
        error={state?.fieldErrors?.title}
      />
      <AdminTextArea
        label="Sous-titre"
        name="subtitle"
        rows={2}
        defaultValue={banner?.subtitle}
        error={state?.fieldErrors?.subtitle}
      />
      <AdminField
        label="Image existante (URL)"
        name="imageUrl"
        defaultValue={banner?.imageUrl}
        placeholder="/images/stitch/boutique_en_ligne_haute_lunetterie-01.jpg"
        hint="Chemin local vérifié (/images/… ou /api/media/…). Ou ajoutez une nouvelle image ci-dessous."
        error={state?.fieldErrors?.imageUrl}
      />
      <label className="block text-body-sm text-primary">
        Importer une image (JPEG, PNG ou WebP · 5 Mo maximum)
        <input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="admin-input mt-1" />
      </label>
      {banner?.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={banner.imageUrl} alt="Aperçu de la bannière" className="h-32 w-auto max-w-full object-contain" />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminField
          label="Libellé du bouton"
          name="ctaLabel"
          defaultValue={banner?.ctaLabel}
          placeholder="Découvrir la collection"
          error={state?.fieldErrors?.ctaLabel}
        />
        <AdminField
          label="Lien du bouton"
          name="ctaHref"
          defaultValue={banner?.ctaHref}
          placeholder="/catalogue"
          error={state?.fieldErrors?.ctaHref}
        />
      </div>
      <AdminField name="sortOrder" label="Ordre d'affichage" type="number" min={0} max={9999} defaultValue={banner?.sortOrder ?? 0} />
      <AdminCheckbox
        label="Bannière active"
        name="isActive"
        defaultChecked={banner?.isActive ?? true}
      />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton label={banner ? "Enregistrer la bannière" : "Créer la bannière"} />
        {onDone && (
          <Link href={onDone} className="btn-quiet btn-sm">
            Annuler
          </Link>
        )}
      </div>
    </form>
  );
}
