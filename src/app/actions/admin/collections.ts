"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { collectionSchema } from "@/lib/validation";
import { prismaMessage, text, toFieldErrors, type AdminState } from "@/lib/admin";
import { deleteUnreferencedPublicImages, storePublicImage, validPublicImageUrl } from "@/lib/public-media";

export async function saveCollectionAction(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const actor = await assertPermission("products.update");
  const kind = text(formData, "kind");
  if (kind !== "category" && kind !== "brand") return { ok: false, message: "Type invalide." };
  const id = text(formData, "id");
  const parsed = collectionSchema.safeParse({
    name: formData.get("name"), slug: formData.get("slug"),
    description: formData.get("description") ?? "", tagline: formData.get("tagline") ?? "",
    imageUrl: formData.get("imageUrl") ?? "", sortOrder: formData.get("sortOrder") ?? "0",
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Données invalides.", fieldErrors: toFieldErrors(parsed.error) };
  const data = parsed.data;
  if (data.imageUrl && !validPublicImageUrl(data.imageUrl)) return { ok: false, message: "Image invalide." };
  let imageUrl = data.imageUrl;
  const image = formData.get("image");
  if (image instanceof File && image.size) {
    try { imageUrl = await storePublicImage(image); }
    catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Image invalide." }; }
  }
  const base = {
    name: data.name, slug: data.slug, description: data.description || null,
    imageUrl: imageUrl || null, sortOrder: data.sortOrder,
    isActive: formData.get("isActive") === "on",
  };
  let previousSlug: string | undefined;
  let previousImageUrl: string | null = null;
  try {
    if (kind === "category") {
      if (id) {
        const previous = await db.category.findUnique({ where: { id }, select: { slug: true, imageUrl: true } });
        previousSlug = previous?.slug;
        previousImageUrl = previous?.imageUrl ?? null;
      }
      if (id) await db.category.update({ where: { id }, data: { ...base, tagline: data.tagline || null } });
      else await db.category.create({ data: { ...base, tagline: data.tagline || null } });
    } else {
      if (id) {
        const previous = await db.brand.findUnique({ where: { id }, select: { slug: true, imageUrl: true } });
        previousSlug = previous?.slug;
        previousImageUrl = previous?.imageUrl ?? null;
      }
      if (id) await db.brand.update({ where: { id }, data: base });
      else await db.brand.create({ data: base });
    }
  } catch (error) {
    if (imageUrl && imageUrl !== data.imageUrl) await deleteUnreferencedPublicImages([imageUrl]).catch(() => undefined);
    return { ok: false, message: prismaMessage(error, "Enregistrement impossible.") };
  }
  if (previousImageUrl && previousImageUrl !== imageUrl) {
    await deleteUnreferencedPublicImages([previousImageUrl]).catch(() => undefined);
  }
  await writeAudit({ userId: actor.id, actorEmail: actor.email, action: `${kind}.${id ? "update" : "create"}`, entityType: kind === "category" ? "Category" : "Brand", entityId: id || data.slug });
  revalidatePath("/");
  revalidatePath("/catalogue");
  revalidatePath("/sitemap.xml");
  revalidatePath(`/admin/${kind === "category" ? "categories" : "marques"}`);
  if (kind === "category") {
    revalidatePath(`/catalogue/${data.slug}`);
    if (previousSlug) revalidatePath(`/catalogue/${previousSlug}`);
  }
  return { ok: true, message: `${kind === "category" ? "Catégorie" : "Marque"} enregistrée.` };
}
