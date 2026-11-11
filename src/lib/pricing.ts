/**
 * Règles de prix et de compatibilité — module pur, testable sans base de données.
 * Tous les montants sont en centimes de dirham.
 */

export type LensTypeLike = {
  id: string;
  name: string;
  kind: "SINGLE_VISION" | "PROGRESSIVE" | "NONE";
  priceCents: number;
  productTypes: string[];
  isActive?: boolean;
};

export type LensIndexLike = {
  id: string;
  name: string;
  label?: string | null;
  value: string;
  priceCents: number;
  maxAbsSphere?: number | null;
  isActive?: boolean;
};

export type LensTreatmentLike = {
  id: string;
  name: string;
  description?: string;
  priceCents: number;
  isDefault?: boolean;
  isActive?: boolean;
};

export type LensSelection = {
  hasCorrection: boolean;
  lensType: LensTypeLike | null;
  lensIndex: LensIndexLike | null;
  treatments: LensTreatmentLike[];
};

export type LensValidationResult =
  | { ok: true; priceCents: number; summary: string; breakdown: BreakdownLine[] }
  | { ok: false; error: string };

export type BreakdownLine = {
  code: string;
  label: string;
  priceCents: number;
};

export function computeLensPriceCents(input: LensSelection): number {
  if (!input.hasCorrection) return 0;
  const type = input.lensType?.priceCents ?? 0;
  const index = input.lensIndex?.priceCents ?? 0;
  const treatments = input.treatments.reduce((sum, t) => sum + t.priceCents, 0);
  return type + index + treatments;
}

export function buildLensBreakdown(input: LensSelection): BreakdownLine[] {
  if (!input.hasCorrection) {
    return [
      {
        code: "none",
        label: "Sans correction — verres neutres inclus",
        priceCents: 0,
      },
    ];
  }
  const lines: BreakdownLine[] = [];
  if (input.lensType) {
    lines.push({
      code: "type",
      label: input.lensType.name,
      priceCents: input.lensType.priceCents,
    });
  }
  if (input.lensIndex) {
    lines.push({
      code: "index",
      label: `${input.lensIndex.name} (indice ${input.lensIndex.value})`,
      priceCents: input.lensIndex.priceCents,
    });
  }
  for (const treatment of input.treatments) {
    lines.push({
      code: `treatment:${treatment.id}`,
      label: treatment.name,
      priceCents: treatment.priceCents,
    });
  }
  return lines;
}

export function validateLensSelection(
  input: LensSelection,
  productType: string,
): LensValidationResult {
  if (!input.hasCorrection) {
    return {
      ok: true,
      priceCents: 0,
      summary: "Sans correction — verres neutres inclus",
      breakdown: buildLensBreakdown(input),
    };
  }

  if (!input.lensType || input.lensType.kind === "NONE" || input.lensType.kind === "PROGRESSIVE") {
    return { ok: false, error: "Veuillez sélectionner un type de verre correcteur." };
  }
  if (input.lensType.isActive === false) {
    return { ok: false, error: "Ce type de verre n'est plus disponible." };
  }
  if (!input.lensType.productTypes.includes(productType)) {
    return {
      ok: false,
      error: "Ce type de verre n'est pas compatible avec cette monture.",
    };
  }
  if (!input.lensIndex) {
    return { ok: false, error: "Veuillez sélectionner un indice d'amincissement." };
  }
  if (input.lensIndex.isActive === false) {
    return { ok: false, error: "Cet indice de verre n'est plus disponible." };
  }
  if (input.treatments.some((t) => t.isActive === false)) {
    return { ok: false, error: "Un traitement sélectionné n'est plus disponible." };
  }

  // Entered measurements are customer-provided; clinical review belongs to an
  // optician. Keep technical parsing, exact product compatibility and approval.
  return {
    ok: true,
    priceCents: computeLensPriceCents(input),
    summary: [
      input.lensType.name,
      `indice ${input.lensIndex.value}`,
      ...input.treatments.map((t) => t.name),
    ].join(" • "),
    breakdown: buildLensBreakdown(input),
  };
}

export type CouponLike = {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSubtotalCents: number;
  startsAt?: Date | null;
  endsAt?: Date | null;
  usageLimit?: number | null;
  usageCount: number;
  isActive: boolean;
};

export function computeDiscountCents(
  coupon: CouponLike | null,
  subtotalCents: number,
  now: Date = new Date(),
): { ok: boolean; discountCents: number; error?: string } {
  if (!coupon) return { ok: false, discountCents: 0, error: "Code inconnu." };
  if (!coupon.isActive) {
    return { ok: false, discountCents: 0, error: "Ce code n'est plus actif." };
  }
  if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
    return { ok: false, discountCents: 0, error: "Ce code n'est pas encore valide." };
  }
  if (coupon.endsAt && coupon.endsAt.getTime() < now.getTime()) {
    return { ok: false, discountCents: 0, error: "Ce code a expiré." };
  }
  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
    return { ok: false, discountCents: 0, error: "Ce code a atteint sa limite d'utilisation." };
  }
  if (subtotalCents < coupon.minSubtotalCents) {
    return {
      ok: false,
      discountCents: 0,
      error: "Le montant du panier est insuffisant pour ce code.",
    };
  }
  let discount =
    coupon.type === "PERCENT"
      ? Math.round((subtotalCents * coupon.value) / 100)
      : coupon.value;
  discount = Math.max(0, Math.min(discount, subtotalCents));
  return { ok: true, discountCents: discount };
}

export function computeShippingCents(
  method: { priceCents: number; freeFromCents?: number | null } | null,
  subtotalAfterDiscountCents: number,
): number {
  if (!method) return 0;
  if (
    method.freeFromCents !== null &&
    method.freeFromCents !== undefined &&
    subtotalAfterDiscountCents >= method.freeFromCents
  ) {
    return 0;
  }
  return Math.max(0, method.priceCents);
}

export type OrderStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

const ORDER_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PRODUCTION", "CANCELLED"],
  IN_PRODUCTION: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransitionOrder(
  from: OrderStatusValue,
  to: OrderStatusValue,
): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function allowedNextStatuses(
  from: OrderStatusValue,
): OrderStatusValue[] {
  return ORDER_TRANSITIONS[from] ?? [];
}
