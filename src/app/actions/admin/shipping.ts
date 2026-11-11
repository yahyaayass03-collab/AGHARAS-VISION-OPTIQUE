"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { parseDHToCents } from "@/lib/money";
import { text, type AdminState } from "@/lib/admin";

export async function saveShippingMethodAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const actor = await assertPermission("settings.manage");
  const id = text(formData, "id");
  const name = text(formData, "name").trim();
  const priceCents = parseDHToCents(text(formData, "price"));
  const freeFrom = text(formData, "freeFrom").trim();
  const freeFromCents = freeFrom ? parseDHToCents(freeFrom) : null;
  if (!id || name.length < 2 || name.length > 100 || priceCents === null || priceCents < 0 ||
      (freeFrom && (freeFromCents === null || freeFromCents < 0))) {
    return { ok: false, message: "Nom, prix ou seuil de livraison invalide." };
  }
  const method = await db.shippingMethod.findUnique({ where: { id } });
  if (!method) return { ok: false, message: "Mode de livraison introuvable." };
  await db.shippingMethod.update({ where: { id }, data: { name, priceCents, freeFromCents: freeFrom ? freeFromCents : null } });
  await writeAudit({ userId: actor.id, actorEmail: actor.email, action: "shipping.update", entityType: "ShippingMethod", entityId: id, metadata: { priceCents, freeFromCents } });
  revalidatePath("/admin/parametres");
  revalidatePath("/commande");
  revalidatePath("/panier");
  return { ok: true, message: "Livraison enregistrée." };
}
