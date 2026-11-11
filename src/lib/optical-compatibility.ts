import { createHash } from "node:crypto";
import type {
  OpticalCombination,
  ReviewStatus,
} from "@/lib/optical-status";

export {
  OPTICAL_REVIEW_MESSAGE,
  effectiveOpticalStatus,
  type OpticalCombination,
  type ReviewStatus,
} from "@/lib/optical-status";

/** Décisions à portée exacte : aucune approbation héritée ou automatique. */
export function opticalSignature(combination: OpticalCombination): string {
  return createHash("sha256")
    .update(
      JSON.stringify([
        combination.productId,
        combination.variantId,
        combination.lensTypeId,
        combination.lensIndexId,
        [...combination.treatmentIds].sort(),
      ]),
    )
    .digest("hex");
}

export type OpticalStatus = ReviewStatus;
