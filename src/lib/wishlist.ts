import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/auth/password";

export const WISHLIST_COOKIE = "agharas_wishlist";

export async function readWishlistToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(WISHLIST_COOKIE)?.value ?? null;
}

export async function getOrCreateWishlistToken(): Promise<string> {
  const store = await cookies();
  const existing = store.get(WISHLIST_COOKIE)?.value;
  if (existing) return existing;
  const token = generateToken(20);
  store.set(WISHLIST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 365 * 24 * 60 * 60,
  });
  return token;
}

export async function getWishlistProductIds(): Promise<Set<string>> {
  const token = await readWishlistToken();
  if (!token) return new Set();
  const rows = await db.wishlistItem.findMany({
    where: { token, product: { isActive: true, category: { isActive: true }, brand: { isActive: true } } },
    select: { productId: true },
  });
  return new Set(rows.map((row) => row.productId));
}

export const getWishlistProducts = cache(async () => {
  const token = await readWishlistToken();
  if (!token) return [];
  return db.wishlistItem.findMany({
    where: { token, product: { isActive: true, category: { isActive: true }, brand: { isActive: true } } },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        include: {
          brand: true,
          category: true,
          images: { orderBy: { sortOrder: "asc" }, take: 2 },
          variants: {
            where: { isActive: true },
            include: { inventory: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
});
