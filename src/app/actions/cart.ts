"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { jsonStringList } from "@/lib/json-string-list";
import {
  findCartWithItems,
  getCartView,
  getOrCreateCart,
} from "@/lib/cart";
import { getSessionUser } from "@/lib/auth/session";
import { storePrescriptionFile } from "@/lib/uploads";
import { evaluateOpticalCompatibility, opticalCombinationFromSnapshot } from "@/lib/optical-compatibility-db";
import { OPTICAL_REVIEW_MESSAGE } from "@/lib/optical-compatibility";
import {
  computeDiscountCents,
  validateLensSelection,
  type LensSelection,
} from "@/lib/pricing";
import {
  cartAddSchema,
  cartUpdateSchema,
  couponSchemaInput,
  lensSelectionSchema,
  prescriptionSchema,
} from "@/lib/validation";

export type CartActionState = {
  ok: boolean;
  message: string;
} | null;

function revalidateCart() {
  revalidatePath("/panier");
  revalidatePath("/commande");
}

export async function addSimpleToCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = cartAddSchema.safeParse({
    variantId: formData.get("variantId"),
    quantity: formData.get("quantity") ?? 1,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Sélection invalide.",
    };
  }

  const variant = await db.productVariant.findFirst({
    where: { id: parsed.data.variantId, isActive: true, product: { isActive: true, category: { isActive: true }, brand: { isActive: true } } },
    include: { inventory: true, product: true },
  });

  if (!variant) {
    return { ok: false, message: "Ce coloris n'est plus disponible." };
  }

  const stock = variant.inventory?.quantity ?? 0;
  if (stock < parsed.data.quantity) {
    return {
      ok: false,
      message:
        stock === 0
          ? "Ce coloris est épuisé."
          : `Stock insuffisant : ${stock} exemplaire(s) disponible(s).`,
    };
  }

  const cart = await getOrCreateCart();
  const existing = await db.cartItem.findUnique({
    where: {
      cartId_variantId_configKey: {
        cartId: cart.id,
        variantId: variant.id,
        configKey: "frame",
      },
    },
  });

  const nextQuantity = (existing?.quantity ?? 0) + parsed.data.quantity;
  if (nextQuantity > stock || nextQuantity > 5) {
    return {
      ok: false,
      message: `Vous ne pouvez pas ajouter plus de ${Math.min(stock, 5)} exemplaire(s) de ce coloris.`,
    };
  }

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQuantity },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: variant.productId,
        variantId: variant.id,
        quantity: parsed.data.quantity,
        configKey: "frame",
      },
    });
  }

  // The cart page is cookie-backed and dynamically rendered; the redirect
  // will fetch its fresh contents without invalidating the shared site layout.
  redirect("/panier");
}

