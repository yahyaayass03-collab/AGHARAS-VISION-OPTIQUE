import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  variant: vi.fn(),
  lens: vi.fn(),
  index: vi.fn(),
  treatments: vi.fn(),
  rule: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: {
    productVariant: { findFirst: mocks.variant },
    lensType: { findUnique: mocks.lens },
    lensIndex: { findUnique: mocks.index },
    lensTreatment: { findMany: mocks.treatments },
    opticalCompatibilityRule: { findUnique: mocks.rule },
  },
}));

import { getOpticalCombinationStatusAction } from "@/app/actions/admin/optical-compatibility";
import { opticalSignature } from "@/lib/optical-compatibility";

const combination = {
  productId: "product-synthetic",
  variantId: "variant-synthetic",
  lensTypeId: "lens-synthetic",
  lensIndexId: "index-synthetic",
  treatmentIds: ["treatment-b", "treatment-a"],
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.variant.mockResolvedValue({ id: combination.variantId, product: { type: "OPTICAL" } });
  mocks.lens.mockResolvedValue({ isActive: true, productTypes: ["OPTICAL"] });
  mocks.index.mockResolvedValue({ isActive: true });
  mocks.treatments.mockResolvedValue([{ id: "treatment-a" }, { id: "treatment-b" }]);
  mocks.rule.mockResolvedValue({ status: "APPROVED" });
});

describe("public exact optical status feedback", () => {
  it("returns only the exact saved decision and does not make clinical conclusions", async () => {
    expect(await getOpticalCombinationStatusAction(combination)).toEqual({ status: "APPROVED" });
    expect(mocks.rule).toHaveBeenCalledWith({ where: { signature: opticalSignature(combination) } });
  });

  it("reports missing decisions as pending and rejects invalid options", async () => {
    mocks.rule.mockResolvedValue(null);
    expect(await getOpticalCombinationStatusAction(combination)).toEqual({ status: "PENDING_REVIEW" });

    expect(await getOpticalCombinationStatusAction({ ...combination, treatmentIds: ["same", "same"] })).toEqual({ status: "PENDING_REVIEW" });
    expect(await getOpticalCombinationStatusAction({ ...combination, productId: "" })).toEqual({ status: "PENDING_REVIEW" });
  });
});
