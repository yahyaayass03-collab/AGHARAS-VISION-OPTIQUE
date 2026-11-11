"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { HOME_SECTIONS } from "@/lib/home-layout";
import type { AdminState } from "@/lib/admin";

export async function saveHomeLayoutAction(_previous: AdminState, form: FormData): Promise<AdminState> {
  const actor = await assertPermission("content.manage");
  let sections: unknown, categories: unknown;
  try { sections = JSON.parse(String(form.get("sections"))); categories = JSON.parse(String(form.get("categories"))); }
  catch { return { ok: false, message: "Configuration de l'accueil invalide." }; }
  const allowed = HOME_SECTIONS.map(([id]) => id as string);
  if (!Array.isArray(sections) || sections.length !== allowed.length || new Set(sections).size !== allowed.length || !sections.every((id) => allowed.includes(id)) ||
      !Array.isArray(categories) || categories.length > 100 || categories.some((id) => typeof id !== "string" || id.length > 100) || new Set(categories).size !== categories.length) {
    return { ok: false, message: "Ordre ou sélection invalide." };
  }
  const found = await db.category.count({ where: { id: { in: categories } } });
  if (found !== categories.length) return { ok: false, message: "Une catégorie n'existe plus. Rechargez la page." };
  await db.$transaction([
    db.setting.upsert({ where: { key: "home.section_order" }, create: { key: "home.section_order", value: JSON.stringify(sections), group: "home", label: "Ordre des sections" }, update: { value: JSON.stringify(sections) } }),
    db.setting.upsert({ where: { key: "home.featured_categories" }, create: { key: "home.featured_categories", value: JSON.stringify(categories), group: "home", label: "Catégories mises en avant" }, update: { value: JSON.stringify(categories) } }),
  ]);
  await writeAudit({ userId: actor.id, actorEmail: actor.email, action: "home.layout.update", entityType: "Setting", metadata: { sections, categories } });
  revalidatePath("/");
  revalidatePath("/admin/apparence");
  return { ok: true, message: "Accueil publié. Les changements sont visibles sur la boutique." };
}
