import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/auth/password";
import { getSessionUser } from "@/lib/auth/session";
import { computeDiscountCents, computeShippingCents } from "@/lib/pricing";

export const CART_COOKIE = "agharas_cart";
const CART_MONTHS = 6;

export type LensSnapshot = {
  hasCorrection: boolean;
  lensTypeId?: string;
  lensTypeName?: string;
  lensTypePriceCents: number;
  lensIndexId?: string;
  lensIndexName?: string;
  lensIndexValue?: string;
  lensIndexPriceCents: number;
  treatments: Array<{ id: string; name: string; priceCents: number }>;
  lensPriceCents: number;
  summary: string;
  prescriptionMethod?: string;
  prescriptionId?: string;
};

export type CartLine = {
  id: string;
  quantity: number;
  productId: string;
  variantId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  colorName: string;
  colorHex: string;
  sku: string;
  unitPriceCents: number;
  lensPriceCents: number;
  lineTotalCents: number;
  stock: number;
  lens: LensSnapshot | null;
  prescriptionId: string | null;
};

export type CartView = {
  id: string | null;
  items: CartLine[];
  itemCount: number;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  couponCode: string | null;
  couponError: string | null;
  couponLabel: string | null;
  shippingName: string;
  freeShippingThresholdCents: number | null;
};

function parseLens(value: unknown): LensSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<LensSnapshot>;
  if (typeof candidate.lensPriceCents !== "number") return null;
  return {
    hasCorrection: Boolean(candidate.hasCorrection),
    lensTypeId: candidate.lensTypeId,
    lensTypeName: candidate.lensTypeName,
    lensTypePriceCents: candidate.lensTypePriceCents ?? 0,
    lensIndexId: candidate.lensIndexId,
    lensIndexName: candidate.lensIndexName,
    lensIndexValue: candidate.lensIndexValue,
    lensIndexPriceCents: candidate.lensIndexPriceCents ?? 0,
    treatments: Array.isArray(candidate.treatments) ? candidate.treatments : [],
    lensPriceCents: candidate.lensPriceCents,
    summary: candidate.summary ?? "Sans correction",
    prescriptionMethod: candidate.prescriptionMethod,
    prescriptionId: candidate.prescriptionId,
  };
}

export async function readCartToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(CART_COOKIE)?.value ?? null;
}

/** À n'appeler que depuis une server action ou un route handler. */
export async function getOrCreateCart() {
  const user = await getSessionUser();
  const token = await readCartToken();

  if (token) {
    const existing = await db.cart.findUnique({ where: { token } });
    if (existing) {
      if (user && existing.userId !== user.id) {
        return db.cart.update({
          where: { id: existing.id },
          data: { userId: user.id },
        });
      }
      return existing;
    }
  }

  if (user) {
    const userCart = await db.cart.findFirst({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });
    if (userCart) return userCart;
  }

  const newToken = generateToken(24);
  const cart = await db.cart.create({
    data: { token: newToken, userId: user?.id ?? null },
  });

  const store = await cookies();
  store.set(CART_COOKIE, newToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_MONTHS * 30 * 24 * 60 * 60,
  });

  return cart;
}

/**
 * Fusionne le panier invité dans le panier du compte à la connexion.
 * À n'appeler que depuis une server action (écriture de cookie autorisée).
 */
export async function mergeGuestCartOnLogin(userId: string): Promise<void> {
  const token = await readCartToken();
  if (!token) return;

  const guest = await db.cart.findUnique({
    where: { token },
    include: { items: true },
  });
  if (!guest) return;

  const userCart = await db.cart.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  if (!userCart) {
    await db.cart.update({
      where: { id: guest.id },
      data: { userId },
    });
    return;
  }

  if (userCart.id === guest.id) return;

  for (const item of guest.items) {
    const existing = await db.cartItem.findUnique({
      where: {
        cartId_variantId_configKey: {
          cartId: userCart.id,
          variantId: item.variantId,
          configKey: item.configKey,
        },
      },
    });
    if (existing) {
      await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(5, existing.quantity + item.quantity) },
      });
    } else {
      await db.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          configKey: item.configKey,
          lensSnapshot: item.lensSnapshot ?? undefined,
          prescriptionId: item.prescriptionId,
        },
      });
    }
  }

  await db.cart.delete({ where: { id: guest.id } });

  const store = await cookies();
  store.set(CART_COOKIE, userCart.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_MONTHS * 30 * 24 * 60 * 60,
  });
}

export async function findCartWithItems() {
  const user = await getSessionUser();
  const token = await readCartToken();
  const cart = token
    ? await db.cart.findUnique({ where: { token } })
    : user
      ? await db.cart.findFirst({
          where: { userId: user.id },
          orderBy: { updatedAt: "desc" },
        })
      : null;

  if (!cart) return null;

  return db.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: { include: { category: true, brand: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } },
          variant: { include: { inventory: true } },
        },
      },
    },
  });
}

export const getCartView = cache(async (): Promise<CartView> => {
  const cart = await findCartWithItems();
  const methods = await db.shippingMethod.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  const defaultMethod = methods[0] ?? null;

  if (!cart) {
    return {
      id: null,
      items: [],
      itemCount: 0,
      subtotalCents: 0,
      discountCents: 0,
      shippingCents: 0,
      totalCents: 0,
      couponCode: null,
      couponError: null,
      couponLabel: null,
      shippingName: defaultMethod?.name ?? "Livraison",
      freeShippingThresholdCents: defaultMethod?.freeFromCents ?? null,
    };
  }

  const items: CartLine[] = cart.items.map((item) => {
    const unitPriceCents =
      item.variant.priceCents ?? item.product.priceCents;
    const lens = parseLens(item.lensSnapshot);
    const lensPriceCents = lens?.lensPriceCents ?? 0;
    const lineTotalCents = (unitPriceCents + lensPriceCents) * item.quantity;
    return {
      id: item.id,
      quantity: item.quantity,
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      slug: item.product.slug,
      imageUrl: item.product.images[0]?.url ?? null,
      colorName: item.variant.colorName,
      colorHex: item.variant.colorHex,
      sku: item.variant.sku,
      unitPriceCents,
      lensPriceCents,
      lineTotalCents,
      stock: item.variant.inventory?.quantity ?? 0,
      lens,
      prescriptionId: item.prescriptionId,
    };
  });

  const subtotalCents = items.reduce((sum, item) => sum + item.lineTotalCents, 0);

  let discountCents = 0;
  let couponError: string | null = null;
  let couponLabel: string | null = null;

  if (cart.couponCode) {
    const coupon = await db.coupon.findUnique({
      where: { code: cart.couponCode },
    });
    const result = computeDiscountCents(coupon, subtotalCents);
    if (result.ok) {
      discountCents = result.discountCents;
      couponLabel = coupon?.description ?? coupon?.code ?? null;
    } else {
      couponError = result.error ?? "Code promo invalide.";
    }
  }

  const afterDiscount = Math.max(0, subtotalCents - discountCents);
  const freeThreshold = defaultMethod?.freeFromCents ?? null;
  const shippingCents = computeShippingCents(defaultMethod, afterDiscount);

  return {
    id: cart.id,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotalCents,
    discountCents,
    shippingCents,
    totalCents: afterDiscount + shippingCents,
    couponCode: cart.couponCode,
    couponError,
    couponLabel,
    shippingName: defaultMethod?.name ?? "Livraison",
    freeShippingThresholdCents: freeThreshold,
  };
});
