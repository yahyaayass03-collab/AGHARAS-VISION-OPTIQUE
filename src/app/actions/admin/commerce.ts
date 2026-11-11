"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertPermission } from "@/lib/auth/guards";
import { writeAudit } from "@/lib/audit";
import { parseDHToCents } from "@/lib/money";
import {
  couponAdminSchema,
  orderStatusSchema,
} from "@/lib/validation";
import { ORDER_TRANSITIONS } from "@/lib/orders";
import { dispatchPendingOrderEmails } from "@/lib/order-email-notifications";
import {
  prismaMessage,
  text,
  toFieldErrors,
  type AdminState,
} from "@/lib/admin";

class TransitionError extends Error {}

export async function updateOrderStatusAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await assertPermission("orders.update");
  const parsed = orderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Statut invalide.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const { orderId, status, note } = parsed.data;
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return { ok: false, message: "Commande introuvable." };
  if (order.status === status) {
    return { ok: false, message: "Cette commande possède déjà ce statut." };
  }

  const allowed = ORDER_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(status)) {
    return {
      ok: false,
      message: "Cette transition de statut n'est pas autorisée.",
    };
  }

  if (status === "CANCELLED") {
    await assertPermission("orders.cancel");
  }

  try {
    await db.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: order.status },
        data: {
          status,
          ...(status === "DELIVERED" ? { paymentStatus: "PAID" } : {}),
        },
      });
      if (updated.count !== 1) {
        throw new TransitionError(
          "La commande a été modifiée entre-temps. Rechargez la page.",
        );
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          fromStatus: order.status,
          toStatus: status,
          note: note || null,
          userId: actor.id,
        },
      });

      if (status === "CANCELLED") {
        for (const item of order.items) {
          if (!item.variantId) continue;
          await tx.inventoryItem.upsert({
            where: { variantId: item.variantId },
            create: { variantId: item.variantId, quantity: item.quantity },
            update: { quantity: { increment: item.quantity } },
          });
          await tx.inventoryMovement.create({
            data: {
              variantId: item.variantId,
              delta: item.quantity,
              reason: "CANCELLATION",
              note: `Annulation ${order.reference}`,
              userId: actor.id,
            },
          });
        }
        await tx.shipment.updateMany({
          where: { orderId: order.id },
          data: { status: "RETURNED" },
        });
      }

      if (status === "SHIPPED") {
        const shipment = await tx.shipment.findFirst({
          where: { orderId: order.id },
        });
        if (shipment) {
          await tx.shipment.update({
            where: { id: shipment.id },
            data: { status: "SHIPPED", shippedAt: new Date() },
          });
        } else {
          await tx.shipment.create({
            data: {
              orderId: order.id,
              method: order.selectedShippingCode,
              status: "SHIPPED",
              shippedAt: new Date(),
            },
          });
        }
      }

      if (status === "DELIVERED") {
        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: { status: "PAID" },
        });
        await tx.shipment.updateMany({
          where: { orderId: order.id },
          data: { status: "DELIVERED", deliveredAt: new Date() },
        });
      }
    });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof TransitionError
          ? error.message
          : "La commande n'a pas pu être mise à jour.",
    };
  }

  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: status === "CANCELLED" ? "order.cancel" : "order.status",
    entityType: "Order",
    entityId: order.id,
    metadata: { from: order.status, to: status, note },
  });

  revalidatePath("/admin/commandes");
  revalidatePath(`/admin/commandes/${order.id}`);
  revalidatePath("/admin");
  revalidatePath("/compte/commandes");
  revalidatePath(`/commande/confirmation/${order.reference}`);
  return { ok: true, message: "Statut mis à jour." };
}

export async function retryOrderEmailNotificationsAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("orders.update");
  const orderId = String(formData.get("orderId") ?? "");
  if (!/^[a-zA-Z0-9_-]{1,64}$/.test(orderId)) return;
  const failed = await db.orderEmailNotification.findMany({
    where: { orderId, status: "FAILED" },
    select: { kind: true },
  });
  if (failed.length === 0) return;

  await dispatchPendingOrderEmails(orderId, true);
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "order.email.retry",
    entityType: "Order",
    entityId: orderId,
    metadata: { notificationKinds: failed.map((item) => item.kind) },
  });
  revalidatePath(`/admin/commandes/${orderId}`);
}

export async function reviewPrescriptionAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await assertPermission("prescriptions.review");
  const id = text(formData, "id");
  const status = text(formData, "status");
  const reviewNote = text(formData, "reviewNote").trim().slice(0, 500);

  if (status !== "VERIFIED" && status !== "REJECTED") {
    return { ok: false, message: "Décision invalide." };
  }

  const prescription = await db.prescription.findUnique({ where: { id } });
  if (!prescription) return { ok: false, message: "Ordonnance introuvable." };

  await db.prescription.update({
    where: { id },
    data: {
      status,
      reviewNote: reviewNote || null,
      reviewedById: actor.id,
      reviewedAt: new Date(),
    },
  });

  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: status === "VERIFIED" ? "prescription.verify" : "prescription.reject",
    entityType: "Prescription",
    entityId: id,
    metadata: { reviewNote },
  });

  revalidatePath("/admin/ordonnances");
  revalidatePath("/compte/ordonnances");
  // Un rejet sans motif ne permettrait pas au client de corriger sa demande.
  if (status === "REJECTED" && !reviewNote) {
    return {
      ok: true,
      message:
        "Ordonnance refusée. Ajoutez un motif lors d'un prochain contrôle pour guider le client.",
    };
  }
  return {
    ok: true,
    message: status === "VERIFIED" ? "Ordonnance validée." : "Ordonnance refusée.",
  };
}

