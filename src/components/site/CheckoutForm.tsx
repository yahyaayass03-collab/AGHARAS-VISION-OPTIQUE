"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  placeOrderAction,
  type CheckoutState,
} from "@/app/actions/checkout";
import { Icon } from "@/components/ui/Icon";
import { formatDH } from "@/lib/money";
import { computeShippingCents } from "@/lib/pricing";
import { CITIES } from "@/lib/constants";
import { OPTICAL_REVIEW_MESSAGE } from "@/lib/optical-status";
import { WHATSAPP_MESSAGES, whatsappHref } from "@/lib/whatsapp";

type CheckoutItem = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  colorName: string;
  quantity: number;
  unitPriceCents: number;
  lensPriceCents: number;
  lineTotalCents: number;
  lens: {
    lensTypeName?: string;
    lensIndexValue?: string;
    summary: string;
    lensPriceCents: number;
    treatments: Array<{ id: string; name: string; priceCents: number }>;
  } | null;
};

type ShippingMethodOption = {
  code: string;
  name: string;
  description: string;
  priceCents: number;
  freeFromCents: number | null;
  estimatedDays: string | null;
};

type Customer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type Address = {
  line1: string;
  line2: string;
  city: string;
  postalCode: string;
  phone: string;
};

function SubmitButton({ totalCents }: { totalCents: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full border-b-2 border-gold bg-primary px-6 py-3.5 text-white transition-colors hover:bg-primary-container disabled:opacity-60"
    >
      <span className="flex items-center justify-center gap-2 text-[0.72rem] uppercase tracking-[0.14em]">
        <Icon name="lock" size={16} className="text-gold" />
        {pending
          ? "Envoi de la commande…"
          : `Confirmer ma commande (${formatDH(totalCents)})`}
      </span>
      <span className="mt-1 block text-[0.62rem] font-normal tracking-[0.04em] text-white/70">
        Paiement à la livraison • Aucun débit immédiat requis
      </span>
    </button>
  );
}

function SectionHeader({
  number,
  title,
  aside,
}: {
  number: string;
  title: string;
  aside?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant pb-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center border border-outline-variant bg-surface-dim text-[0.62rem] font-semibold text-primary">
          {number}
        </span>
        <h2 className="font-serif text-xl text-primary">{title}</h2>
      </div>
      {aside && (
        <span className="text-[0.58rem] uppercase tracking-[0.1em] text-on-surface-variant">
          {aside}
        </span>
      )}
    </div>
  );
}

