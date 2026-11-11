import "server-only";
import { Prisma } from "@prisma/client";
import { opticalSignature, effectiveOpticalStatus, type OpticalCombination } from "@/lib/optical-compatibility";
import { jsonStringList } from "@/lib/json-string-list";

type Reader = Pick<Prisma.TransactionClient, "opticalCompatibilityRule" | "productVariant" | "lensType" | "lensIndex" | "lensTreatment">;

export async function evaluateOpticalCompatibility(db: Reader, input: OpticalCombination) {
  if (!input.productId || !input.variantId || !input.lensTypeId || !input.lensIndexId ||
      new Set(input.treatmentIds).size !== input.treatmentIds.length) {
    return { allowed: false, status: "PENDING_REVIEW" as const };
  }
  const [variant, lens, index, treatments, rule] = await Promise.all([
    db.productVariant.findFirst({ where: { id: input.variantId, productId: input.productId, isActive: true, product: { isActive: true, lensCompatible: true, category: { isActive: true }, brand: { isActive: true } } }, include: { product: true } }),
    db.lensType.findUnique({ where: { id: input.lensTypeId } }),
    db.lensIndex.findUnique({ where: { id: input.lensIndexId } }),
    db.lensTreatment.findMany({ where: { id: { in: input.treatmentIds }, isActive: true } }),
    db.opticalCompatibilityRule.findUnique({ where: { signature: opticalSignature(input) } }),
  ]);
  if (!variant || !lens?.isActive || !jsonStringList(lens.productTypes).includes(variant.product.type) || !index?.isActive || treatments.length !== input.treatmentIds.length) {
    return { allowed: false, status: "INCOMPATIBLE" as const };
  }
  const status = effectiveOpticalStatus(rule ? [rule.status] : []);
  return { allowed: status === "APPROVED", status };
}

export function opticalCombinationFromSnapshot(productId: string, variantId: string, snapshot: unknown): OpticalCombination | null {
  if (!snapshot || typeof snapshot !== "object") return null;
  const data = snapshot as Record<string, unknown>;
  if (data.hasCorrection !== true) return null;
  const treatments = Array.isArray(data.treatments) ? data.treatments : [];
  return {
    productId, variantId,
    lensTypeId: typeof data.lensTypeId === "string" ? data.lensTypeId : "",
    lensIndexId: typeof data.lensIndexId === "string" ? data.lensIndexId : "",
    treatmentIds: treatments.map((entry) => typeof entry === "object" && entry && typeof entry.id === "string" ? entry.id : ""),
  };
}
