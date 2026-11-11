"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "@/app/actions/admin/system";
import type { AdminState } from "@/lib/admin";
import { centsToInput } from "@/lib/money";
import { Icon } from "@/components/ui/Icon";
import { FormFeedback, SubmitButton } from "@/components/admin/FormBits";

type FieldType = "text" | "email" | "tel" | "number" | "textarea" | "boolean";

type Field = {
  key: string;
  label: string;
  type?: FieldType;
  hint?: string;
  placeholder?: string;
  /** Valeur monétaire stockée en centimes, saisie en dirhams. */
  money?: boolean;
  locked?: string;
};

const GROUPS: Array<{ title: string; description?: string; fields: Field[] }> = [
  {
    title: "Maison",
    description: "Identité affichée sur la boutique et dans les documents.",
    fields: [
      { key: "store.name", label: "Nom de la maison" },
      { key: "store.logo_url", label: "Logo (chemin d’image public)", hint: "Chemin local /images/… ou /api/media/… issu de la médiathèque publique." },
      { key: "store.legal_name", label: "Raison sociale", hint: "Mention légale telle qu'elle doit apparaître." },
    ],
  },
  {
    title: "Contact & salon",
    description:
      "Coordonnées publiées. Les valeurs de démonstration doivent être remplacées par les informations réelles avant mise en production.",
    fields: [
      { key: "store.email", label: "E-mail de contact", type: "email" },
      { key: "store.phone", label: "Téléphone", type: "tel" },
      { key: "store.whatsapp", label: "WhatsApp", type: "tel" },
      { key: "store.address", label: "Adresse du magasin" },
      { key: "store.city", label: "Ville" },
      { key: "store.hours", label: "Horaires d'ouverture" },
    ],
  },
  {
    title: "Apparence et pied de page",
    description: "Le logo original et le style du site sont préservés. Modifiez uniquement les textes et liens sélectionnés.",
    fields: [
      { key: "site.announcement", label: "Message d'annonce" },
      { key: "site.footer_text", label: "Présentation dans le pied de page", type: "textarea" },
      { key: "social.instagram", label: "Lien Instagram" },
      { key: "social.facebook", label: "Lien Facebook" },
      { key: "social.pinterest", label: "Lien Pinterest" },
      { key: "social.linkedin", label: "Lien LinkedIn" },
    ],
  },
  {
    title: "Sections de l'accueil",
    description: "Choisissez les sections à afficher sans modifier la mise en page de la boutique.",
    fields: [
      { key: "home.announcement_visible", label: "Afficher le bandeau d'annonce", type: "boolean" },
      { key: "home.categories_visible", label: "Afficher les collections", type: "boolean" },
      { key: "home.featured_visible", label: "Afficher la sélection de produits", type: "boolean" },
      { key: "home.optical_visible", label: "Afficher la présentation des verres", type: "boolean" },
      { key: "home.trust_visible", label: "Afficher les engagements", type: "boolean" },
    ],
  },
  {
    title: "Informations légales",
    description:
      "Ces champs sont vides ou marqués « À RENSEIGNER » tant que le propriétaire ne les a pas fournis.",
    fields: [
      { key: "store.ice", label: "ICE" },
      { key: "store.rc", label: "Registre de commerce" },
      { key: "store.if", label: "Identifiant fiscal" },
      { key: "store.patente", label: "Patente" },
      { key: "store.cnss", label: "Agrément CNSS / CNOPS" },
      { key: "store.cndp", label: "Autorisation CNDP" },
    ],
  },
  {
    title: "Paiement",
    description:
      "Le paiement en ligne reste verrouillé : aucune passerelle CMI n'est intégrée. Seul le paiement à la livraison est proposé au checkout.",
    fields: [
      {
        key: "payment.cod_enabled",
        label: "Paiement à la livraison",
        type: "boolean",
        locked: "Toujours actif — mode de règlement unique.",
      },
      {
        key: "payment.online_enabled",
        label: "Paiement en ligne (CMI)",
        type: "boolean",
        locked: "Indisponible tant qu'une passerelle réelle n'est pas intégrée et validée.",
      },
      { key: "payment.online_notice", label: "Message affiché pour le paiement en ligne", type: "textarea" },
    ],
  },
  {
    title: "Livraison & commandes",
    fields: [
      {
        key: "shipping.free_threshold",
        label: "Seuil de livraison offerte",
        type: "number",
        money: true,
        hint: "Montant du sous-total à partir duquel la livraison standard est offerte.",
      },
      {
        key: "order.prescription_required",
        label: "Ordonnance obligatoire",
        type: "boolean",
        hint: "Si actif, une ordonnance est exigée pour les commandes de verres correcteurs.",
      },
      {
        key: "order.owner_email_enabled",
        label: "Notifier le propriétaire des nouvelles commandes par e-mail",
        type: "boolean",
        hint: "Destinataire : OWNER_EMAIL configuré dans l'environnement. Aucun détail client sensible ni ordonnance n'est joint.",
      },
      {
        key: "order.customer_confirmation_enabled",
        label: "Envoyer une confirmation de réception au client",
        type: "boolean",
        hint: "Message de réception uniquement : ne confirme ni validation optique professionnelle ni expédition. Désactivé par défaut.",
      },
      {
        key: "order.confirmation_notice",
        label: "Message de confirmation de commande",
        type: "textarea",
      },
    ],
  },
  {
    title: "Référencement (SEO)",
    fields: [
      { key: "seo.default_title", label: "Titre par défaut" },
      { key: "seo.default_description", label: "Description par défaut", type: "textarea" },
    ],
  },
];

