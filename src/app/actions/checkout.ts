"use server";

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { jsonStringList } from "@/lib/json-string-list";
import { lockOpticalReviewCheckout } from "@/lib/optical-review-lock";
import { reachMariaDbCheckoutTestBarrier } from "@/lib/mariadb-checkout-test-barrier";
import { evaluateOpticalCompatibility, opticalCombinationFromSnapshot } from "@/lib/optical-compatibility-db";
import { OPTICAL_REVIEW_MESSAGE } from "@/lib/optical-compatibility";
import { CART_COOKIE, findCartWithItems } from "@/lib/cart";
import { generateToken } from "@/lib/auth/password";
import { rateLimit } from "@/lib/rate-limit";
import {
  computeDiscountCents,
  computeShippingCents,
} from "@/lib/pricing";
import { checkoutSchema } from "@/lib/validation";
import { logOperationalFailure } from "@/lib/operational-log";
import { currentOrderEmailSettings, dispatchPendingOrderEmails, enqueueOrderEmailNotifications } from "@/lib/order-email-notifications";

export type CheckoutState = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string>;
} | null;

class StockError extends Error {}

function orderReference(): string {
  const year = new Date().getFullYear();
  return `AVO-${year}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function placeOrderAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const raw = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    addressLine1: formData.get("addressLine1"),
    addressLine2: formData.get("addressLine2") ?? "",
    city: formData.get("city"),
    postalCode: formData.get("postalCode") ?? "",
    deliveryNotes: formData.get("deliveryNotes") ?? "",
    shippingCode: formData.get("shippingCode"),
    paymentMethod: formData.get("paymentMethod"),
    couponCode: formData.get("couponCode") ?? "",
    acceptTerms: formData.get("acceptTerms"),
    idempotencyKey: formData.get("idempotencyKey"),
  };

  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Vérifiez vos informations.",
      fieldErrors,
    };
  }

  const data = parsed.data;

  const limit = rateLimit(`checkout:${data.email}`, 4, 10 * 60_000);
  if (!limit.ok) {
    return {
      ok: false,
      message: `Trop de tentatives. Réessayez dans ${limit.retryAfterSeconds} secondes.`,
    };
  }

  const existingOrder = await db.order.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
  });
  if (existingOrder) {
    await dispatchPendingOrderEmails(existingOrder.id, true);
    redirect(
      `/commande/confirmation/${existingOrder.reference}?token=${existingOrder.accessToken}`,
    );
  }

  const cart = await findCartWithItems();
  if (!cart || cart.items.length === 0) {
    return {
      ok: false,
      message:
        "Votre panier est vide. Ajoutez une monture avant de passer commande.",
    };
  }

  if (data.paymentMethod !== "CASH_ON_DELIVERY") {
    return {
      ok: false,
      message:
        "Le paiement en ligne est indisponible. Choisissez le paiement à la livraison.",
    };
  }

  const shipping = await db.shippingMethod.findFirst({
    where: { code: data.shippingCode, isActive: true },
  });
  if (!shipping) {
    return { ok: false, message: "Ce mode de livraison n'est plus disponible." };
  }

  const items = cart.items.map((item) => {
    const unitPriceCents = item.variant.priceCents ?? item.product.priceCents;
    const lens = item.lensSnapshot as { lensPriceCents?: number } | null;
    const lensPriceCents =
      lens && typeof lens.lensPriceCents === "number" ? lens.lensPriceCents : 0;
    return {
      item,
      unitPriceCents,
      lensPriceCents,
      lineTotalCents: (unitPriceCents + lensPriceCents) * item.quantity,
      stock: item.variant.inventory?.quantity ?? 0,
    };
  });

  if (items[0]) await reachMariaDbCheckoutTestBarrier("quoted", items[0].item.productId);

  for (const line of items) {
    const combination = opticalCombinationFromSnapshot(line.item.productId, line.item.variantId, line.item.lensSnapshot);
    if (combination && !(await evaluateOpticalCompatibility(db, combination)).allowed) {
      return { ok: false, message: OPTICAL_REVIEW_MESSAGE };
    }
    if (!line.item.product.isActive || !line.item.variant.isActive || !line.item.product.category.isActive || !line.item.product.brand.isActive) {
      return {
        ok: false,
        message: `${line.item.product.name} n'est plus disponible. Retirez-le du panier pour continuer.`,
      };
    }
    if (line.stock < line.item.quantity) {
      return {
        ok: false,
        message: `Stock insuffisant pour ${line.item.product.name} (${line.item.variant.colorName}). Il reste ${line.stock} exemplaire(s).`,
      };
    }
    // A lens option edited by the owner must never be purchased at a stale
    // cart snapshot price. The visitor can refresh the lens configuration.
    const snapshot = line.item.lensSnapshot as {
      lensTypeId?: string; lensTypePriceCents?: number;
      lensIndexId?: string; lensIndexPriceCents?: number;
      treatments?: Array<{ id: string; priceCents: number }>;
    } | null;
    if (snapshot?.lensTypeId && !line.item.product.lensCompatible) {
      return { ok: false, message: "La compatibilité de cette monture a changé. Veuillez reconfigurer votre panier." };
    }
    if (snapshot?.lensTypeId || snapshot?.lensIndexId || snapshot?.treatments?.length) {
      const [type, index, treatments] = await Promise.all([
        snapshot.lensTypeId ? db.lensType.findUnique({ where: { id: snapshot.lensTypeId } }) : null,
        snapshot.lensIndexId ? db.lensIndex.findUnique({ where: { id: snapshot.lensIndexId } }) : null,
        db.lensTreatment.findMany({ where: { id: { in: snapshot.treatments?.map((item) => item.id) ?? [] } } }),
      ]);
      if ((snapshot.lensTypeId && (!type?.isActive || type.kind === "PROGRESSIVE" || !jsonStringList(type.productTypes).includes(line.item.product.type) || type.priceCents !== snapshot.lensTypePriceCents)) ||
          (snapshot.lensIndexId && (!index?.isActive || index.priceCents !== snapshot.lensIndexPriceCents)) ||
          snapshot.treatments?.some((item) => !treatments.some((entry) => entry.id === item.id && entry.isActive && entry.priceCents === item.priceCents))) {
        return { ok: false, message: "Les options de verres ont changé. Reconfigurez vos verres pour confirmer le prix actuel." };
      }
    }
  }

  const subtotalCents = items.reduce((sum, line) => sum + line.lineTotalCents, 0);

  const couponCode = (data.couponCode || cart.couponCode || "").toUpperCase();
  let coupon = null;
  let discountCents = 0;
  if (couponCode) {
    coupon = await db.coupon.findUnique({ where: { code: couponCode } });
    const result = computeDiscountCents(coupon, subtotalCents);
    if (result.ok) discountCents = result.discountCents;
  }

  const afterDiscount = Math.max(0, subtotalCents - discountCents);
  const shippingCents = computeShippingCents(shipping, afterDiscount);
  const totalCents = afterDiscount + shippingCents;

  const reference = orderReference();
  const accessToken = generateToken(24);
  const emailSettings = await currentOrderEmailSettings();
  let committedOrderId: string | null = null;

  try {
    await db.$transaction(async (tx) => {
      // Serialize decisions against owner reviews, then recheck inside the order transaction.
      await lockOpticalReviewCheckout(tx);
      for (const line of items) {
        const combination = opticalCombinationFromSnapshot(line.item.productId, line.item.variantId, line.item.lensSnapshot);
        if (combination && !(await evaluateOpticalCompatibility(tx, combination)).allowed) throw new StockError(OPTICAL_REVIEW_MESSAGE);
      }
      for (const line of items) {
        // Lock current catalog price rows until commit. An owner price update
        // that wins this row-lock race is observed and rejects the stale cart;
        // if checkout wins, the order commits at the price it locked first.
        const products = await tx.$queryRaw<Array<{ priceCents: number }>>`
          SELECT priceCents FROM Product WHERE id = ${line.item.productId} FOR UPDATE
        `;
        const variants = await tx.$queryRaw<Array<{ priceCents: number | null }>>`
          SELECT priceCents FROM ProductVariant WHERE id = ${line.item.variantId} FOR UPDATE
        `;
        const currentProductPrice = products[0]?.priceCents;
        const currentVariantPrice = variants[0]?.priceCents ?? null;
        if (currentProductPrice === undefined || variants.length !== 1 ||
            (currentVariantPrice ?? currentProductPrice) !== line.unitPriceCents) {
          throw new StockError(`Le prix de ${line.item.product.name} a changé. Vérifiez le nouveau tarif avant de confirmer votre commande.`);
        }
        await reachMariaDbCheckoutTestBarrier("catalog-locked", line.item.productId);

        const updated = await tx.inventoryItem.updateMany({
          where: {
            variantId: line.item.variantId,
            quantity: { gte: line.item.quantity },
          },
          data: { quantity: { decrement: line.item.quantity } },
        });
        if (updated.count !== 1) {
          throw new StockError(
            `Stock insuffisant pour ${line.item.product.name}.`,
          );
        }
        await tx.inventoryMovement.create({
          data: {
            variantId: line.item.variantId,
            delta: -line.item.quantity,
            reason: "SALE",
            note: `Commande ${reference}`,
            userId: null,
          },
        });
      }

      const order = await tx.order.create({
        data: {
          reference,
          accessToken,
          idempotencyKey: data.idempotencyKey,
          userId: null,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || null,
          city: data.city,
          postalCode: data.postalCode || null,
          deliveryNotes: data.deliveryNotes || null,
          shippingMethodName: shipping.name,
          shippingCents,
          subtotalCents,
          discountCents,
          totalCents,
          couponCode: coupon && discountCents > 0 ? coupon.code : null,
          status: "PENDING",
          paymentMethod: "CASH_ON_DELIVERY",
          paymentStatus: "PENDING",
          selectedShippingCode: shipping.code,
          items: {
            create: items.map((line) => ({
              productId: line.item.productId,
              variantId: line.item.variantId,
              productName: line.item.product.name,
              productSlug: line.item.product.slug,
              variantName: line.item.variant.colorName,
              sku: line.item.variant.sku,
              imageUrl: line.item.product.images[0]?.url ?? null,
              unitPriceCents: line.unitPriceCents,
              lensPriceCents: line.lensPriceCents,
              quantity: line.item.quantity,
              lineTotalCents: line.lineTotalCents,
              configuration:
                line.item.lensSnapshot === null
                  ? undefined
                  : line.item.lensSnapshot,
              prescriptionId: line.item.prescriptionId,
            })),
          },
          history: {
            create: {
              toStatus: "PENDING",
              note: "Commande créée en ligne",
              userId: null,
            },
          },
          payments: {
            create: {
              method: "CASH_ON_DELIVERY",
              status: "PENDING",
              amountCents: totalCents,
            },
          },
          shipments: {
            create: {
              method: shipping.code,
              status: "PREPARING",
            },
          },
        },
      });
      await enqueueOrderEmailNotifications(tx, order, emailSettings);
      committedOrderId = order.id;

      if (coupon && discountCents > 0) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            orderId: order.id,
            email: data.email,
          },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });
    });
  } catch (error) {
    if (error instanceof StockError) {
      return { ok: false, message: error.message };
    }
    logOperationalFailure("checkout.transaction_failed", error);
    return {
      ok: false,
      message:
        "La commande n'a pas pu être enregistrée. Aucun montant n'a été débité. Réessayez ou contactez-nous.",
    };
  }

  if (committedOrderId) await dispatchPendingOrderEmails(committedOrderId);

  const store = await cookies();
  store.delete(CART_COOKIE);

  // Confirmation and the shared header are dynamically rendered from the
  // order/database and current cookies, so no route cache invalidation is needed.
  redirect(`/commande/confirmation/${reference}?token=${accessToken}`);
}
