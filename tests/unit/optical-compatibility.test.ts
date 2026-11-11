import { describe, expect, it } from "vitest";
import { effectiveOpticalStatus, opticalSignature } from "@/lib/optical-compatibility";

describe("décisions de compatibilité exactes", () => {
  const base = { productId: "p", variantId: "v", lensTypeId: "l", lensIndexId: "i", treatmentIds: ["b", "a"] };
  it("ne transforme jamais une décision absente ou conflictuelle en approbation", () => {
    expect(effectiveOpticalStatus([])).toBe("PENDING_REVIEW");
    expect(effectiveOpticalStatus(["APPROVED"])).toBe("APPROVED");
    expect(effectiveOpticalStatus(["PENDING_REVIEW"])).toBe("PENDING_REVIEW");
    expect(effectiveOpticalStatus(["APPROVED", "INCOMPATIBLE"])).toBe("INCOMPATIBLE");
    expect(effectiveOpticalStatus(["APPROVED", "PENDING_REVIEW"])).toBe("PENDING_REVIEW");
  });
  it("distingue produits, variantes, indices et ensemble complet des traitements", () => {
    expect(opticalSignature(base)).toBe(opticalSignature({ ...base, treatmentIds: ["a", "b"] }));
    expect(opticalSignature(base)).not.toBe(opticalSignature({ ...base, treatmentIds: ["a"] }));
    expect(opticalSignature(base)).not.toBe(opticalSignature({ ...base, productId: "autre" }));
    expect(opticalSignature(base)).not.toBe(opticalSignature({ ...base, variantId: "autre" }));
  });
});
