"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getOrCreateWishlistToken } from "@/lib/wishlist";
import { cache } from "react";

export async function toggleWishlistAction(
  productId: string,
): Promise<{ ok: boolean; saved?: boolean; message?: string }> {
  if (typeof productId !== "string" || productId.length < 5) {
    return { ok: false, message: "Produit invalide." };
  }

  const token = await getOrCreateWishlistToken();

  const existing = await db.wishlistItem.findFirst({
    where: { token, productId },
  });

  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    revalidatePath("/favoris");
    return { ok: true, saved: false };
  }

  const product = await db.product.findFirst({
    where: { id: productId, isActive: true, category: { isActive: true }, brand: { isActive: true } },
    select: { id: true },
  });
  if (!product) return { ok: false, message: "Produit indisponible." };

  await db.wishlistItem.create({
    data: { token, productId },
  });
  revalidatePath("/favoris");
  return { ok: true, saved: true };
}

export const getWishlistCount = cache(async (): Promise<number> => {
  const token = await getOrCreateWishlistToken();
  return db.wishlistItem.count({
    where: { token },
  });
});
