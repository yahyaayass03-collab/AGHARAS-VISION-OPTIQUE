"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { prismaMessage, text, toFieldErrors, type AdminState } from "@/lib/admin";

const storeSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(250),
  phone: z.string().trim().min(6).max(30),
  whatsapp: z.string().trim().max(30),
  email: z.union([z.literal(""), z.string().email()]),
  hours: z.string().trim().min(2).max(200),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export async function saveStoreAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const actor = await assertPermission("settings.manage");
  const id = text(formData, "id");
  const parsed = storeSchema.safeParse({
    slug: formData.get("slug"), name: formData.get("name"), city: formData.get("city"),
    address: formData.get("address"), phone: formData.get("phone"),
    whatsapp: formData.get("whatsapp") ?? "", email: formData.get("email") ?? "",
    hours: formData.get("hours"), sortOrder: formData.get("sortOrder") ?? "0",
  });
  if (!parsed.success) return { ok: false, message: "Vérifiez les informations du salon.", fieldErrors: toFieldErrors(parsed.error) };
  const data = parsed.data;
  try {
    const payload = {
      slug: data.slug, name: data.name, city: data.city, address: data.address, phone: data.phone,
      whatsapp: data.whatsapp || null, email: data.email || null, hours: data.hours,
      sortOrder: data.sortOrder, isActive: formData.get("isActive") === "on",
    };
    await db.$transaction(async (tx) => {
      if (id) await tx.store.update({ where: { id }, data: payload });
      else await tx.store.create({ data: { ...payload, services: [] } });

      const primaryStore = await tx.store.findFirst({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
      });
      if (primaryStore) {
        for (const [key, value, label] of [
          ["store.address", primaryStore.address, "Adresse du magasin"],
          ["store.city", primaryStore.city, "Ville"],
        ] as const) {
          await tx.setting.upsert({
            where: { key },
            create: { key, value, group: "contact", label },
            update: { value },
          });
        }
      }
    });
  } catch (error) { return { ok: false, message: prismaMessage(error, "Impossible d'enregistrer le salon.") }; }
  await writeAudit({ userId: actor.id, actorEmail: actor.email, action: `store.${id ? "update" : "create"}`, entityType: "Store", entityId: id || data.slug });
  revalidatePath("/admin/salons");
  revalidatePath("/boutiques");
  revalidatePath("/contact");
  return { ok: true, message: "Salon enregistré." };
}