export function CheckoutForm({
  idempotencyKey,
  items,
  subtotalCents,
  discountCents,
  couponCode,
  couponLabel,
  couponError,
  shippingMethods,
  whatsapp,
  onlineNotice,
  customer,
  address,
}: {
  idempotencyKey: string;
  items: CheckoutItem[];
  subtotalCents: number;
  discountCents: number;
  couponCode: string | null;
  couponLabel: string | null;
  couponError: string | null;
  shippingMethods: ShippingMethodOption[];
  whatsapp: string;
  onlineNotice: string;
  customer: Customer | null;
  address: Address | null;
}) {
  const [state, formAction] = useActionState<CheckoutState, FormData>(
    placeOrderAction,
    null,
  );
  const [shippingCode, setShippingCode] = useState(
    shippingMethods[0]?.code ?? "",
  );

  const errors = state?.fieldErrors ?? {};
  const afterDiscount = Math.max(0, subtotalCents - discountCents);
  const selectedMethod =
    shippingMethods.find((method) => method.code === shippingCode) ??
    shippingMethods[0] ??
    null;
  const shippingCents = computeShippingCents(selectedMethod, afterDiscount);
  const totalCents = afterDiscount + shippingCents;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const checkoutWhatsapp = whatsappHref(whatsapp, WHATSAPP_MESSAGES.checkout);

  return (
    <form action={formAction} className="grid items-start gap-8 lg:grid-cols-12">
      <input type="hidden" name="paymentMethod" value="CASH_ON_DELIVERY" />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <input type="hidden" name="couponCode" value={couponCode ?? ""} />

      <section className="flex flex-col gap-5 lg:col-span-7 xl:col-span-8">
        {state && !state.ok && (
          <div
            role="alert"
            className="flex items-start gap-2 border border-error/30 bg-error-container px-4 py-3 text-body-sm text-error"
          >
            <Icon name="alert" size={17} className="mt-0.5" />
            <div>
              <p className="font-medium">La commande n&apos;a pas pu être validée.</p>
              <p className="mt-0.5">{state.message}</p>
              {state.message === OPTICAL_REVIEW_MESSAGE && (
                <a
                  href={whatsappHref(
                    whatsapp,
                    WHATSAPP_MESSAGES.compatibility,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 font-medium underline"
                  aria-label="Contacter sur WhatsApp"
                >
                  <Icon name="whatsapp" size={14} />
                  Besoin d&apos;aide ? Écrivez-nous
                </a>
              )}
            </div>
          </div>
        )}

        <div className="border border-outline-variant bg-white p-5 md:p-6">
          <SectionHeader
            number="1"
            title="Informations personnelles"
            aside={customer ? "Compte client" : "Client invité"}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="field-label">
                Prénom <span className="text-error">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                defaultValue={customer?.firstName ?? ""}
                placeholder="ex. Yassine"
                className={`field ${errors.firstName ? "field-error" : ""}`}
                aria-invalid={Boolean(errors.firstName)}
              />
              {errors.firstName && (
                <p className="field-error-text">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="field-label">
                Nom <span className="text-error">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                defaultValue={customer?.lastName ?? ""}
                placeholder="ex. Bennani"
                className={`field ${errors.lastName ? "field-error" : ""}`}
                aria-invalid={Boolean(errors.lastName)}
              />
              {errors.lastName && (
                <p className="field-error-text">{errors.lastName}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="phone" className="field-label">
                Téléphone mobile (WhatsApp) <span className="text-error">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                required
                defaultValue={customer?.phone || address?.phone || ""}
                placeholder="06 12 34 56 78"
                className={`field ${errors.phone ? "field-error" : ""}`}
                aria-invalid={Boolean(errors.phone)}
              />
              {errors.phone ? (
                <p className="field-error-text">{errors.phone}</p>
              ) : (
                <p className="field-hint">
                  Utilisé exclusivement pour la confirmation de livraison par le
                  livreur et vos alertes de suivi.
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="email" className="field-label">
                Adresse e-mail <span className="text-error">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={customer?.email ?? ""}
                placeholder="nom@exemple.ma"
                className={`field ${errors.email ? "field-error" : ""}`}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? (
                <p className="field-error-text">{errors.email}</p>
              ) : (
                <p className="field-hint">
                  Pour le reçu, la fiche de garantie et le suivi de commande.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="border border-outline-variant bg-white p-5 md:p-6">
          <SectionHeader
            number="2"
            title="Adresse de livraison au Maroc"
            aside="Toutes villes couvertes"
          />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="addressLine1" className="field-label">
                Adresse complète <span className="text-error">*</span>
              </label>
              <input
                id="addressLine1"
                name="addressLine1"
                type="text"
                autoComplete="address-line1"
                required
                defaultValue={address?.line1 ?? ""}
                placeholder="N° de rue, résidence, quartier, étage, appartement…"
                className={`field ${errors.addressLine1 ? "field-error" : ""}`}
                aria-invalid={Boolean(errors.addressLine1)}
              />
              {errors.addressLine1 && (
                <p className="field-error-text">{errors.addressLine1}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="addressLine2" className="field-label">
                Complément d&apos;adresse{" "}
                <span className="font-normal normal-case tracking-normal text-on-surface-variant">
                  (facultatif)
                </span>
              </label>
              <input
                id="addressLine2"
                name="addressLine2"
                type="text"
                autoComplete="address-line2"
                defaultValue={address?.line2 ?? ""}
                placeholder="Immeuble, étage, digicode…"
                className="field"
              />
            </div>

            <div>
              <label htmlFor="city" className="field-label">
                Ville <span className="text-error">*</span>
              </label>
              <input
                id="city"
                name="city"
                type="text"
                list="checkout-cities"
                autoComplete="address-level2"
                required
                defaultValue={address?.city ?? ""}
                placeholder="Casablanca"
                className={`field ${errors.city ? "field-error" : ""}`}
                aria-invalid={Boolean(errors.city)}
              />
              <datalist id="checkout-cities">
                {CITIES.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
              {errors.city && <p className="field-error-text">{errors.city}</p>}
            </div>

            <div>
              <label htmlFor="postalCode" className="field-label">
                Code postal{" "}
                <span className="font-normal normal-case tracking-normal text-on-surface-variant">
                  (facultatif)
                </span>
              </label>
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                defaultValue={address?.postalCode ?? ""}
                placeholder="20050"
                className={`field ${errors.postalCode ? "field-error" : ""}`}
                aria-invalid={Boolean(errors.postalCode)}
              />
              {errors.postalCode && (
                <p className="field-error-text">{errors.postalCode}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="deliveryNotes" className="field-label">
                Instructions pour le livreur{" "}
                <span className="font-normal normal-case tracking-normal text-on-surface-variant">
                  (facultatif)
                </span>
              </label>
              <textarea
                id="deliveryNotes"
                name="deliveryNotes"
                rows={2}
                maxLength={500}
                placeholder="ex. En face de la pharmacie, sonner au digicode…"
                className="field"
              />
            </div>
          </div>
        </div>

        <div className="border border-outline-variant bg-white p-5 md:p-6">
          <SectionHeader number="3" title="Mode de livraison" />
          <div className="space-y-3">
            {shippingMethods.map((method) => {
              const selected = method.code === shippingCode;
              const price = computeShippingCents(method, afterDiscount);
              return (
                <label
                  key={method.code}
                  className={`flex cursor-pointer items-start gap-3 border p-4 transition-colors ${
                    selected
                      ? "border-primary bg-surface-dim ring-1 ring-primary"
                      : "border-outline-variant hover:border-primary"
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingCode"
                    value={method.code}
                    checked={selected}
                    onChange={() => setShippingCode(method.code)}
                    className="mt-1 h-4 w-4 shrink-0 accent-[#2e4243]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-serif text-lg leading-tight text-primary">
                        {method.name}
                      </span>
                      <span
                        className={`text-[0.62rem] uppercase tracking-[0.1em] ${
                          price === 0 ? "text-secondary" : "text-primary"
                        }`}
                      >
                        {price === 0 ? "Offerte" : formatDH(price)}
                      </span>
                    </span>
                    <span className="mt-1 block text-body-sm leading-relaxed text-on-surface-variant">
                      {method.description}
                    </span>
                    {method.estimatedDays && (
                      <span className="mt-1 block text-[0.7rem] text-outline">
                        Délai estimé : {method.estimatedDays}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
          {errors.shippingCode && (
            <p className="field-error-text">{errors.shippingCode}</p>
          )}
        </div>

        <div className="border border-outline-variant bg-white p-5 md:p-6">
          <SectionHeader
            number="4"
            title="Mode de règlement"
            aside="Protection acheteur"
          />

          <div className="border-2 border-primary bg-surface-dim p-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-4 border-primary bg-primary" />
              <div>
                <p className="flex flex-wrap items-center gap-2 font-serif text-lg text-primary">
                  Paiement à la livraison
                  <span className="bg-gold/30 px-2 py-0.5 text-[0.55rem] font-sans uppercase tracking-[0.1em] text-secondary">
                    Recommandé au Maroc
                  </span>
                </p>
                <p className="mt-1 text-body-sm leading-relaxed text-on-surface-variant">
                  Réglez à la réception de votre colis, en espèces ou par carte
                  bancaire sur le terminal mobile du livreur. Aucun débit
                  immédiat.
                </p>
              </div>
            </div>
            <div className="mt-3 grid gap-2 border-t border-outline-variant pt-3 text-[0.72rem] sm:grid-cols-2">
              <span className="flex items-center gap-2 text-primary">
                <Icon name="package" size={16} className="text-secondary" />
                Vérification du colis avant paiement
              </span>
              <span className="flex items-center gap-2 text-primary">
                <Icon name="file" size={16} className="text-secondary" />
                Facture remise en main propre
              </span>
            </div>
          </div>

          <div className="mt-3 border border-outline-variant bg-surface p-4 opacity-75">
            <p className="flex flex-wrap items-center gap-2 font-serif text-lg text-on-surface-variant line-through decoration-outline">
              Paiement en ligne par carte bancaire (CMI)
              <span className="border border-outline-variant bg-surface-dim px-2 py-0.5 font-sans text-[0.55rem] uppercase tracking-[0.1em] no-underline">
                Bientôt disponible
              </span>
            </p>
            <p className="mt-1 text-body-sm leading-relaxed text-on-surface-variant">
              {onlineNotice} Privilégiez le paiement à la livraison.
            </p>
            <button
              type="button"
              disabled
              className="mt-2 cursor-not-allowed border border-outline-variant px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.1em] text-outline"
            >
              Indisponible
            </button>
          </div>
        </div>

        <div className="bg-primary p-5 text-white md:p-6">
          <div className="flex items-start gap-3">
            <Icon name="file" size={26} className="mt-0.5 shrink-0 text-gold" />
            <div>
              <p className="font-serif text-lg text-white">
                Ordonnance &amp; prise en charge mutuelle
              </p>
              <p className="mt-1.5 text-body-sm leading-relaxed text-white/75">
                Les informations relatives à votre ordonnance sont examinées
                avant le montage. Les conditions de remboursement et les pièces
                requises dépendent de votre organisme : renseignez-vous auprès
                de celui-ci.
              </p>
              {items.some((item) => item.lens) && (
                <p className="mt-2 text-[0.7rem] text-gold">
                  Cette commande contient une configuration de verres : un
                  opticien peut vous contacter avant le montage.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex cursor-pointer select-none items-start gap-2.5">
            <input
              type="checkbox"
              name="acceptTerms"
              required
              className="mt-1 h-4 w-4 shrink-0 accent-[#2e4243]"
              aria-invalid={Boolean(errors.acceptTerms)}
            />
            <span className="text-body-sm leading-relaxed text-on-surface-variant">
              J&apos;accepte les{" "}
              <Link href="/cgv" className="link-underline text-primary">
                conditions générales de vente
              </Link>{" "}
              et la{" "}
              <Link
                href="/confidentialite"
                className="link-underline text-primary"
              >
                politique de confidentialité
              </Link>
              , y compris le traitement de mes données de santé pour la
              fabrication des verres.
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="field-error-text">{errors.acceptTerms}</p>
          )}

          <SubmitButton totalCents={totalCents} />

          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { icon: "package" as const, label: "Conditions de retour" },
              { icon: "file" as const, label: "Dossier remboursement" },
              { icon: "truck" as const, label: "Colis inspectable" },
            ].map((entry) => (
              <div
                key={entry.label}
                className="border border-outline-variant px-1 py-2"
              >
                <Icon
                  name={entry.icon}
                  size={16}
                  className="mx-auto mb-1 text-primary"
                />
                <span className="block text-[0.55rem] uppercase tracking-[0.08em] text-on-surface-variant">
                  {entry.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-center text-[0.68rem] leading-relaxed text-outline">
            En confirmant, vous serez contacté par téléphone ou WhatsApp pour
            valider les détails de votre commande. Aucun paiement en ligne
            n&apos;est effectué.
          </p>
        </div>
      </section>

      <aside className="lg:col-span-5 lg:sticky lg:top-28 xl:col-span-4">
        <div className="border border-outline-variant bg-white p-5">
          <div className="flex items-center justify-between border-b border-outline-variant pb-3">
            <h2 className="font-serif text-xl text-primary">Récapitulatif</h2>
            <span className="bg-surface-dim px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.1em] text-primary">
              {itemCount} article{itemCount > 1 ? "s" : ""}
            </span>
          </div>

          <ul className="divide-y divide-outline-variant">
            {items.map((item) => (
              <li key={item.id} className="flex gap-3 py-3">
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-outline-variant bg-surface-dim">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-contain p-1"
                    />
                  ) : (
                    <Icon name="glasses" size={28} className="text-outline" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-serif text-[1.05rem] leading-tight text-primary">
                      {item.name}
                    </h3>
                    <span className="shrink-0 text-body-sm font-semibold text-primary">
                      {formatDH(item.lineTotalCents)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[0.58rem] uppercase tracking-[0.08em] text-secondary">
                    {item.colorName} • Qté {item.quantity}
                  </p>
                  <p className="mt-0.5 text-[0.72rem] leading-snug text-on-surface-variant">
                    {item.lens
                      ? item.lens.summary
                      : "Monture seule, prête pour équipement optique"}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] text-outline">
                    {formatDH(item.unitPriceCents + item.lensPriceCents)} l&apos;unité
                  </p>
                </div>
              </li>
            ))}
          </ul>

          {couponCode && (
            <div className="mt-1 border-y border-outline-variant bg-surface-dim px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.1em] text-primary">
                  <Icon name="tag" size={13} className="text-secondary" />
                  {couponCode}
                  {couponLabel && (
                    <span className="normal-case tracking-normal text-outline">
                      ({couponLabel})
                    </span>
                  )}
                </span>
                {discountCents > 0 ? (
                  <span className="text-body-sm text-error">
                    −{formatDH(discountCents)}
                  </span>
                ) : (
                  <Link
                    href="/panier"
                    className="text-[0.62rem] text-secondary underline"
                  >
                    Vérifier
                  </Link>
                )}
              </div>
              {couponError && (
                <p className="mt-1 text-[0.68rem] text-error">{couponError}</p>
              )}
            </div>
          )}

          <dl className="space-y-1.5 border-b border-outline-variant py-3 text-body-sm">
            <div className="flex justify-between gap-2 text-on-surface-variant">
              <dt>Sous-total montures &amp; verres</dt>
              <dd>{formatDH(subtotalCents)}</dd>
            </div>
            {discountCents > 0 && (
              <div className="flex justify-between gap-2 text-secondary">
                <dt>Remise {couponCode}</dt>
                <dd>−{formatDH(discountCents)}</dd>
              </div>
            )}
            <div className="flex justify-between gap-2 text-on-surface-variant">
              <dt>Montage &amp; calibrage</dt>
              <dd className="text-[0.6rem] uppercase tracking-[0.1em] text-primary">
                Inclus
              </dd>
            </div>
            <div className="flex justify-between gap-2 text-on-surface-variant">
              <dt>{selectedMethod?.name ?? "Livraison"}</dt>
              <dd
                className={
                  shippingCents === 0
                    ? "text-[0.6rem] uppercase tracking-[0.1em] text-secondary"
                    : "text-primary"
                }
              >
                {shippingCents === 0 ? "Offerte" : formatDH(shippingCents)}
              </dd>
            </div>
          </dl>

          <div className="flex items-baseline justify-between py-3">
            <span className="font-serif text-lg text-primary">
              Total TTC à régler
            </span>
            <span className="text-2xl font-bold text-primary">
              {formatDH(totalCents)}
            </span>
          </div>
          <p className="text-right text-[0.58rem] uppercase tracking-[0.08em] text-on-surface-variant">
            Montant exact à payer au livreur
          </p>

          <div className="mt-3 flex items-center gap-2 border border-outline-variant bg-surface-dim p-3">
            <Icon name="shield" size={20} className="shrink-0 text-secondary" />
            <p className="text-[0.7rem] leading-tight text-on-surface-variant">
              Les conditions de remboursement dépendent de votre organisme
              privée. Aucun montant n&apos;est garanti.
            </p>
          </div>
        </div>

        <div className="mt-4 border border-outline-variant bg-white p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#25D366]/10 text-[#128C7E]">
              <Icon name="whatsapp" size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.58rem] uppercase tracking-[0.1em] text-on-surface-variant">
                Besoin d&apos;aide pour vos verres ?
              </p>
              <p className="truncate text-body-sm font-medium text-primary">
                Conseiller opticien
              </p>
            </div>
            <a
              href={checkoutWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-quiet btn-sm shrink-0"
              aria-label="Contacter sur WhatsApp"
            >
              WhatsApp
            </a>
          </div>
          <p className="mt-2 border-t border-outline-variant pt-2 text-[0.7rem] text-on-surface-variant">
            Du lundi au samedi, 9h30 – 19h30.
          </p>
        </div>

        <Link
          href="/panier"
          className="mt-4 inline-flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.1em] text-primary hover:text-secondary"
        >
          <Icon name="arrow-left" size={14} />
          Revenir au panier
        </Link>
      </aside>
    </form>
  );
}
