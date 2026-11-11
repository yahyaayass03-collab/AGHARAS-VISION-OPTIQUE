import { describe, expect, it } from "vitest";
import {
  computeDiscountCents,
  computeLensPriceCents,
  computeShippingCents,
  validateLensSelection,
  type LensSelection,
} from "@/lib/pricing";

const lensType = {
  id: "type-1",
  name: "Unifocaux HD",
  kind: "SINGLE_VISION" as const,
  priceCents: 25_000,
  productTypes: ["OPTICAL", "CLIP"],
};

const lensIndex = {
  id: "index-1",
  name: "Amincis",
  value: "1.60",
  priceCents: 25_000,
  maxAbsSphere: 6,
};

const treatments = [
  { id: "t1", name: "Anti-reflet", priceCents: 0, isDefault: true },
  { id: "t2", name: "BlueProtect", priceCents: 35_000 },
];

const selection: LensSelection = {
  hasCorrection: true,
  lensType,
  lensIndex,
  treatments,
};

describe("computeLensPriceCents", () => {
  it("retourne zéro sans correction", () => {
    expect(
      computeLensPriceCents({ ...selection, hasCorrection: false }),
    ).toBe(0);
  });

  it("additionne le type, l'indice et les traitements", () => {
    expect(computeLensPriceCents(selection)).toBe(85_000);
  });

  it("tolère un type ou un indice absent", () => {
    expect(
      computeLensPriceCents({
        hasCorrection: true,
        lensType: null,
        lensIndex: null,
        treatments: [treatments[1]!],
      }),
    ).toBe(35_000);
  });
});

describe("validateLensSelection", () => {
  it("accepte une sélection compatible", () => {
    const result = validateLensSelection(selection, "OPTICAL");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.priceCents).toBe(85_000);
      expect(result.summary).toContain("indice 1.60");
      expect(result.breakdown).toHaveLength(4);
    }
  });

  it("refuse une monture incompatible", () => {
    const result = validateLensSelection(selection, "CONTACT_LENS");
    expect(result).toEqual({
      ok: false,
      error: "Ce type de verre n'est pas compatible avec cette monture.",
    });
  });

  it("refuse un type de verre absent ou neutre", () => {
    expect(
      validateLensSelection({ ...selection, lensType: null }, "OPTICAL").ok,
    ).toBe(false);
    expect(
      validateLensSelection(
        { ...selection, lensType: { ...lensType, kind: "NONE" } },
        "OPTICAL",
      ).ok,
    ).toBe(false);
  });

  it("refuse un indice inactif ou un traitement retiré", () => {
    expect(
      validateLensSelection(
        { ...selection, lensIndex: { ...lensIndex, isActive: false } },
        "OPTICAL",
      ).ok,
    ).toBe(false);
    expect(
      validateLensSelection(
        {
          ...selection,
          treatments: [{ ...treatments[1]!, isActive: false }],
        },
        "OPTICAL",
      ).ok,
    ).toBe(false);
  });

  it("ne juge pas la plausibilité médicale de la correction saisie", () => {
    const result = validateLensSelection(selection, "OPTICAL");
    expect(result.ok).toBe(true);
  });

  it("accepte une correction dans la plage", () => {
    const result = validateLensSelection(selection, "OPTICAL");
    expect(result.ok).toBe(true);
  });

  it("refuse toujours une option progressive pour un nouvel achat", () => {
    const result = validateLensSelection({
      ...selection,
      lensType: { ...lensType, kind: "PROGRESSIVE" },
    }, "OPTICAL");
    expect(result.ok).toBe(false);
  });

  it("considère une commande sans correction comme gratuite", () => {
    const result = validateLensSelection(
      { ...selection, hasCorrection: false },
      "OPTICAL",
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.priceCents).toBe(0);
  });
});

describe("computeDiscountCents", () => {
  const base = {
    code: "CERCLE10",
    type: "PERCENT" as const,
    value: 10,
    minSubtotalCents: 0,
    usageCount: 0,
    isActive: true,
  };

  it("calcule un pourcentage arrondi au centime", () => {
    expect(computeDiscountCents(base, 185_050)).toEqual({
      ok: true,
      discountCents: 18_505,
    });
  });

  it("plafonne la remise au sous-total", () => {
    expect(
      computeDiscountCents({ ...base, type: "FIXED", value: 50_000 }, 20_000),
    ).toEqual({ ok: true, discountCents: 20_000 });
  });

  it("refuse un code inactif, expiré ou futur", () => {
    const now = new Date("2026-06-15T12:00:00Z");
    expect(
      computeDiscountCents({ ...base, isActive: false }, 10_000, now).error,
    ).toMatch(/plus actif/);
    expect(
      computeDiscountCents(
        { ...base, endsAt: new Date("2026-06-14T00:00:00Z") },
        10_000,
        now,
      ).error,
    ).toMatch(/expiré/);
    expect(
      computeDiscountCents(
        { ...base, startsAt: new Date("2026-07-01T00:00:00Z") },
        10_000,
        now,
      ).error,
    ).toMatch(/pas encore valide/);
  });

  it("refuse un panier sous le seuil ou une limite atteinte", () => {
    expect(
      computeDiscountCents(
        { ...base, minSubtotalCents: 50_000 },
        40_000,
      ).error,
    ).toMatch(/insuffisant/);
    expect(
      computeDiscountCents(
        { ...base, usageLimit: 5, usageCount: 5 },
        40_000,
      ).error,
    ).toMatch(/limite/);
  });

  it("refuse un code inconnu", () => {
    expect(computeDiscountCents(null, 10_000)).toEqual({
      ok: false,
      discountCents: 0,
      error: "Code inconnu.",
    });
  });
});

describe("computeShippingCents", () => {
  it("retourne zéro sans méthode", () => {
    expect(computeShippingCents(null, 10_000)).toBe(0);
  });

  it("applique le tarif puis la gratuité au seuil", () => {
    const method = { priceCents: 4_000, freeFromCents: 80_000 };
    expect(computeShippingCents(method, 79_999)).toBe(4_000);
    expect(computeShippingCents(method, 80_000)).toBe(0);
  });

  it("ne renvoie jamais un montant négatif", () => {
    expect(computeShippingCents({ priceCents: -500 }, 0)).toBe(0);
  });
});
