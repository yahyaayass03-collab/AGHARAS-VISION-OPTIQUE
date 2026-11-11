"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  addConfiguredToCartAction,
  type CartActionState,
} from "@/app/actions/cart";
import { Icon } from "@/components/ui/Icon";
import { formatDH } from "@/lib/money";
import { OPTICAL_REVIEW_MESSAGE } from "@/lib/optical-status";
import { WHATSAPP_MESSAGES, whatsappHref } from "@/lib/whatsapp";
import { getOpticalCombinationStatusAction } from "@/app/actions/admin/optical-compatibility";

type ProductSummary = {
  id: string;
  name: string;
  slug: string;
  brand: string;
  priceCents: number;
  imageUrl: string | null;
  imageAlt: string;
  lensWidthMm: number | null;
  bridgeMm: number | null;
  templeLengthMm: number | null;
};

type VariantSummary = {
  id: string;
  colorName: string;
  colorHex: string;
  sku: string;
  priceCents: number | null;
  stock: number;
};

type LensTypeSummary = {
  id: string;
  name: string;
  description: string;
  kind: "SINGLE_VISION" | "PROGRESSIVE" | "NONE";
  priceCents: number;
};

type LensIndexSummary = {
  id: string;
  name: string;
  label: string | null;
  value: string;
  priceCents: number;
  maxAbsSphere: number | null;
};

type TreatmentSummary = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  isDefault: boolean;
};

type Method = "UPLOAD" | "MANUAL" | "WHATSAPP" | "LATER";

const STEPS = [
  { number: "01", label: "Votre correction" },
  { number: "02", label: "Verres & traitements" },
  { number: "03", label: "Votre ordonnance" },
  { number: "04", label: "Récapitulatif" },
] as const;

const RX_FIELDS = [
  { key: "rightSphere", label: "Sphère (PWR)", placeholder: "-2,50" },
  { key: "rightCylinder", label: "Cylindre (CYL)", placeholder: "0,00" },
  { key: "rightAxis", label: "Axe (DEG)", placeholder: "90" },
  { key: "leftSphere", label: "Sphère (PWR)", placeholder: "-2,50" },
  { key: "leftCylinder", label: "Cylindre (CYL)", placeholder: "0,00" },
  { key: "leftAxis", label: "Axe (DEG)", placeholder: "90" },
] as const;

type RxKey =
  | "rightSphere"
  | "rightCylinder"
  | "rightAxis"
  | "leftSphere"
  | "leftCylinder"
  | "leftAxis";

function SubmitButton({ totalCents }: { totalCents: number }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full gap-3 py-4 text-[0.7rem] sm:w-auto sm:px-8"
    >
      {pending
        ? "Ajout en cours…"
        : `Ajouter au panier — ${formatDH(totalCents)}`}
      <Icon name="bag" size={16} />
    </button>
  );
}

