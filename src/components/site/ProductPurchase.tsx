"use client";

import Link from "next/link";
import { useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { addSimpleToCartAction, type CartActionState } from "@/app/actions/cart";
import { Icon } from "@/components/ui/Icon";
import { formatDH } from "@/lib/money";

type Variant = {
  id: string;
  colorName: string;
  colorHex: string;
  sku: string;
  priceCents: number | null;
  stock: number;
};

function SubmitButton({ disabled, label }: { disabled: boolean; label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="btn-primary w-full py-3.5 disabled:opacity-50"
    >
      {pending ? "Ajout en cours…" : label}
    </button>
  );
}

export function ProductPurchase({
  productId,
  productName,
  slug,
  basePriceCents,
  variants,
  configurable,
  type,
}: {
  productId: string;
  productName: string;
  slug: string;
  basePriceCents: number;
  variants: Variant[];
  configurable: boolean;
  type: string;
}) {
  const [state, formAction] = useActionState<CartActionState, FormData>(
    addSimpleToCartAction,
    null,
  );
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const variant = variants.find((entry) => entry.id === variantId) ?? variants[0];
  const stock = variant?.stock ?? 0;
  const max = Math.min(stock, 5);
  const price = variant?.priceCents ?? basePriceCents;
  const soldOut = stock === 0;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-2 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.12em] text-on-surface-variant">
          <span>Coloris</span>
          <span className="text-primary">{variant?.colorName ?? "—"}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {variants.map((entry) => {
            const selected = entry.id === variantId;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => {
                  setVariantId(entry.id);
                  setQuantity(1);
                }}
                aria-pressed={selected}
                aria-label={`${entry.colorName}${entry.stock === 0 ? " — épuisé" : ""}`}
                title={entry.colorName}
                className={`relative flex h-9 w-9 items-center justify-center border p-0.5 transition-all ${
                  selected ? "border-primary" : "border-outline-variant hover:border-primary"
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
            );
          })}
        </div>
        <p className="mt-2 text-[0.68rem] text-outline">
          Référence : {variant?.sku ?? "—"}
        </p>
      </div>

      <div className="flex items-center justify-between border-y border-outline-variant py-3">
        <span className="text-body-sm text-on-surface-variant">
          {soldOut
            ? "Épuisé dans ce coloris"
            : stock <= 3
              ? `Stock limité — ${stock} exemplaire(s)`
              : "En stock, expédié sous 48 h"}
        </span>
        <span className="text-body-sm font-medium text-primary">{formatDH(price)}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center border border-outline-variant">
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            disabled={quantity <= 1}
            className="flex h-11 w-10 items-center justify-center text-primary disabled:opacity-40"
            aria-label="Diminuer la quantité"
          >
            <Icon name="minus" size={15} />
          </button>
          <span className="w-8 text-center text-body-sm" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((value) => Math.min(Math.max(1, max), value + 1))}
            disabled={quantity >= max}
            className="flex h-11 w-10 items-center justify-center text-primary disabled:opacity-40"
            aria-label="Augmenter la quantité"
          >
            <Icon name="plus" size={15} />
          </button>
        </div>

        <form action={formAction} className="flex-1">
          <input type="hidden" name="variantId" value={variantId} />
          <input type="hidden" name="quantity" value={quantity} />
          <SubmitButton
            disabled={soldOut}
            label={
              soldOut
                ? "Indisponible"
                : type === "ACCESSORY" || type === "CONTACT_LENS"
                  ? "Ajouter au panier"
                  : "Ajouter la monture seule"
            }
          />
        </form>
      </div>

      {configurable && (
        <Link
          href={`/configurateur/${slug}?variant=${variantId}`}
          className="btn-gold w-full py-3.5"
        >
          <Icon name="eye" size={17} />
          Configurer mes verres
          <span className="ml-auto text-[0.6rem] normal-case tracking-normal">
            sans surcoût
          </span>
        </Link>
      )}

      {state && !state.ok && (
        <p role="alert" className="flex items-start gap-2 border border-error/30 bg-error-container px-3 py-2 text-body-sm text-error">
          <Icon name="alert" size={16} className="mt-0.5" />
          {state.message}
        </p>
      )}

      {configurable && (
        <p className="text-[0.7rem] leading-relaxed text-outline">
          Monture seule : {formatDH(price)}. Les verres correcteurs sont calculés à
          l&apos;étape de configuration, selon votre ordonnance et les traitements choisis.
        </p>
      )}
    </div>
  );
}
