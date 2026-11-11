"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { parseDHToCents } from "@/lib/money";
import { productSchema, stockAdjustSchema, variantSchema } from "@/lib/validation";
import { deleteUnreferencedPublicImages, storePublicImage, validPublicImageUrl } from "@/lib/public-media";
import {
  checked,
  prismaMessage,
  text,
  toFieldErrors,
  type AdminState,
} from "@/lib/admin";

const PRODUCT_PATH = "/admin/produits";

function revalidateProduct(slug?: string) {
  revalidatePath(PRODUCT_PATH);
  revalidatePath("/catalogue");
  revalidatePath("/sitemap.xml");
  revalidatePath("/");
  if (slug) {
    revalidatePath(`/produit/${slug}`);
    revalidatePath(`/configurateur/${slug}`);
  }
}

function imageUrlsFrom(formData: FormData): string[] {
  return text(formData, "imageUrls")
    .split(/\r?\n/)
    .map((url) => url.trim())
    .filter(Boolean)
}

async function productImagesFrom(formData: FormData): Promise<string[]> {
  const existing = imageUrlsFrom(formData);
  if (existing.some((url) => !validPublicImageUrl(url))) {
    throw new Error("Les images doivent être des fichiers de la boutique ou des visuels validés.");
  }
  const uploads = formData.getAll("images").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (existing.length + uploads.length > 8) throw new Error("Huit visuels maximum par produit.");
  // Validate all uploads before writing anything to disk.
  if (uploads.some((file) => file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
    throw new Error("Image invalide : JPEG, PNG ou WebP de 5 Mo maximum.");
  }
  const uploaded: string[] = [];
  try {
  for (const file of uploads) uploaded.push(await storePublicImage(file));
  const urls = [...existing, ...uploaded];
  const orderRaw = text(formData, "imageOrder");
  if (!orderRaw) return urls;
  let order: unknown;
  try { order = JSON.parse(orderRaw); } catch { throw new Error("Ordre des images invalide."); }
  if (!Array.isArray(order) || order.length !== urls.length ||
      order.some((value) => !Number.isInteger(value) || value < 0 || value >= urls.length) ||
      new Set(order).size !== urls.length) {
    throw new Error("Ordre des images invalide.");
  }
  return order.map((index: number) => urls[index]!);
  } catch (error) {
    await deleteUnreferencedPublicImages(uploaded).catch(() => undefined);
    throw error;
  }
}

export async function saveProductAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const id = text(formData, "id");
  const actor = await assertPermission(id ? "products.update" : "products.create");

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    subtitle: formData.get("subtitle") ?? "",
    description: formData.get("description"),
    story: formData.get("story") ?? "",
    brandId: formData.get("brandId"),
    categoryId: formData.get("categoryId"),
    type: formData.get("type"),
    gender: formData.get("gender"),
    material: formData.get("material") ?? "",
    shape: formData.get("shape"),
    sku: formData.get("sku"),
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") ?? "",
    badge: formData.get("badge") ?? "",
    weightGrams: formData.get("weightGrams") ?? "",
    lensWidthMm: formData.get("lensWidthMm") ?? "",
    bridgeMm: formData.get("bridgeMm") ?? "",
    templeLengthMm: formData.get("templeLengthMm") ?? "",
    lensCompatible: formData.get("lensCompatible") ?? undefined,
    isActive: formData.get("isActive") ?? undefined,
    isFeatured: formData.get("isFeatured") ?? undefined,
    isNew: formData.get("isNew") ?? undefined,
    isBestseller: formData.get("isBestseller") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Produit invalide.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const priceCents = parseDHToCents(data.price);
  if (priceCents === null || priceCents <= 0) {
    return {
      ok: false,
      message: "Prix invalide.",
      fieldErrors: { price: "Indiquez un prix en dirhams (ex. 1 850,00)." },
    };
  }

  let compareAtCents: number | null = null;
  if (data.compareAtPrice) {
    compareAtCents = parseDHToCents(data.compareAtPrice);
    if (compareAtCents === null || compareAtCents <= priceCents) {
      return {
        ok: false,
        message: "Prix barré invalide.",
        fieldErrors: {
          compareAtPrice: "Le prix barré doit être supérieur au prix de vente.",
        },
      };
    }
  }

  const requestedPublish = checked(formData, "isActive");
  const related = await Promise.all([
    db.brand.findUnique({ where: { id: data.brandId } }),
    db.category.findUnique({ where: { id: data.categoryId } }),
    id ? db.product.findUnique({ where: { id }, include: { variants: { include: { inventory: true } }, images: true } }) : Promise.resolve(null),
  ]);
  const [brand, category, original] = related;
  if (!brand || !category) return { ok: false, message: "Catégorie ou marque introuvable." };
  if (id && !original) return { ok: false, message: "Produit introuvable." };
  if (requestedPublish && original?.archivedAt) {
    return { ok: false, message: "Ce produit est archivé : restaurez-le avant de le publier." };
  }
  if (requestedPublish && (!brand.isActive || !category.isActive)) {
    return { ok: false, message: "Activez la marque et la catégorie avant de publier." };
  }
  if (requestedPublish && !original?.variants.some((variant) => variant.isActive && (variant.inventory?.quantity ?? 0) > 0)) {
    return { ok: false, message: "Ajoutez au moins un coloris avec du stock avant de publier le produit." };
  }
  let imageUrls: string[];
  try { imageUrls = await productImagesFrom(formData); }
  catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Image invalide." }; }
  if (requestedPublish && imageUrls.length === 0) {
    return { ok: false, message: "Ajoutez une photo avant de publier le produit." };
  }
  const base = {
    slug: data.slug,
    name: data.name,
    subtitle: data.subtitle || null,
    description: data.description,
    story: data.story || null,
    brandId: data.brandId,
    categoryId: data.categoryId,
    type: data.type,
    gender: data.gender,
    material: data.material || null,
    shape: data.shape,
    sku: data.sku,
    priceCents,
    compareAtCents,
    badge: data.badge || null,
    isActive: requestedPublish,
    isFeatured: checked(formData, "isFeatured"),
    isNew: checked(formData, "isNew"),
    isBestseller: checked(formData, "isBestseller"),
    lensCompatible: checked(formData, "lensCompatible"),
    weightGrams: typeof data.weightGrams === "number" ? data.weightGrams : null,
    lensWidthMm: typeof data.lensWidthMm === "number" ? data.lensWidthMm : null,
    bridgeMm: typeof data.bridgeMm === "number" ? data.bridgeMm : null,
    templeLengthMm:
      typeof data.templeLengthMm === "number" ? data.templeLengthMm : null,
  };

  try {
    if (id) {
      await db.$transaction([
        db.product.update({ where: { id }, data: base }),
        db.productImage.deleteMany({ where: { productId: id } }),
        db.productImage.createMany({
          data: imageUrls.map((url, index) => ({
            productId: id,
            url,
            alt: `${data.name}${imageUrls.length > 1 ? ` — visuel ${index + 1}` : ""}`,
            sortOrder: index,
          })),
        }),
      ]);
      const retained = new Set(imageUrls);
      await deleteUnreferencedPublicImages(original!.images.map((image) => image.url).filter((url) => !retained.has(url))).catch(() => undefined);
      await writeAudit({
        userId: actor.id,
        actorEmail: actor.email,
        action: "product.update",
        entityType: "Product",
        entityId: id,
        metadata: { slug: data.slug, priceCents },
      });
      revalidateProduct(original?.slug);
      revalidateProduct(data.slug);
      return { ok: true, message: "Produit enregistré." };
    }

    const created = await db.product.create({
      data: {
        ...base,
        images: {
          create: imageUrls.map((url, index) => ({
            url,
            alt: `${data.name}${imageUrls.length > 1 ? ` — visuel ${index + 1}` : ""}`,
            sortOrder: index,
          })),
        },
      },
    });
    await writeAudit({
      userId: actor.id,
      actorEmail: actor.email,
      action: "product.create",
      entityType: "Product",
      entityId: created.id,
      metadata: { slug: data.slug, priceCents },
    });
    revalidateProduct(data.slug);
  } catch (error) {
    await deleteUnreferencedPublicImages(imageUrls).catch(() => undefined);
    return {
      ok: false,
      message: prismaMessage(error, "Le produit n'a pas pu être enregistré."),
    };
  }

  redirect(`${PRODUCT_PATH}/${data.slug}`);
}

