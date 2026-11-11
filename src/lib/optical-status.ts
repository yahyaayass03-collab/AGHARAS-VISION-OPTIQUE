export type OpticalCombination = {
  productId: string;
  variantId: string;
  lensTypeId: string;
  lensIndexId: string;
  treatmentIds: string[];
};

export type ReviewStatus = "APPROVED" | "INCOMPATIBLE" | "PENDING_REVIEW";

export const OPTICAL_REVIEW_MESSAGE =
  "Cette combinaison de monture et de verres n'est pas disponible actuellement. Veuillez modifier votre sélection ou contacter notre équipe.";

export function effectiveOpticalStatus(
  statuses: ReviewStatus[],
): ReviewStatus {
  // Une règle conflictuelle ou incomplète ne produit jamais une approbation.
  if (statuses.includes("INCOMPATIBLE")) return "INCOMPATIBLE";
  if (statuses.length !== 1 || statuses[0] !== "APPROVED") {
    return "PENDING_REVIEW";
  }
  return "APPROVED";
}
