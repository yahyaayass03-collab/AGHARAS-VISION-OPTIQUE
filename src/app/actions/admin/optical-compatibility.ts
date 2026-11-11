"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { lockOpticalReviewCheckout } from "@/lib/optical-review-lock";
import { reachMariaDbCheckoutTestBarrier } from "@/lib/mariadb-checkout-test-barrier";
import { assertPermission } from "@/lib/auth/guards";
import { opticalSignature } from "@/lib/optical-compatibility";
import { evaluateOpticalCompatibility } from "@/lib/optical-compatibility-db";
import type { AdminState } from "@/lib/admin";

const inputSchema = z.object({
  productId: z.string().min(1).max(100), variantId: z.string().min(1).max(100),
  lensTypeId: z.string().min(1).max(100), lensIndexId: z.string().min(1).max(100),
  status: z.enum(["APPROVED", "INCOMPATIBLE", "PENDING_REVIEW"]),
  reviewer: z.string().trim().max(160), reviewDate: z.string().max(10), evidence: z.string().trim().max(1000),
  treatmentIds: z.array(z.string().min(1).max(100)).max(20), confirmed: z.boolean(),
});

const statusSchema = z.object({
  productId: z.string().min(1).max(100),
  variantId: z.string().min(1).max(100),
  lensTypeId: z.string().min(1).max(100),
  lensIndexId: z.string().min(1).max(100),
  treatmentIds: z.array(z.string().min(1).max(100)).max(20),
});

/** Public configurator feedback; final cart/checkout enforcement remains authoritative. */
export async function getOpticalCombinationStatusAction(input: unknown): Promise<{
  status: "APPROVED" | "INCOMPATIBLE" | "PENDING_REVIEW";
}> {
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success || new Set(parsed.data.treatmentIds).size !== parsed.data.treatmentIds.length) {
    return { status: "PENDING_REVIEW" };
  }
  const result = await evaluateOpticalCompatibility(db, parsed.data);
  return { status: result.status };
}

export async function saveOpticalDecisionAction(_previous: AdminState, form: FormData): Promise<AdminState> {
  const actor = await assertPermission("products.update");
  const result = inputSchema.safeParse({
    productId: form.get("productId"), variantId: form.get("variantId"), lensTypeId: form.get("lensTypeId"), lensIndexId: form.get("lensIndexId"),
    status: form.get("status"), reviewer: form.get("reviewer") ?? "", reviewDate: form.get("reviewDate") ?? "",
    evidence: form.get("evidence") ?? "", treatmentIds: form.getAll("treatmentIds"), confirmed: form.get("confirmed") === "on",
  });
  if (!result.success) return { ok: false, message: "Vérifiez la combinaison et les champs de validation." };
  const value = result.data;
  if (new Set(value.treatmentIds).size !== value.treatmentIds.length) return { ok: false, message: "Traitements en double." };
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value.reviewDate) ? new Date(`${value.reviewDate}T12:00:00.000Z`) : null;
  if (value.status !== "PENDING_REVIEW" && (!value.confirmed || value.reviewer.length < 2 || !date || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value.reviewDate || date.getTime() > Date.now() + 86_400_000)) {
    return { ok: false, message: "Une décision validée exige le nom du professionnel, la date réelle et la confirmation de sa revue." };
  }
  const [variant, lens, index, treatments] = await Promise.all([
    db.productVariant.findFirst({ where: { id: value.variantId, productId: value.productId } }),
    db.lensType.findUnique({ where: { id: value.lensTypeId } }),
    db.lensIndex.findUnique({ where: { id: value.lensIndexId } }),
    db.lensTreatment.count({ where: { id: { in: value.treatmentIds } } }),
  ]);
  if (!variant || !lens || !index || treatments !== value.treatmentIds.length) return { ok: false, message: "Produit, coloris, verre, indice ou traitement introuvable." };
  const signature = opticalSignature(value);
  const data = {
    productId: value.productId, variantId: value.variantId, lensTypeId: value.lensTypeId, lensIndexId: value.lensIndexId,
    treatmentIds: [...value.treatmentIds].sort(), status: value.status,
    reviewer: value.status === "PENDING_REVIEW" ? null : value.reviewer,
    reviewedAt: value.status === "PENDING_REVIEW" ? null : date,
    evidence: value.evidence || null, actorEmail: actor.email,
  };
  await reachMariaDbCheckoutTestBarrier("review-entering", signature);
  await db.$transaction(async (tx) => {
    // Used by checkout as well: rule updates cannot interleave with final validation.
    await lockOpticalReviewCheckout(tx);
    await reachMariaDbCheckoutTestBarrier("review-locked", signature);
    const previous = await tx.opticalCompatibilityRule.findUnique({ where: { signature } });
    const rule = await tx.opticalCompatibilityRule.upsert({ where: { signature }, create: { ...data, signature }, update: data });
    await tx.auditLog.create({ data: { userId: actor.id, actorEmail: actor.email, action: "optical.review", entityType: "OpticalCompatibilityRule", entityId: rule.id, metadata: { previous: previous?.status ?? null, status: value.status, reviewer: data.reviewer, reviewedAt: data.reviewedAt?.toISOString() ?? null, evidence: data.evidence } } });
  });
  revalidatePath("/admin/verres/compatibilite");
  revalidatePath("/configurateur", "layout");
  return { ok: true, message: "Décision enregistrée. Les combinaisons non enregistrées restent en attente." };
}