export async function saveVariantAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await assertPermission("products.update");
  const productId = text(formData, "productId");

  const parsed = variantSchema.safeParse({
    productId,
    colorName: formData.get("colorName"),
    colorHex: formData.get("colorHex"),
    sku: formData.get("sku"),
    price: formData.get("price") ?? "",
    stock: formData.get("stock") ?? 0,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Variante invalide.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  let priceCents: number | null = null;
  if (data.price) {
    priceCents = parseDHToCents(data.price);
    if (priceCents === null || priceCents <= 0) {
      return {
        ok: false,
        message: "Prix de variante invalide.",
        fieldErrors: { price: "Indiquez un prix valide ou laissez vide." },
      };
    }
  }

  try {
    const count = await db.productVariant.count({ where: { productId } });
    const variant = await db.productVariant.create({
      data: {
        productId,
        colorName: data.colorName,
        colorHex: data.colorHex,
        sku: data.sku,
        priceCents,
        sortOrder: count,
        inventory: { create: { quantity: data.stock } },
      },
    });
    if (data.stock > 0) {
      await db.inventoryMovement.create({
        data: {
          variantId: variant.id,
          delta: data.stock,
          reason: "INITIAL",
          note: "Stock initial (création de variante)",
          userId: actor.id,
        },
      });
    }
    await writeAudit({
      userId: actor.id,
      actorEmail: actor.email,
      action: "variant.create",
      entityType: "ProductVariant",
      entityId: variant.id,
      metadata: { sku: data.sku, stock: data.stock },
    });
  } catch (error) {
    return {
      ok: false,
      message: prismaMessage(error, "La variante n'a pas pu être créée."),
    };
  }

  revalidatePath(`${PRODUCT_PATH}/${text(formData, "slug") || productId}`);
  revalidatePath("/admin/stock");
  revalidatePath("/catalogue");
  return { ok: true, message: "Coloris ajouté." };
}

export async function toggleVariantAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("products.update");
  const id = text(formData, "id");
  const variant = await db.productVariant.findUnique({ where: { id } });
  if (!variant) return;

  await db.productVariant.update({
    where: { id },
    data: { isActive: !variant.isActive },
  });
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "variant.toggle",
    entityType: "ProductVariant",
    entityId: id,
    metadata: { isActive: !variant.isActive },
  });
  revalidatePath(`${PRODUCT_PATH}/${text(formData, "slug") || variant.productId}`);
  revalidatePath("/admin/stock");
}