export async function addConfiguredToCartAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = lensSelectionSchema.safeParse({
    productId: formData.get("productId"),
    variantId: formData.get("variantId"),
    hasCorrection: formData.get("hasCorrection"),
    lensTypeId: formData.get("lensTypeId") || undefined,
    lensIndexId: formData.get("lensIndexId") || undefined,
    treatmentIds: formData.getAll("treatmentIds").map(String),
    quantity: formData.get("quantity") ?? 1,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Configuration invalide.",
    };
  }

  const product = await db.product.findFirst({
    where: { id: parsed.data.productId, isActive: true, category: { isActive: true }, brand: { isActive: true } },
    include: {
      variants: {
        where: { id: parsed.data.variantId, isActive: true },
        include: { inventory: true },
      },
    },
  });

  const variant = product?.variants[0];
  if (!product || !variant) {
    return { ok: false, message: "Monture ou coloris indisponible." };
  }

  const stock = variant.inventory?.quantity ?? 0;
  if (stock < parsed.data.quantity) {
    return {
      ok: false,
      message:
        stock === 0
          ? "Ce coloris est épuisé."
          : `Stock insuffisant : ${stock} exemplaire(s) disponible(s).`,
    };
  }

  const hasCorrection = parsed.data.hasCorrection === "true";
  if (hasCorrection && !product.lensCompatible) {
    return { ok: false, message: "Cette monture n'est pas disponible avec des verres correcteurs. Contactez votre opticien." };
  }

  let lensType = null;
  let lensIndex = null;
  let treatments: Array<{
    id: string;
    name: string;
    priceCents: number;
    isActive: boolean;
  }> = [];

  if (hasCorrection) {
    [lensType, lensIndex, treatments] = await Promise.all([
      parsed.data.lensTypeId
        ? db.lensType.findFirst({ where: { id: parsed.data.lensTypeId, isActive: true } })
        : Promise.resolve(null),
      parsed.data.lensIndexId
        ? db.lensIndex.findFirst({ where: { id: parsed.data.lensIndexId, isActive: true } })
        : Promise.resolve(null),
      db.lensTreatment.findMany({
        where: { id: { in: parsed.data.treatmentIds }, isActive: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    if (!lensType || !lensIndex) {
      return { ok: false, message: "Veuillez choisir un type de verre et un indice." };
    }
    if (lensType.kind === "PROGRESSIVE") {
      return { ok: false, message: "Cette option de verre n'est plus disponible pour les nouveaux achats." };
    }
    if (treatments.length !== parsed.data.treatmentIds.length) {
      return { ok: false, message: "Un traitement sélectionné n'est plus disponible." };
    }
  }

  const user = await getSessionUser();
  const method = String(formData.get("prescriptionMethod") ?? "LATER") as
    | "UPLOAD"
    | "MANUAL"
    | "WHATSAPP"
    | "LATER";

  let prescriptionId: string | undefined;

  if (hasCorrection && method === "MANUAL") {
    const rx = prescriptionSchema.safeParse({
      method: "MANUAL",
      rightSphere: formData.get("rightSphere"),
      rightCylinder: formData.get("rightCylinder"),
      rightAxis: formData.get("rightAxis"),
      leftSphere: formData.get("leftSphere"),
      leftCylinder: formData.get("leftCylinder"),
      leftAxis: formData.get("leftAxis"),
      customerNote: formData.get("customerNote") ?? "",
    });
    if (!rx.success) {
      return {
        ok: false,
        message: rx.error.issues[0]?.message ?? "Ordonnance incomplète.",
      };
    }
  }

  const selection: LensSelection = {
    hasCorrection,
    lensType: lensType
      ? {
          id: lensType.id,
          name: lensType.name,
          kind: lensType.kind,
          priceCents: lensType.priceCents,
          productTypes: jsonStringList(lensType.productTypes),
          isActive: lensType.isActive,
        }
      : null,
    lensIndex: lensIndex
      ? {
          id: lensIndex.id,
          name: lensIndex.name,
          label: lensIndex.label,
          value: lensIndex.value,
          priceCents: lensIndex.priceCents,
          maxAbsSphere: lensIndex.maxAbsSphere ? Number(lensIndex.maxAbsSphere) : null,
          isActive: lensIndex.isActive,
        }
      : null,
    treatments: treatments.map((treatment) => ({
      id: treatment.id,
      name: treatment.name,
      priceCents: treatment.priceCents,
      isActive: treatment.isActive,
    })),
  };

  const result = validateLensSelection(
    selection,
    product.type,
  );

  if (!result.ok) {
    return { ok: false, message: result.error };
  }
  if (hasCorrection) {
    const decision = await evaluateOpticalCompatibility(db, {
      productId: product.id, variantId: variant.id, lensTypeId: lensType?.id ?? "",
      lensIndexId: lensIndex?.id ?? "", treatmentIds: selection.treatments.map((treatment) => treatment.id),
    });
    if (!decision.allowed) return { ok: false, message: OPTICAL_REVIEW_MESSAGE };
  }

  if (hasCorrection) {
    let fileData: {
      filePath: string;
      originalFileName: string;
      fileMime: string;
      fileSize: number;
    } | null = null;

    if (method === "UPLOAD") {
      const file = formData.get("prescriptionFile");
      if (!(file instanceof File) || file.size === 0) {
        return {
          ok: false,
          message: "Veuillez téléverser votre ordonnance (PDF, JPEG, PNG ou HEIC).",
        };
      }
      try {
        const stored = await storePrescriptionFile(file);
        fileData = {
          filePath: stored.storedPath,
          originalFileName: stored.originalFileName,
          fileMime: stored.mime,
          fileSize: stored.size,
        };
      } catch (error) {
        return {
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : "Impossible de conserver le fichier.",
        };
      }
    }

    const rx = prescriptionSchema.safeParse({
      method,
      rightSphere: formData.get("rightSphere"),
      rightCylinder: formData.get("rightCylinder"),
      rightAxis: formData.get("rightAxis"),
      leftSphere: formData.get("leftSphere"),
      leftCylinder: formData.get("leftCylinder"),
      leftAxis: formData.get("leftAxis"),
      customerNote: formData.get("customerNote") ?? "",
    });

    if (!rx.success) {
      return {
        ok: false,
        message: rx.error.issues[0]?.message ?? "Ordonnance incomplète.",
      };
    }

    if (method === "MANUAL") {
      const data = rx.data;
      const hasMeasure =
        data.rightSphere !== undefined ||
        data.leftSphere !== undefined ||
        data.rightCylinder !== undefined ||
        data.leftCylinder !== undefined;
      if (!hasMeasure) {
        return {
          ok: false,
          message: "Renseignez au moins une mesure pour l'œil droit ou gauche.",
        };
      }
    }

    const created = await db.prescription.create({
      data: {
        userId: user?.id ?? null,
        method,
        status: "PENDING",
        rightSphere: rx.data.rightSphere ?? null,
        rightCylinder: rx.data.rightCylinder ?? null,
        rightAxis: rx.data.rightAxis ?? null,
        leftSphere: rx.data.leftSphere ?? null,
        leftCylinder: rx.data.leftCylinder ?? null,
        leftAxis: rx.data.leftAxis ?? null,
        customerNote: rx.data.customerNote || null,
        ...(fileData ?? {}),
      },
    });
    prescriptionId = created.id;
  }

  const cart = await getOrCreateCart();
  const treatmentIds = selection.treatments.map((treatment) => treatment.id).sort();
  const configKey = `lens:${lensType?.id ?? "none"}:${lensIndex?.id ?? "none"}:${treatmentIds.join("+")}:rx:${prescriptionId ?? "none"}`;

  const existing = await db.cartItem.findUnique({
    where: {
      cartId_variantId_configKey: {
        cartId: cart.id,
        variantId: variant.id,
        configKey,
      },
    },
  });

  const nextQuantity = (existing?.quantity ?? 0) + parsed.data.quantity;
  if (nextQuantity > stock || nextQuantity > 5) {
    return {
      ok: false,
      message: `Vous ne pouvez pas ajouter plus de ${Math.min(stock, 5)} exemplaire(s) de cette configuration.`,
    };
  }

  const snapshot = {
    hasCorrection,
    lensTypeId: lensType?.id,
    lensTypeName: lensType?.name,
    lensTypePriceCents: lensType?.priceCents ?? 0,
    lensIndexId: lensIndex?.id,
    lensIndexName: lensIndex?.name,
    lensIndexValue: lensIndex?.value,
    lensIndexPriceCents: lensIndex?.priceCents ?? 0,
    treatments: selection.treatments.map((treatment) => ({
      id: treatment.id,
      name: treatment.name,
      priceCents: treatment.priceCents,
    })),
    lensPriceCents: result.priceCents,
    summary: result.summary,
    prescriptionMethod: hasCorrection ? method : undefined,
    prescriptionId,
  };

  if (existing) {
    await db.cartItem.update({
      where: { id: existing.id },
      data: {
        quantity: nextQuantity,
        lensSnapshot: snapshot,
        prescriptionId: prescriptionId ?? null,
      },
    });
  } else {
    await db.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        variantId: variant.id,
        quantity: parsed.data.quantity,
        configKey,
        lensSnapshot: snapshot,
        prescriptionId: prescriptionId ?? null,
      },
    });
  }

  // The cart page is cookie-backed and dynamically rendered; the redirect
  // will fetch its fresh contents without invalidating the shared site layout.
  redirect("/panier");
}

export async function updateCartItemAction(formData: FormData): Promise<void> {
  const parsed = cartUpdateSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return;

  const cart = await getOrCreateCart();
  const item = await db.cartItem.findFirst({
    where: { id: parsed.data.itemId, cartId: cart.id },
    include: { variant: { include: { inventory: true } } },
  });
  if (!item) return;

  if (parsed.data.quantity === 0) {
    await db.cartItem.delete({ where: { id: item.id } });
    revalidateCart();
    return;
  }

  const combination = opticalCombinationFromSnapshot(item.productId, item.variantId, item.lensSnapshot);
  if (combination && !(await evaluateOpticalCompatibility(db, combination)).allowed) {
    revalidateCart();
    return;
  }

  const stock = item.variant.inventory?.quantity ?? 0;
  const quantity = Math.min(parsed.data.quantity, stock, 5);
  if (quantity <= 0) return;

  await db.cartItem.update({ where: { id: item.id }, data: { quantity } });
  revalidateCart();
}

export async function removeCartItemAction(formData: FormData): Promise<void> {
  const itemId = String(formData.get("itemId") ?? "");
  if (!itemId) return;
  const cart = await getOrCreateCart();
  await db.cartItem.deleteMany({ where: { id: itemId, cartId: cart.id } });
  revalidateCart();
}

export async function applyCouponAction(
  _prev: CartActionState,
  formData: FormData,
): Promise<CartActionState> {
  const parsed = couponSchemaInput.safeParse({ code: formData.get("code") ?? "" });
  if (!parsed.success) {
    return { ok: false, message: "Code promo invalide." };
  }
  const code = parsed.data.code;

  const cart = await getOrCreateCart();

  if (!code) {
    await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
    revalidateCart();
    return { ok: true, message: "Code promo retiré." };
  }

  const coupon = await db.coupon.findUnique({ where: { code } });
  const view = await getCartView();
  const discount = computeDiscountCents(coupon, view.subtotalCents);
  if (!discount.ok) {
    return { ok: false, message: discount.error ?? "Code promo invalide." };
  }

  await db.cart.update({ where: { id: cart.id }, data: { couponCode: code } });
  revalidateCart();
  return { ok: true, message: "Code promo appliqué." };
}

export async function removeCouponAction(): Promise<void> {
  const cart = await getOrCreateCart();
  await db.cart.update({ where: { id: cart.id }, data: { couponCode: null } });
  revalidateCart();
}
