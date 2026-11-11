"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { parseDHToCents } from "@/lib/money";
import { lensOptionSchema } from "@/lib/validation";
import { text, type AdminState } from "@/lib/admin";
import { ProductType } from "@prisma/client";

export async function saveLensOptionAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const actor = await assertPermission("products.update");
  const kind = text(formData, "kind");
  if (!["type", "index", "treatment"].includes(kind)) return { ok: false, message: "Type d'option invalide." };
  const parsed = lensOptionSchema.safeParse({ id: formData.get("id"), price: formData.get("price"), isActive: formData.get("isActive") ?? undefined });
  if (!parsed.success) return { ok: false, message: "Montant ou option invalide." };
  const priceCents = parseDHToCents(parsed.data.price);
  if (priceCents === null || priceCents < 0 || priceCents > 10_000_000) return { ok: false, message: "Indiquez un prix en dirhams compris entre 0 et 100 000." };
  const data = { priceCents, isActive: parsed.data.isActive === "on" };
  if (kind === "type") {
    // Preserve the row for historical references, but never reactivate it for new purchases.
    const selectedType = await db.lensType.findUnique({ where: { id: parsed.data.id }, select: { kind: true } });
    if (!selectedType) return { ok: false, message: "Option introuvable." };
    if (selectedType.kind === "PROGRESSIVE" && data.isActive) {
      return { ok: false, message: "Les verres progressifs ne sont plus disponibles pour les nouveaux achats." };
    }
    const selected = formData.getAll("productTypes").map(String);
    if (selected.some((value) => !Object.values(ProductType).includes(value as ProductType)) ||
        (data.isActive && selected.length === 0)) {
      return { ok: false, message: "Choisissez au moins un type de produit compatible avant d'activer ce verre." };
    }
    await db.lensType.update({ where: { id: parsed.data.id }, data: { ...data, productTypes: [...new Set(selected)] as ProductType[] } });
  }
  else if (kind === "index") await db.lensIndex.update({ where: { id: parsed.data.id }, data });
  else await db.lensTreatment.update({ where: { id: parsed.data.id }, data });
  await writeAudit({ userId: actor.id, actorEmail: actor.email, action: "lens.update", entityType: kind, entityId: parsed.data.id, metadata: data });
  revalidatePath("/admin/verres");
  revalidatePath("/");
  revalidatePath("/catalogue");
  return { ok: true, message: "Option enregistrée. Le nouveau prix est utilisé pour les prochaines configurations." };
}