export async function toggleProductActiveAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("products.update");
  const id = text(formData, "id");
  const product = await db.product.findUnique({
    where: { id },
    include: { brand: true, category: true, images: true, variants: { where: { isActive: true }, include: { inventory: true } } },
  });
  if (!product) return;
  if (product.archivedAt) return;

  if (
    !product.isActive &&
    (!product.brand.isActive ||
      !product.category.isActive ||
      !product.images.length ||
      !product.variants.some((variant) => (variant.inventory?.quantity ?? 0) > 0))
  )
    return;

  await db.product.update({
    where: { id },
    data: { isActive: !product.isActive },
  });
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "product.toggle",
    entityType: "Product",
    entityId: id,
    metadata: { isActive: !product.isActive },
  });
  revalidateProduct(product.slug);
  revalidatePath(`${PRODUCT_PATH}/${product.slug}`);
}

export async function archiveProductAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("products.update");
  const id = text(formData, "id");
  const restore = text(formData, "restore") === "1";
  const product = await db.product.findUnique({ where: { id } });
  if (!product) return;

  await db.product.update({
    where: { id },
    // L'archivage ne supprime rien : commandes, mouvements de stock et visuels
    // restent intacts pour l'historique comptable.
    data: restore
      ? { archivedAt: null, isActive: false }
      : { archivedAt: new Date(), isActive: false },
  });
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: restore ? "product.restore" : "product.archive",
    entityType: "Product",
    entityId: id,
    metadata: { slug: product.slug },
  });
  revalidateProduct(product.slug);
  revalidatePath("/admin/produits");
}

export async function adjustStockAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await assertPermission("inventory.adjust");

  const parsed = stockAdjustSchema.safeParse({
    variantId: formData.get("variantId"),
    delta: formData.get("delta"),
    note: formData.get("note") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Ajustement invalide.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { variantId, delta, note } = parsed.data;

  try {
    await db.$transaction(async (tx) => {
      const inventory = await tx.inventoryItem.findUnique({ where: { variantId } });
      if (!inventory) {
        if (delta < 0) throw new Error("Stock inexistant : ajustement négatif impossible.");
        await tx.inventoryItem.create({ data: { variantId, quantity: delta } });
      } else {
        const next = inventory.quantity + delta;
        if (next < 0) throw new Error("Le stock ne peut pas devenir négatif.");
        await tx.inventoryItem.update({
          where: { variantId },
          data: { quantity: next },
        });
      }
      await tx.inventoryMovement.create({
        data: {
          variantId,
          delta,
          reason: "ADJUSTMENT",
          note: note || "Ajustement manuel",
          userId: actor.id,
        },
      });
    });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "L'ajustement n'a pas pu être enregistré.",
    };
  }

  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "inventory.adjust",
    entityType: "ProductVariant",
    entityId: variantId,
    metadata: { delta, note },
  });

  revalidatePath("/admin/stock");
  revalidatePath("/admin/produits");
  revalidatePath("/catalogue");
  return { ok: true, message: `Stock ajusté (${delta > 0 ? "+" : ""}${delta}).` };
}