export function LensWizard({
  product,
  variants,
  initialVariantId,
  lensTypes,
  lensIndices,
  treatments,
  whatsapp,
}: {
  product: ProductSummary;
  variants: VariantSummary[];
  initialVariantId: string;
  lensTypes: LensTypeSummary[];
  lensIndices: LensIndexSummary[];
  treatments: TreatmentSummary[];
  whatsapp: string;
}) {
  const [state, formAction] = useActionState<CartActionState, FormData>(
    addConfiguredToCartAction,
    null,
  );

  const correctableTypes = lensTypes.filter((entry) => entry.kind !== "NONE");
  const [hasCorrection, setHasCorrection] = useState(correctableTypes.length > 0);
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [variantId, setVariantId] = useState(
    initialVariantId || variants[0]?.id || "",
  );
  const [quantity, setQuantity] = useState(1);
  const [lensTypeId, setLensTypeId] = useState(correctableTypes[0]?.id ?? "");
  const [lensIndexId, setLensIndexId] = useState(lensIndices[0]?.id ?? "");
  const [treatmentIds, setTreatmentIds] = useState<string[]>(
    treatments.filter((entry) => entry.isDefault).map((entry) => entry.id),
  );
  const [method, setMethod] = useState<Method>("MANUAL");
  const [rx, setRx] = useState<Record<RxKey, string>>({
    rightSphere: "",
    rightCylinder: "",
    rightAxis: "",
    leftSphere: "",
    leftCylinder: "",
    leftAxis: "",
  });
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const [opticalStatus, setOpticalStatus] = useState<"APPROVED" | "INCOMPATIBLE" | "PENDING_REVIEW" | "LOADING">("LOADING");

  const variant = variants.find((entry) => entry.id === variantId) ?? variants[0];
  const frameCents = variant?.priceCents ?? product.priceCents;
  const stock = variant?.stock ?? 0;
  const maxQuantity = Math.max(1, Math.min(stock, 5));

  const lensType = correctableTypes.find((entry) => entry.id === lensTypeId) ?? null;
  const lensIndex = lensIndices.find((entry) => entry.id === lensIndexId) ?? null;
  const selectedTreatments = treatments.filter((entry) =>
    treatmentIds.includes(entry.id),
  );

  useEffect(() => {
    if (!hasCorrection || !variantId || !lensTypeId || !lensIndexId) {
      setOpticalStatus("PENDING_REVIEW");
      return;
    }
    let current = true;
    setOpticalStatus("LOADING");
    void getOpticalCombinationStatusAction({
      productId: product.id,
      variantId,
      lensTypeId,
      lensIndexId,
      treatmentIds,
    }).then((result) => {
      if (current) setOpticalStatus(result.status);
    }).catch(() => {
      if (current) setOpticalStatus("PENDING_REVIEW");
    });
    return () => { current = false; };
  }, [hasCorrection, product.id, variantId, lensTypeId, lensIndexId, treatmentIds]);
  const lensPriceCents = hasCorrection
    ? (lensType?.priceCents ?? 0) +
      (lensIndex?.priceCents ?? 0) +
      selectedTreatments.reduce((sum, entry) => sum + entry.priceCents, 0)
    : 0;
  const totalCents = (frameCents + lensPriceCents) * quantity;

  const sizeLabel = [
    product.lensWidthMm,
    product.bridgeMm,
    product.templeLengthMm ? `${product.templeLengthMm} MM` : null,
  ]
    .filter((value) => value !== null && value !== undefined && value !== "")
    .join(" □ ");

  function goToStep(target: number) {
    setStepError(null);
    setStep(target);
    setMaxStep((current) => Math.max(current, target));
  }

  function nextFrom(stepNumber: number) {
    setStepError(null);

    if (stepNumber === 1) {
      goToStep(2);
      return;
    }

    if (stepNumber === 2) {
      if (hasCorrection && (!lensType || !lensIndex)) {
        setStepError("Choisissez un type de verre et un indice d'amincissement.");
        return;
      }
      goToStep(hasCorrection ? 3 : 4);
      return;
    }

    if (stepNumber === 3) {
      if (hasCorrection && method === "UPLOAD" && !fileName) {
        setStepError("Téléversez votre ordonnance ou choisissez un autre mode de transmission.");
        return;
      }
      if (
        hasCorrection &&
        method === "MANUAL" &&
        !rx.rightSphere &&
        !rx.leftSphere &&
        !rx.rightCylinder &&
        !rx.leftCylinder
      ) {
        setStepError("Renseignez au moins une mesure pour l'œil droit ou gauche.");
        return;
      }
      goToStep(4);
    }
  }

  function toggleTreatment(id: string) {
    setTreatmentIds((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : [...current, id],
    );
  }

  function updateRx(key: RxKey, value: string) {
    setRx((current) => ({ ...current, [key]: value }));
  }

  function handleFile(file: File | null) {
    setFileError(null);
    setFileName("");
    if (!file) return;
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/heic",
      "image/heif",
    ];
    if (!allowed.includes(file.type)) {
      setFileError("Format non accepté. Utilisez un PDF, JPEG, PNG ou HEIC.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("Le fichier dépasse la limite de 10 Mo.");
      return;
    }
    setFileName(file.name);
  }

  const opticalWhatsapp = whatsappHref(whatsapp, WHATSAPP_MESSAGES.optical);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="productId" value={product.id} />
      <input type="hidden" name="variantId" value={variant?.id ?? ""} />
      <input type="hidden" name="quantity" value={quantity} />
      <input type="hidden" name="hasCorrection" value={hasCorrection ? "true" : "false"} />
      <input type="hidden" name="prescriptionMethod" value={method} />

      <ol className="grid grid-cols-2 gap-px border border-outline-variant bg-outline-variant lg:grid-cols-4">
        {STEPS.map((entry, index) => {
          const number = index + 1;
          const active = step === number;
          const done = number < step && number <= maxStep;
          const reachable = number <= maxStep;
          return (
            <li key={entry.number}>
              <button
                type="button"
                onClick={() => reachable && goToStep(number)}
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                className={`flex h-full w-full items-center gap-3 p-3 text-left transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : done
                      ? "bg-surface-dim text-primary hover:bg-surface-container"
                      : "bg-white text-on-surface-variant disabled:opacity-60"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center text-[0.7rem] font-semibold ${
                    active
                      ? "bg-gold text-primary"
                      : done
                        ? "bg-primary text-white"
                        : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {done ? <Icon name="check" size={14} /> : entry.number}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-[0.58rem] uppercase tracking-[0.14em] ${
                      active ? "text-gold" : "text-outline"
                    }`}
                  >
                    {done ? "Terminé" : active ? "En cours" : "À venir"}
                  </span>
                  <span className="block truncate text-[0.8rem] leading-snug">
                    {entry.label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
        <aside className="order-2 flex flex-col gap-4 lg:order-1 lg:col-span-4 lg:sticky lg:top-28">
          <div className="border border-outline-variant bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <span className="eyebrow">Monture sélectionnée</span>
              {variant && variant.stock > 0 ? (
                <span className="badge-success">En stock</span>
              ) : (
                <span className="badge-error">Épuisé</span>
              )}
            </div>
            <p className="mt-2 text-[0.65rem] uppercase tracking-[0.16em] text-secondary">
              {product.brand}
            </p>
            <h2 className="mt-1 font-serif text-2xl leading-tight text-primary">
              {product.name}
            </h2>
            {variant && (
              <p className="mt-1 text-body-sm text-on-surface-variant">
                {variant.colorName} • {variant.sku}
              </p>
            )}

            <div className="relative mt-4 flex aspect-[4/3] items-center justify-center overflow-hidden bg-surface-dim">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 360px"
                  className="object-contain p-4"
                />
              ) : (
                <Icon name="glasses" size={64} className="text-outline" />
              )}
              {sizeLabel && (
                <span className="absolute bottom-2 left-2 bg-white/90 px-2 py-1 text-[0.6rem] uppercase tracking-[0.1em] text-primary backdrop-blur">
                  {sizeLabel}
                </span>
              )}
            </div>

            {variants.length > 1 && (
              <div className="mt-4">
                <p className="mb-2 text-[0.62rem] uppercase tracking-[0.12em] text-on-surface-variant">
                  Coloris
                </p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => {
                        setVariantId(entry.id);
                        setQuantity(1);
                      }}
                      aria-pressed={entry.id === variantId}
                      aria-label={`${entry.colorName}${entry.stock === 0 ? " — épuisé" : ""}`}
                      title={entry.colorName}
                      className={`relative flex h-8 w-8 items-center justify-center border p-0.5 transition-all ${
                        entry.id === variantId
                          ? "border-primary"
                          : "border-outline-variant hover:border-primary"
                      }`}
                    >
                      <span
                        className="block h-full w-full border border-black/10"
                        style={{ backgroundColor: entry.colorHex }}
                      />
                      {entry.stock === 0 && (
                        <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-[0.55rem] text-error">
                          ✕
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex items-baseline justify-between border-t border-outline-variant pt-3">
              <span className="text-body-sm text-on-surface-variant">
                Monture seule
              </span>
              <span className="font-medium text-primary">
                {formatDH(frameCents)}
              </span>
            </div>

            <div className="mt-3 bg-surface-dim p-3">
              <p className="text-[0.6rem] uppercase tracking-[0.14em] text-on-surface-variant">
                Options sélectionnées
              </p>
              <ul className="mt-2 space-y-1.5 text-body-sm">
                {hasCorrection ? (
                  <>
                    <li className="flex items-start justify-between gap-3">
                      <span className="flex items-start gap-1.5 text-on-surface">
                        <Icon
                          name="check"
                          size={14}
                          className="mt-1 text-secondary"
                        />
                        {lensType?.name ?? "Type de verre à choisir"}
                      </span>
                      <span className="shrink-0 font-medium text-primary">
                        {lensType ? formatDH(lensType.priceCents) : "—"}
                      </span>
                    </li>
                    <li className="flex items-start justify-between gap-3">
                      <span className="flex items-start gap-1.5 text-on-surface">
                        <Icon
                          name="check"
                          size={14}
                          className="mt-1 text-secondary"
                        />
                        {lensIndex
                          ? `Indice ${lensIndex.value} — ${lensIndex.name}`
                          : "Indice à choisir"}
                      </span>
                      <span className="shrink-0 font-medium text-primary">
                        {lensIndex ? formatDH(lensIndex.priceCents) : "—"}
                      </span>
                    </li>
                    {selectedTreatments.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-start justify-between gap-3"
                      >
                        <span className="flex items-start gap-1.5 text-on-surface">
                          <Icon
                            name="check"
                            size={14}
                            className="mt-1 text-secondary"
                          />
                          {entry.name}
                        </span>
                        <span className="shrink-0 font-medium text-primary">
                          {formatDH(entry.priceCents)}
                        </span>
                      </li>
                    ))}
                  </>
                ) : (
                  <li className="flex items-start gap-1.5 text-on-surface">
                    <Icon
                      name="check"
                      size={14}
                      className="mt-1 text-secondary"
                    />
                    Verres neutres — sans correction
                  </li>
                )}
              </ul>
            </div>

            {hasCorrection && (
              <div
                role="status"
                aria-live="polite"
                className={`mt-3 border px-3 py-2 text-body-sm ${
                  opticalStatus === "APPROVED"
                    ? "border-success/30 bg-success-container text-success"
                    : opticalStatus === "INCOMPATIBLE"
                      ? "border-error/30 bg-error-container text-error"
                      : "border-gold/50 bg-[#fbf7ea] text-secondary"
                }`}
              >
                {opticalStatus === "LOADING"
                  ? "Vérification de la décision de compatibilité…"
                  : opticalStatus === "APPROVED"
                    ? "Cette combinaison exacte est enregistrée comme validée. L’ordonnance et les données de commande restent soumises aux contrôles habituels."
                    : opticalStatus === "INCOMPATIBLE"
                      ? "Cette combinaison exacte est enregistrée comme incompatible ou comporte une option indisponible. Elle ne peut pas être commandée."
                      : "Aucune validation professionnelle enregistrée pour cette combinaison exacte : elle est en attente et ne peut pas être commandée avec correction. Vous pouvez contacter l’équipe pour obtenir des informations, sans que cela constitue une validation."}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-[0.6rem] uppercase tracking-[0.14em] text-secondary">
                  Total estimé
                </p>
                <p className="text-[0.68rem] text-outline">
                  TVA incluse • Estimation en dirhams
                </p>
              </div>
              <p className="font-serif text-2xl text-primary">
                {formatDH(totalCents)}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-outline-variant pt-3">
              <span className="text-body-sm text-on-surface-variant">
                Quantité
              </span>
              <div className="flex items-center border border-outline-variant">
                <button
                  type="button"
                  onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1}
                  className="flex h-8 w-8 items-center justify-center text-primary disabled:opacity-40"
                  aria-label="Diminuer la quantité"
                >
                  <Icon name="minus" size={13} />
                </button>
                <span className="w-7 text-center text-body-sm" aria-live="polite">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((value) => Math.min(maxQuantity, value + 1))
                  }
                  disabled={quantity >= maxQuantity}
                  className="flex h-8 w-8 items-center justify-center text-primary disabled:opacity-40"
                  aria-label="Augmenter la quantité"
                >
                  <Icon name="plus" size={13} />
                </button>
              </div>
            </div>
          </div>

          <div className="border border-gold/50 bg-[#fbf7ea] p-4">
            <p className="flex items-center gap-2 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-secondary">
              <Icon name="shield" size={16} />
              Informations de remboursement
            </p>
            <p className="mt-1.5 text-[0.75rem] leading-relaxed text-on-surface-variant">
              Les conditions de remboursement et les documents requis dépendent
              de votre organisme. Renseignez-vous directement auprès de celui-ci.
            </p>
          </div>

          <div className="flex items-center justify-between gap-3 border border-outline-variant bg-white p-4">
            <div className="min-w-0">
              <p className="text-[0.62rem] uppercase tracking-[0.12em] text-primary">
                Besoin d&apos;un conseil optique ?
              </p>
              <p className="mt-0.5 text-[0.72rem] text-on-surface-variant">
                Contactez notre équipe au sujet de votre sélection.
              </p>
            </div>
            <a
              href={opticalWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-quiet btn-sm shrink-0"
              aria-label="Contacter sur WhatsApp"
            >
              WhatsApp
            </a>
          </div>
        </aside>

        <section className="order-1 flex flex-col gap-4 lg:order-2 lg:col-span-8">
          {/* STEP 1 */}
          <div className={step === 1 ? "border border-outline-variant bg-white p-5 md:p-7" : "hidden"}>
            <p className="eyebrow">Étape 01</p>
            <h2 className="mt-1 font-serif text-2xl text-primary">
              Quelle est votre correction ?
            </h2>
            <p className="mt-2 max-w-xl text-body-sm leading-relaxed text-on-surface-variant">
              Les verres correcteurs nécessitent une ordonnance ophtalmologique
              récente. Les verres neutres conviennent aux montures portées sans
              correction.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setHasCorrection(false)}
                aria-pressed={!hasCorrection}
                className={`flex flex-col justify-between border p-4 text-left transition-colors ${
                  !hasCorrection
                    ? "border-primary bg-surface-dim ring-1 ring-primary"
                    : "border-outline-variant hover:border-primary"
                }`}
              >
                <span className="flex w-full items-start justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center bg-surface-container text-primary">
                    <Icon name="sun" size={18} />
                  </span>
                  {!hasCorrection && (
                    <span className="badge-gold">Sélection actuelle</span>
                  )}
                </span>
                <span className="mt-2 block font-serif text-lg text-primary">
                  Sans correction
                </span>
                <span className="mt-1 block text-[0.78rem] leading-relaxed text-on-surface-variant">
                  Verres neutres inclus, pour le confort visuel ou le style.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setHasCorrection(true)}
                disabled={correctableTypes.length === 0}
                aria-pressed={hasCorrection}
                className={`flex flex-col justify-between border p-4 text-left transition-colors disabled:opacity-50 ${
                  hasCorrection
                    ? "border-primary bg-surface-dim ring-1 ring-primary"
                    : "border-outline-variant hover:border-primary"
                }`}
              >
                <span className="flex w-full items-start justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center bg-surface-container text-primary">
                    <Icon name="eye" size={18} />
                  </span>
                  {hasCorrection && (
                    <span className="badge-gold">Sélection actuelle</span>
                  )}
                </span>
                <span className="mt-2 block font-serif text-lg text-primary">
                  Avec correction médicale
                </span>
                <span className="mt-1 block text-[0.78rem] leading-relaxed text-on-surface-variant">
                  Myopie, hypermétropie, astigmatisme ou presbytie.
                </span>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => nextFrom(1)}
                className="btn-primary gap-2"
              >
                Verres &amp; traitements
                <Icon name="arrow-right" size={16} />
              </button>
            </div>
          </div>

          {/* STEP 2 */}
          <div className={step === 2 ? "border border-outline-variant bg-white p-5 md:p-7" : "hidden"}>
            <p className="eyebrow">Étape 02</p>
            <h2 className="mt-1 font-serif text-2xl text-primary">
              Verres de précision &amp; traitements
            </h2>
            <p className="mt-2 max-w-xl text-body-sm leading-relaxed text-on-surface-variant">
              Les prix s&apos;ajoutent à la monture. Notre opticien vérifie la
              compatibilité de l&apos;indice avec votre ordonnance avant le
              montage.
            </p>

            {stepError && (
              <p role="alert" className="mt-4 flex items-start gap-2 border border-error/30 bg-error-container px-3 py-2 text-body-sm text-error">
                <Icon name="alert" size={16} className="mt-0.5" />
                {stepError}
              </p>
            )}

            {hasCorrection ? (
              <>
                <fieldset className="mt-6">
                  <legend className="text-[0.62rem] uppercase tracking-[0.14em] text-outline">
                    01 — Type de verre
                  </legend>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {correctableTypes.map((entry) => {
                      const selected = entry.id === lensTypeId;
                      return (
                        <label
                          key={entry.id}
                          className={`cursor-pointer border p-4 transition-colors ${
                            selected
                              ? "border-primary bg-surface-dim ring-1 ring-primary"
                              : "border-outline-variant hover:border-primary"
                          }`}
                        >
                          <span className="flex items-start justify-between gap-3">
                            <span className="font-serif text-lg leading-tight text-primary">
                              {entry.name}
                            </span>
                            <span className="shrink-0 text-body-sm font-medium text-primary">
                              {entry.priceCents === 0
                                ? "Inclus"
                                : formatDH(entry.priceCents)}
                            </span>
                          </span>
                          <span className="mt-1 block text-[0.76rem] leading-relaxed text-on-surface-variant">
                            {entry.description}
                          </span>
                          <input
                            type="radio"
                            name="lensTypeId"
                            value={entry.id}
                            checked={selected}
                            onChange={() => setLensTypeId(entry.id)}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset className="mt-6">
                  <legend className="text-[0.62rem] uppercase tracking-[0.14em] text-outline">
                    02 — Indice d&apos;amincissement
                  </legend>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    {lensIndices.map((entry) => {
                      const selected = entry.id === lensIndexId;
                      return (
                        <label
                          key={entry.id}
                          className={`cursor-pointer border p-3 transition-colors ${
                            selected
                              ? "border-primary bg-surface-dim ring-1 ring-primary"
                              : "border-outline-variant hover:border-primary"
                          }`}
                        >
                          <span className="block text-[0.58rem] uppercase tracking-[0.12em] text-on-surface-variant">
                            {entry.name} ({entry.value})
                          </span>
                          <span className="mt-1 block text-[0.72rem] leading-snug text-on-surface-variant">
                            {`Indice ${entry.value}`}
                          </span>
                          <span className="mt-1 block text-[0.78rem] font-semibold text-primary">
                            {entry.priceCents === 0
                              ? "Inclus"
                              : `+ ${formatDH(entry.priceCents)}`}
                          </span>
                          <input
                            type="radio"
                            name="lensIndexId"
                            value={entry.id}
                            checked={selected}
                            onChange={() => setLensIndexId(entry.id)}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <fieldset className="mt-6">
                  <legend className="text-[0.62rem] uppercase tracking-[0.14em] text-outline">
                    03 — Traitements
                  </legend>
                  <div className="mt-2 space-y-2">
                    {treatments.map((entry) => {
                      const selected = treatmentIds.includes(entry.id);
                      return (
                        <label
                          key={entry.id}
                          className={`flex cursor-pointer items-start gap-3 border p-3 transition-colors ${
                            selected
                              ? "border-primary bg-surface-dim"
                              : "border-outline-variant hover:border-primary"
                          }`}
                        >
                          <input
                            type="checkbox"
                            name="treatmentIds"
                            value={entry.id}
                            checked={selected}
                            onChange={() => toggleTreatment(entry.id)}
                            className="mt-1 h-4 w-4 shrink-0 accent-[#2e4243]"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-3">
                              <span className="text-body-sm font-medium text-primary">
                                {entry.name}
                              </span>
                              <span className="shrink-0 text-body-sm text-primary">
                                {entry.priceCents === 0
                                  ? "Inclus"
                                  : `+ ${formatDH(entry.priceCents)}`}
                              </span>
                            </span>
                            <span className="mt-0.5 block text-[0.73rem] leading-relaxed text-on-surface-variant">
                              {entry.description}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </>
            ) : (
              <div className="mt-6 border border-outline-variant bg-surface-dim p-4">
                <p className="text-body-sm leading-relaxed text-on-surface-variant">
                  Vous avez choisi des verres neutres : aucun supplément ne
                  s&apos;applique et aucune ordonnance n&apos;est requise. Vous
                  pouvez passer directement au récapitulatif.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="inline-flex items-center gap-2 px-2 py-2 text-[0.65rem] uppercase tracking-[0.12em] text-primary hover:text-secondary"
              >
                <Icon name="arrow-left" size={16} />
                Étape précédente
              </button>
              <button
                type="button"
                onClick={() => nextFrom(2)}
                className="btn-primary gap-2"
              >
                {hasCorrection ? "Ordonnance" : "Récapitulatif"}
                <Icon name="arrow-right" size={16} />
              </button>
            </div>
          </div>

          {/* STEP 3 */}
          <div className={step === 3 ? "border border-outline-variant bg-white p-5 md:p-7" : "hidden"}>
            {hasCorrection ? (
              <>
                <p className="eyebrow">Étape 03 — Transmission médicale</p>
                <h2 className="mt-1 font-serif text-2xl text-primary">
                  Comment souhaitez-vous nous transmettre votre ordonnance ?
                </h2>
                <p className="mt-2 max-w-2xl text-body-sm leading-relaxed text-on-surface-variant">
                  Les informations transmises sont examinées avant le montage.
                  Votre document est conservé dans un espace privé et accessible
                  uniquement aux personnes habilitées.
                </p>

                {stepError && (
                  <p role="alert" className="mt-4 flex items-start gap-2 border border-error/30 bg-error-container px-3 py-2 text-body-sm text-error">
                    <Icon name="alert" size={16} className="mt-0.5" />
                    {stepError}
                  </p>
                )}

                <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    {
                      value: "UPLOAD" as const,
                      title: "Téléverser",
                      hint: "Scan, photo ou PDF",
                      icon: "upload" as const,
                    },
                    {
                      value: "MANUAL" as const,
                      title: "Saisir les mesures",
                      hint: "Sphère, cylindre, axe",
                      icon: "edit" as const,
                    },
                    {
                      value: "WHATSAPP" as const,
                      title: "WhatsApp",
                      hint: "Photo directe à l'atelier",
                      icon: "whatsapp" as const,
                    },
                    {
                      value: "LATER" as const,
                      title: "Plus tard",
                      hint: "Sous 15 jours",
                      icon: "clock" as const,
                    },
                  ].map((entry) => {
                    const selected = method === entry.value;
                    return (
                      <button
                        key={entry.value}
                        type="button"
                        onClick={() => {
                          setMethod(entry.value);
                          setStepError(null);
                        }}
                        aria-pressed={selected}
                        className={`flex min-h-[104px] flex-col justify-between border p-3 text-left transition-colors ${
                          selected
                            ? "border-primary bg-primary text-white"
                            : "border-outline-variant hover:border-primary"
                        }`}
                      >
                        <Icon
                          name={entry.icon}
                          size={22}
                          className={selected ? "text-gold" : "text-outline"}
                        />
                        <span>
                          <span className="block text-body-sm font-medium leading-tight">
                            {entry.title}
                          </span>
                          <span
                            className={`mt-0.5 block text-[0.68rem] ${
                              selected ? "text-white/70" : "text-on-surface-variant"
                            }`}
                          >
                            {entry.hint}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5">
                  <div className={method === "UPLOAD" ? "" : "hidden"}>
                    <label
                      htmlFor="prescriptionFile"
                      className={`flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed p-8 text-center transition-colors ${
                        fileError
                          ? "border-error bg-error-container/40"
                          : "border-outline-variant bg-surface-dim hover:border-primary"
                      }`}
                    >
                      <Icon name="upload" size={32} className="text-secondary" />
                      <span className="font-serif text-lg text-primary">
                        {fileName || "Glissez votre ordonnance ici"}
                      </span>
                      <span className="text-body-sm text-on-surface-variant">
                        ou cliquez pour parcourir vos fichiers
                      </span>
                      <span className="mt-1 text-[0.6rem] uppercase tracking-[0.12em] text-outline">
                        PDF, JPEG, PNG ou HEIC — 10 Mo maximum
                      </span>
                    </label>
                    <input
                      id="prescriptionFile"
                      name="prescriptionFile"
                      type="file"
                      accept="application/pdf,image/jpeg,image/png,image/heic,image/heif"
                      disabled={method !== "UPLOAD"}
                      onChange={(event) =>
                        handleFile(event.target.files?.[0] ?? null)
                      }
                      className="sr-only"
                    />
                    {fileError && (
                      <p role="alert" className="mt-2 text-body-sm text-error">
                        {fileError}
                      </p>
                    )}
                  </div>

                  {method === "MANUAL" && (
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.14em] text-primary">
                          <Icon name="eye" size={16} className="text-secondary" />
                          Grille de mesures optométriques
                        </p>
                        <span className="text-[0.7rem] text-outline">
                          Unités : dioptries (D) et degrés (°)
                        </span>
                      </div>

                      <div className="border border-outline-variant bg-surface-dim p-3">
                        <div className="space-y-3">
                          <div className="grid grid-cols-[1.15fr_repeat(3,minmax(0,1fr))] gap-2 text-[0.55rem] uppercase tracking-[0.1em] text-outline">
                            <div>Œil</div>
                            <div className="text-center">Sphère</div>
                            <div className="text-center">Cylindre</div>
                            <div className="text-center">Axe</div>
                          </div>

                          <div className="grid grid-cols-[1.15fr_repeat(3,minmax(0,1fr))] items-center gap-2 bg-white p-2">
                            <div className="flex items-center gap-1.5">
                              <span className="flex h-7 w-7 items-center justify-center bg-surface-container text-[0.65rem] font-bold text-primary">
                                OD
                              </span>
                              <span className="text-[0.72rem] leading-tight text-primary">
                                Œil droit
                              </span>
                            </div>
                            {(["rightSphere", "rightCylinder", "rightAxis"] as const).map(
                              (key) => (
                                <div key={key}>
                                  <label htmlFor={key} className="sr-only">
                                    {key}
                                  </label>
                                  <input
                                    id={key}
                                    name={key}
                                    type="number"
                                    inputMode="decimal"
                                    step={key === "rightAxis" ? 1 : "any"}
                                    placeholder={
                                      RX_FIELDS.find((entry) => entry.key === key)
                                        ?.placeholder
                                    }
                                    value={rx[key]}
                                    onChange={(event) =>
                                      updateRx(key, event.target.value)
                                    }
                                    className="field px-2 py-1.5 text-center text-body-sm"
                                  />
                                </div>
                              ),
                            )}
                          </div>

                          <div className="grid grid-cols-[1.15fr_repeat(3,minmax(0,1fr))] items-center gap-2 bg-white p-2">
                            <div className="flex items-center gap-1.5">
                              <span className="flex h-7 w-7 items-center justify-center bg-surface-container text-[0.65rem] font-bold text-primary">
                                OG
                              </span>
                              <span className="text-[0.72rem] leading-tight text-primary">
                                Œil gauche
                              </span>
                            </div>
                            {(["leftSphere", "leftCylinder", "leftAxis"] as const).map(
                              (key) => (
                                <div key={key}>
                                  <label htmlFor={key} className="sr-only">
                                    {key}
                                  </label>
                                  <input
                                    id={key}
                                    name={key}
                                    type="number"
                                    inputMode="decimal"
                                    step={key === "leftAxis" ? 1 : "any"}
                                    placeholder={
                                      RX_FIELDS.find((entry) => entry.key === key)
                                        ?.placeholder
                                    }
                                    value={rx[key]}
                                    onChange={(event) =>
                                      updateRx(key, event.target.value)
                                    }
                                    className="field px-2 py-1.5 text-center text-body-sm"
                                  />
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 space-y-2">
                        <label htmlFor="customerNote" className="field-label">
                          Précisions pour l&apos;atelier (facultatif)
                        </label>
                        <textarea
                          id="customerNote"
                          name="customerNote"
                          rows={2}
                          maxLength={500}
                          placeholder="Presbytie, port de lentilles, remarques de votre ophtalmologiste…"
                          className="field"
                        />
                        <p className="text-[0.7rem] leading-relaxed text-outline">
                          OD désigne l&apos;œil droit et OG l&apos;œil gauche. Les mesures saisies sont déclarées par le client et seront vérifiées par l&apos;opticien.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className={method === "WHATSAPP" ? "" : "hidden"}>
                    <div className="flex flex-col gap-4 bg-surface-dim p-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                          <Icon name="whatsapp" size={22} />
                        </span>
                        <div>
                          <p className="font-serif text-lg text-primary">
                            Transmission instantanée WhatsApp
                          </p>
                          <p className="mt-1 max-w-md text-body-sm leading-relaxed text-on-surface-variant">
                            Photographiez votre ordonnance et transmettez-la à
                            notre opticien. Indiquez votre nom et la référence de
                            votre panier. Le document sera rattaché à votre
                            commande.
                          </p>
                        </div>
                      </div>
                      <a
                        href={whatsappHref(
                          whatsapp,
                          WHATSAPP_MESSAGES.optical,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary shrink-0 gap-2"
                        aria-label="Contacter sur WhatsApp"
                      >
                        <Icon name="whatsapp" size={16} />
                        Ouvrir WhatsApp
                      </a>
                    </div>
                  </div>

                  <div className={method === "LATER" ? "" : "hidden"}>
                    <div className="border border-outline-variant bg-surface-dim p-5">
                      <p className="flex items-center gap-2 font-serif text-lg text-primary">
                        <Icon name="clock" size={18} className="text-secondary" />
                        Commandez aujourd&apos;hui, transmettez sous 15 jours
                      </p>
                      <p className="mt-2 max-w-xl text-body-sm leading-relaxed text-on-surface-variant">
                        Votre monture est réservée dans nos ateliers. Un opticien
                        vous contacte après la commande pour recueillir votre
                        ordonnance par le canal de votre choix. Aucun verre
                        correcteur n&apos;est taillé avant réception et
                        vérification du document.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3 border border-outline-variant bg-surface-container p-3">
                  <Icon name="shield" size={18} className="mt-0.5 text-secondary" />
                  <p className="text-[0.75rem] leading-relaxed text-on-surface">
                    Votre document est stocké dans un espace privé et n&apos;est pas
                    publié sur la boutique. Pour les règles de validité de votre
                    ordonnance et les pièces de remboursement, consultez votre
                    professionnel et votre organisme.
                  </p>
                </div>
              </>
            ) : (
              <div>
                <p className="eyebrow">Étape 03</p>
                <h2 className="mt-1 font-serif text-2xl text-primary">
                  Aucune ordonnance requise
                </h2>
                <p className="mt-2 max-w-xl text-body-sm leading-relaxed text-on-surface-variant">
                  Vous avez choisi des verres neutres. Passez au récapitulatif
                  pour ajouter votre monture au panier.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="inline-flex items-center gap-2 px-2 py-2 text-[0.65rem] uppercase tracking-[0.12em] text-primary hover:text-secondary"
              >
                <Icon name="arrow-left" size={16} />
                Étape précédente
              </button>
              <button
                type="button"
                onClick={() => nextFrom(3)}
                className="btn-primary gap-2"
              >
                Récapitulatif
                <Icon name="arrow-right" size={16} />
              </button>
            </div>
          </div>

          {/* STEP 4 */}
          <div className={step === 4 ? "border border-outline-variant bg-white p-5 md:p-7" : "hidden"}>
            <p className="eyebrow">Étape 04</p>
            <h2 className="mt-1 font-serif text-2xl text-primary">
              Récapitulatif de votre configuration
            </h2>
            <p className="mt-2 max-w-xl text-body-sm leading-relaxed text-on-surface-variant">
              Vérifiez les éléments ci-dessous. Le montant final est recalculé
              côté serveur au moment de l&apos;ajout au panier.
            </p>

            <dl className="mt-5 divide-y divide-outline-variant border-y border-outline-variant text-body-sm">
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-on-surface-variant">Monture</dt>
                <dd className="text-right font-medium text-primary">
                  {product.name}
                  {variant ? ` — ${variant.colorName}` : ""}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-on-surface-variant">Correction</dt>
                <dd className="text-right font-medium text-primary">
                  {hasCorrection ? "Avec correction médicale" : "Sans correction"}
                </dd>
              </div>
              {hasCorrection && (
                <>
                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-on-surface-variant">Type de verre</dt>
                    <dd className="text-right font-medium text-primary">
                      {lensType?.name ?? "—"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-on-surface-variant">Indice</dt>
                    <dd className="text-right font-medium text-primary">
                      {lensIndex
                        ? `${lensIndex.value} — ${lensIndex.name}`
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-on-surface-variant">Traitements</dt>
                    <dd className="text-right font-medium text-primary">
                      {selectedTreatments.length > 0
                        ? selectedTreatments.map((entry) => entry.name).join(", ")
                        : "Aucun"}
                    </dd>
                  </div>
                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-on-surface-variant">Ordonnance</dt>
                    <dd className="text-right font-medium text-primary">
                      {method === "UPLOAD"
                        ? fileName || "Fichier à téléverser"
                        : method === "MANUAL"
                          ? "Mesures saisies manuellement"
                          : method === "WHATSAPP"
                            ? "Transmission par WhatsApp"
                            : "Transmission ultérieure (15 jours)"}
                    </dd>
                  </div>
                </>
              )}
              <div className="flex items-start justify-between gap-4 py-3">
                <dt className="text-on-surface-variant">Quantité</dt>
                <dd className="text-right font-medium text-primary">{quantity}</dd>
              </div>
            </dl>

            <div className="mt-4 space-y-1.5 text-body-sm">
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">
                  Monture × {quantity}
                </span>
                <span className="text-primary">{formatDH(frameCents * quantity)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">
                  Verres &amp; traitements × {quantity}
                </span>
                <span className="text-primary">
                  {formatDH(lensPriceCents * quantity)}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-outline-variant pt-2 text-base">
                <span className="font-medium text-primary">Total</span>
                <span className="font-semibold text-primary">
                  {formatDH(totalCents)}
                </span>
              </div>
              <p className="text-[0.68rem] text-outline">
                TVA 20 % incluse. Livraison calculée à l&apos;étape du panier.
              </p>
            </div>

            {stepError && (
              <p role="alert" className="mt-4 flex items-start gap-2 border border-error/30 bg-error-container px-3 py-2 text-body-sm text-error">
                <Icon name="alert" size={16} className="mt-0.5" />
                {stepError}
              </p>
            )}

            {state && !state.ok && (
              <div role="alert" className="mt-4 border border-error/30 bg-error-container px-3 py-2 text-body-sm text-error">
                <p className="flex items-start gap-2">
                  <Icon name="alert" size={16} className="mt-0.5" />
                  {state.message}
                </p>
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
            )}

            <div className="mt-6 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => goToStep(hasCorrection ? 3 : 2)}
                className="inline-flex items-center justify-center gap-2 px-2 py-2 text-[0.65rem] uppercase tracking-[0.12em] text-primary hover:text-secondary"
              >
                <Icon name="arrow-left" size={16} />
                Modifier
              </button>
              <SubmitButton totalCents={totalCents} />
            </div>

            <p className="mt-3 text-center text-[0.7rem] leading-relaxed text-outline sm:text-right">
              Les mesures saisies sont déclarées par le client et seront vérifiées par l&apos;opticien. Aucune interprétation médicale automatisée n&apos;est réalisée.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border border-outline-variant bg-surface-dim p-4">
            <div className="flex items-center gap-2 text-[0.72rem] text-on-surface-variant">
              <Icon name="shield" size={16} className="text-secondary" />
              Les conditions de commande sont précisées dans les pages d&apos;information.
            </div>
            <Link
              href={`/produit/${product.slug}`}
              className="text-[0.65rem] uppercase tracking-[0.12em] text-secondary hover:underline"
            >
              Revenir à la monture
            </Link>
          </div>
        </section>
      </div>
    </form>
  );
}