export function SettingsForm({ settings }: { settings: Record<string, string> }) {
  const [state, formAction] = useActionState<AdminState, FormData>(
    saveSettingsAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormFeedback state={state} />

      {GROUPS.map((group) => (
        <section key={group.title} className="border border-outline-variant bg-white">
          <div className="border-b border-outline-variant px-4 py-3">
            <h2 className="font-serif text-lg text-primary">{group.title}</h2>
            {group.description && (
              <p className="mt-0.5 max-w-2xl text-[0.72rem] leading-relaxed text-on-surface-variant">
                {group.description}
              </p>
            )}
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            {group.fields.map((field) => {
              const raw = settings[field.key] ?? "";
              const id = `setting-${field.key.replace(/\./g, "-")}`;
              const value = field.money ? centsToInput(Number(raw) || 0) : raw;

              if (field.type === "boolean") {
                const checked = raw === "true";
                return (
                  <div key={field.key} className="sm:col-span-2">
                    <label className="flex items-start gap-2 text-[0.8rem]">
                      <input
                        type="checkbox"
                        name={field.key}
                        defaultChecked={checked}
                        disabled={Boolean(field.locked)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                      />
                      <span>
                        <span className="text-primary">{field.label}</span>
                        <span className="mt-0.5 block text-[0.72rem] text-on-surface-variant">
                          {field.locked ?? field.hint}
                        </span>
                      </span>
                    </label>
                    {field.key === "payment.cod_enabled" && (
                      <input type="hidden" name={field.key} value="on" />
                    )}
                    {field.key === "payment.online_enabled" && (
                      <input type="hidden" name={field.key} value="off" />
                    )}
                  </div>
                );
              }

              return (
                <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
                  <label htmlFor={id} className="field-label">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={id}
                      name={field.key}
                      rows={3}
                      defaultValue={value}
                      className="admin-input resize-y"
                    />
                  ) : (
                    <input
                      id={id}
                      name={field.key}
                      type={field.type ?? "text"}
                      defaultValue={value}
                      placeholder={field.placeholder}
                      step={field.money ? "0.01" : undefined}
                      min={field.money ? 0 : undefined}
                      className="admin-input"
                    />
                  )}
                  {field.hint && <p className="field-hint">{field.hint}</p>}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <div className="flex flex-wrap items-center gap-3 border border-outline-variant bg-surface-dim px-4 py-3">
        <SubmitButton label="Enregistrer les réglages" pendingLabel="Enregistrement…" />
        <p className="flex items-center gap-1.5 text-[0.7rem] leading-relaxed text-on-surface-variant">
          <Icon name="info" size={13} className="shrink-0 text-secondary" />
          Toute modification est journalisée dans le journal d&apos;audit.
        </p>
      </div>
    </form>
  );
}