export async function saveCouponAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await assertPermission("promotions.manage");
  const id = text(formData, "id");

  const parsed = couponAdminSchema.safeParse({
    code: formData.get("code"),
    description: formData.get("description") ?? "",
    type: formData.get("type"),
    value: formData.get("value"),
    minSubtotal: formData.get("minSubtotal") ?? "",
    startsAt: formData.get("startsAt") ?? "",
    endsAt: formData.get("endsAt") ?? "",
    usageLimit: formData.get("usageLimit") ?? "",
    isActive: formData.get("isActive") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Code promo invalide.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  let value = data.value;
  if (data.type === "PERCENT") {
    if (value < 1 || value > 100) {
      return {
        ok: false,
        message: "Un pourcentage doit être compris entre 1 et 100.",
        fieldErrors: { value: "Entre 1 et 100." },
      };
    }
  } else {
    const cents = parseDHToCents(String(value));
    if (cents === null || cents <= 0) {
      return {
        ok: false,
        message: "Montant de remise invalide.",
        fieldErrors: { value: "Indiquez un montant en dirhams." },
      };
    }
    value = cents;
  }

  let minSubtotalCents = 0;
  if (data.minSubtotal) {
    const cents = parseDHToCents(data.minSubtotal);
    if (cents === null || cents < 0) {
      return {
        ok: false,
        message: "Seuil minimum invalide.",
        fieldErrors: { minSubtotal: "Indiquez un montant valide ou laissez vide." },
      };
    }
    minSubtotalCents = cents;
  }

  const startsAt = data.startsAt ? new Date(data.startsAt) : null;
  const endsAt = data.endsAt ? new Date(data.endsAt) : null;
  if (startsAt && Number.isNaN(startsAt.getTime())) {
    return { ok: false, message: "Date de début invalide.", fieldErrors: { startsAt: "Date invalide." } };
  }
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    return { ok: false, message: "Date de fin invalide.", fieldErrors: { endsAt: "Date invalide." } };
  }
  if (startsAt && endsAt && endsAt <= startsAt) {
    return {
      ok: false,
      message: "La date de fin doit suivre la date de début.",
      fieldErrors: { endsAt: "Date de fin antérieure au début." },
    };
  }

  const usageLimit =
    typeof data.usageLimit === "number" ? data.usageLimit : null;
  const isActive = formData.get("isActive") === "on";

  const payload = {
    code: data.code,
    description: data.description || null,
    type: data.type,
    value,
    minSubtotalCents,
    startsAt,
    endsAt,
    usageLimit,
    isActive,
  };

  try {
    if (id) {
      await db.coupon.update({ where: { id }, data: payload });
    } else {
      await db.coupon.create({ data: payload });
    }
  } catch (error) {
    return {
      ok: false,
      message: prismaMessage(error, "Le code promo n'a pas pu être enregistré."),
    };
  }

  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: id ? "coupon.update" : "coupon.create",
    entityType: "Coupon",
    entityId: id || data.code,
    metadata: { code: data.code, type: data.type, value },
  });

  revalidatePath("/admin/promotions");
  revalidatePath("/panier");
  return { ok: true, message: "Code promo enregistré." };
}

export async function toggleCouponAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("promotions.manage");
  const id = text(formData, "id");
  const coupon = await db.coupon.findUnique({ where: { id } });
  if (!coupon) return;

  await db.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  });
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "coupon.toggle",
    entityType: "Coupon",
    entityId: id,
    metadata: { isActive: !coupon.isActive },
  });
  revalidatePath("/admin/promotions");
}

export async function deleteCouponAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("promotions.manage");
  const id = text(formData, "id");
  const coupon = await db.coupon.findUnique({ where: { id } });
  if (!coupon || coupon.usageCount > 0) return;

  await db.coupon.delete({ where: { id } });
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "coupon.delete",
    entityType: "Coupon",
    entityId: id,
    metadata: { code: coupon.code },
  });
  revalidatePath("/admin/promotions");
}

export async function toggleCustomerActiveAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("customers.update");
  const id = text(formData, "id");
  const customer = await db.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!customer) return;
  if (customer.role.isSuperAdmin || customer.id === actor.id) return;
  // Seuls les comptes clients peuvent être basculés : un rôle interne
  // (Opticien, Gérant…) ne doit pas être désactivé par ce formulaire.
  if (customer.role.name !== "Client") return;

  await db.user.update({
    where: { id },
    data: { isActive: !customer.isActive },
  });

  if (customer.isActive) {
    await db.session.deleteMany({ where: { userId: id } });
  }

  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "customer.toggle",
    entityType: "User",
    entityId: id,
    metadata: { isActive: !customer.isActive },
  });
  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
}
