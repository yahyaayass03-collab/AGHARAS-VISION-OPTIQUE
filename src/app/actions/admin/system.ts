"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { jsonStringList } from "@/lib/json-string-list";
import { assertPermission } from "@/lib/auth/guards";
import { accessSubject } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { writeAudit } from "@/lib/audit";
import { parseDHToCents } from "@/lib/money";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { deleteUnreferencedPublicImages, storePublicImage, validPublicImageUrl } from "@/lib/public-media";
import { isValidWhatsAppNumber } from "@/lib/whatsapp";
import {
  canGrantPermissions,
  PERMISSION_GROUPS,
} from "@/lib/permissions";
import {
  bannerSchema,
  contentPageSchema,
  faqSchema,
  roleSchema,
  staffSchema,
} from "@/lib/validation";
import {
  prismaMessage,
  text,
  toFieldErrors,
  type AdminState,
} from "@/lib/admin";

const BOOLEAN_SETTINGS = new Set([
  "payment.cod_enabled",
  "payment.online_enabled",
  "order.prescription_required",
  "order.owner_email_enabled",
  "order.customer_confirmation_enabled",
  "home.categories_visible",
  "home.featured_visible",
  "home.optical_visible",
  "home.trust_visible",
  "home.announcement_visible",
]);

const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as Array<
  keyof typeof DEFAULT_SETTINGS
>;

export async function saveSettingsAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await assertPermission("settings.manage");

  const updates: Array<{ key: string; value: string }> = [];
  for (const key of SETTING_KEYS) {
    if (!formData.has(key) && !BOOLEAN_SETTINGS.has(key)) continue;

    let value: string;
    if (BOOLEAN_SETTINGS.has(key)) {
      value = formData.get(key) === "on" ? "true" : "false";
    } else {
      value = text(formData, key).trim().slice(0, 2000);
    }

    // Le paiement en ligne reste indisponible tant qu'aucune passerelle CMI
    // n'est intégrée et validée. Le paiement à la livraison reste le seul mode.
    if (key === "payment.online_enabled") value = "false";
    if (key === "payment.cod_enabled") value = "true";

    if (key === "shipping.free_threshold") {
      const cents = parseDHToCents(value);
      if (cents === null || cents < 0) {
        return {
          ok: false,
          message: "Le seuil de livraison offerte est invalide.",
          fieldErrors: {
            "shipping.free_threshold": "Indiquez un montant en dirhams.",
          },
        };
      }
      value = String(cents);
    }

    if (key === "store.whatsapp" && value && !isValidWhatsAppNumber(value)) {
      return {
        ok: false,
        message: "Le numéro WhatsApp est invalide.",
        fieldErrors: {
          "store.whatsapp":
            "Indiquez un numéro réel, par exemple +212 628-889950.",
        },
      };
    }

    if (key.startsWith("social.") && value) {
      try {
        const url = new URL(value);
        if (url.protocol !== "https:") throw new Error("Protocole invalide");
      } catch {
        return { ok: false, message: `Le lien ${key} doit être une URL https valide.` };
      }
    }

    if (key === "store.logo_url" && value && !validPublicImageUrl(value)) {
      return {
        ok: false,
        message: "Le logo doit utiliser un chemin d’image local autorisé.",
        fieldErrors: {
          "store.logo_url": "Utilisez un chemin /images/… ou /api/media/… valide.",
        },
      };
    }

    updates.push({ key, value });
  }

  if (updates.length === 0) {
    return { ok: false, message: "Aucun réglage à enregistrer." };
  }

  const nextLogo = updates.find((entry) => entry.key === "store.logo_url")?.value;
  const previousLogo = nextLogo === undefined
    ? null
    : (await db.setting.findUnique({ where: { key: "store.logo_url" }, select: { value: true } }))?.value ?? null;

  await db.$transaction(async (tx) => {
    await Promise.all(
      updates.map((entry) =>
        tx.setting.upsert({
          where: { key: entry.key },
          create: {
            key: entry.key,
            value: entry.value,
            group: keyGroup(entry.key),
            label: entry.key.replace(`${keyGroup(entry.key)}.`, ""),
          },
          update: { value: entry.value },
        }),
      ),
    );

    const address = updates.find((entry) => entry.key === "store.address")?.value;
    const city = updates.find((entry) => entry.key === "store.city")?.value;
    if (address !== undefined || city !== undefined) {
      const primaryStore = await tx.store.findFirst({
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { slug: "asc" }],
      });
      if (primaryStore) {
        await tx.store.update({
          where: { id: primaryStore.id },
          data: {
            ...(address !== undefined ? { address } : {}),
            ...(city !== undefined ? { city } : {}),
          },
        });
      }
    }
  });

  if (previousLogo && previousLogo !== nextLogo) {
    await deleteUnreferencedPublicImages([previousLogo]).catch(() => undefined);
  }

  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "settings.update",
    entityType: "Setting",
    metadata: { keys: updates.map((entry) => entry.key) },
  });

  // Settings are read from the database on each dynamic page request. Avoid
  // invalidating the shared root layout while this form action is returning.
  return { ok: true, message: "Réglages enregistrés." };
}

function keyGroup(key: string): string {
  return key.split(".")[0] ?? "general";
}

export async function saveContentPageAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await assertPermission("content.manage");
  const id = text(formData, "id");

  const parsed = contentPageSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    intro: formData.get("intro") ?? "",
    body: formData.get("body"),
    metaDescription: formData.get("metaDescription") ?? "",
    isPublished: formData.get("isPublished") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Page invalide.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const payload = {
    slug: data.slug,
    title: data.title,
    intro: data.intro || null,
    body: data.body,
    metaDescription: data.metaDescription || null,
    isPublished: formData.get("isPublished") === "on",
  };

  try {
    if (id) {
      await db.contentPage.update({ where: { id }, data: payload });
    } else {
      await db.contentPage.create({ data: payload });
    }
  } catch (error) {
    return {
      ok: false,
      message: prismaMessage(error, "La page n'a pas pu être enregistrée."),
    };
  }

  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: id ? "content.update" : "content.create",
    entityType: "ContentPage",
    entityId: id || data.slug,
    metadata: { slug: data.slug },
  });

  revalidatePath("/admin/contenu");
  revalidatePath(`/${data.slug}`);
  return { ok: true, message: "Page enregistrée." };
}

export async function saveFaqAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await assertPermission("content.manage");
  const id = text(formData, "id");

  const parsed = faqSchema.safeParse({
    question: formData.get("question"),
    answer: formData.get("answer"),
    category: formData.get("category"),
    sortOrder: formData.get("sortOrder") ?? 0,
    isActive: formData.get("isActive") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Question invalide.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const payload = {
    question: data.question,
    answer: data.answer,
    category: data.category,
    sortOrder: data.sortOrder,
    isActive: formData.get("isActive") === "on",
  };

  if (id) {
    await db.faqItem.update({ where: { id }, data: payload });
  } else {
    await db.faqItem.create({ data: payload });
  }

  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: id ? "faq.update" : "faq.create",
    entityType: "FaqItem",
    entityId: id || data.question.slice(0, 60),
  });

  revalidatePath("/admin/contenu");
  revalidatePath("/faq");
  return { ok: true, message: "Question enregistrée." };
}

export async function deleteFaqAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("content.manage");
  const id = text(formData, "id");
  const faq = await db.faqItem.findUnique({ where: { id } });
  if (!faq) return;

  await db.faqItem.delete({ where: { id } });
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "faq.delete",
    entityType: "FaqItem",
    entityId: id,
    metadata: { question: faq.question },
  });
  revalidatePath("/admin/contenu");
  revalidatePath("/faq");
}

export async function saveBannerAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await assertPermission("content.manage");
  const id = text(formData, "id");

  const parsed = bannerSchema.safeParse({
    key: formData.get("key"),
    position: formData.get("position") ?? "home",
    eyebrow: formData.get("eyebrow") ?? "",
    title: formData.get("title"),
    subtitle: formData.get("subtitle") ?? "",
    imageUrl: formData.get("imageUrl") ?? "",
    ctaLabel: formData.get("ctaLabel") ?? "",
    ctaHref: formData.get("ctaHref") ?? "",
    isActive: formData.get("isActive") ?? undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Bannière invalide.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const sortOrder = Number(text(formData, "sortOrder") || "0");
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 9999) {
    return { ok: false, message: "Ordre de bannière invalide." };
  }
  if (data.imageUrl && !validPublicImageUrl(data.imageUrl)) {
    return { ok: false, message: "Image invalide : choisissez un visuel de la boutique." };
  }
  const file = formData.get("image");
  let imageUrl = data.imageUrl;
  if (file instanceof File && file.size > 0) {
    try { imageUrl = await storePublicImage(file); }
    catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Image invalide." }; }
  }
  const payload = {
    key: data.key,
    position: data.position ?? "home",
    eyebrow: data.eyebrow || null,
    title: data.title,
    subtitle: data.subtitle || null,
    imageUrl: imageUrl || null,
    ctaLabel: data.ctaLabel || null,
    ctaHref: data.ctaHref || null,
    sortOrder,
    isActive: formData.get("isActive") === "on",
  };

  const previousImageUrl = id
    ? (await db.banner.findUnique({ where: { id }, select: { imageUrl: true } }))?.imageUrl ?? null
    : null;
  try {
    if (id) {
      await db.banner.update({ where: { id }, data: payload });
    } else {
      await db.banner.create({ data: payload });
    }
  } catch (error) {
    if (imageUrl && imageUrl !== data.imageUrl) await deleteUnreferencedPublicImages([imageUrl]).catch(() => undefined);
    return {
      ok: false,
      message: prismaMessage(error, "La bannière n'a pas pu être enregistrée."),
    };
  }
  if (previousImageUrl && previousImageUrl !== imageUrl) {
    await deleteUnreferencedPublicImages([previousImageUrl]).catch(() => undefined);
  }

  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: id ? "banner.update" : "banner.create",
    entityType: "Banner",
    entityId: id || data.key,
  });

  revalidatePath("/admin/contenu");
  revalidatePath("/");
  revalidatePath("/a-propos");
  return { ok: true, message: "Bannière enregistrée." };
}

export async function deleteBannerAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("content.manage");
  const id = text(formData, "id");
  const banner = await db.banner.findUnique({ where: { id } });
  if (!banner) return;

  await db.banner.delete({ where: { id } });
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "banner.delete",
    entityType: "Banner",
    entityId: id,
    metadata: { key: banner.key },
  });
  revalidatePath("/admin/contenu");
  revalidatePath("/");
}

export async function saveStaffAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await assertPermission("users.manage");

  const parsed = staffSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Compte invalide.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  const role = await db.role.findUnique({ where: { id: data.roleId } });
  if (!role) {
    return { ok: false, message: "Rôle introuvable." };
  }

  if (role.isSuperAdmin && !actor.role.isSuperAdmin) {
    return {
      ok: false,
      message: "Seul un super-administrateur peut attribuer ce rôle.",
    };
  }
  if (
    !canGrantPermissions(accessSubject(actor), jsonStringList(role.permissions)) ||
    (role.isSuperAdmin && !actor.role.isSuperAdmin)
  ) {
    return {
      ok: false,
      message:
        "Vous ne pouvez pas attribuer un rôle disposant de permissions supérieures aux vôtres.",
    };
  }

  try {
    const created = await db.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        passwordHash: await hashPassword(data.password),
        roleId: role.id,
      },
    });
    await writeAudit({
      userId: actor.id,
      actorEmail: actor.email,
      action: "staff.create",
      entityType: "User",
      entityId: created.id,
      metadata: { email: data.email, role: role.name },
    });
  } catch (error) {
    return {
      ok: false,
      message: prismaMessage(error, "Le compte n'a pas pu être créé."),
    };
  }

  revalidatePath("/admin/utilisateurs");
  return { ok: true, message: "Compte staff créé." };
}

export async function toggleStaffActiveAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("users.manage");
  const id = text(formData, "id");
  const staff = await db.user.findUnique({
    where: { id },
    include: { role: true },
  });
  if (!staff || staff.id === actor.id || staff.role.isSuperAdmin) return;

  await db.user.update({ where: { id }, data: { isActive: !staff.isActive } });
  if (staff.isActive) {
    await db.session.deleteMany({ where: { userId: id } });
  }
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "staff.toggle",
    entityType: "User",
    entityId: id,
    metadata: { isActive: !staff.isActive },
  });
  revalidatePath("/admin/utilisateurs");
}

export async function saveRoleAction(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const actor = await assertPermission("roles.manage");
  const id = text(formData, "id");
  const requested = formData
    .getAll("permissions")
    .map(String)
    .filter((code) =>
      PERMISSION_GROUPS.some((group) =>
        group.permissions.some((permission) => permission.code === code),
      ),
    );

  const parsed = roleSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    permissions: requested,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Rôle invalide.",
      fieldErrors: toFieldErrors(parsed.error),
    };
  }

  const data = parsed.data;
  if (!canGrantPermissions(accessSubject(actor), data.permissions)) {
    return {
      ok: false,
      message:
        "Vous ne pouvez pas accorder des permissions que vous ne possédez pas.",
    };
  }

  if (id) {
    const existing = await db.role.findUnique({ where: { id } });
    if (!existing) return { ok: false, message: "Rôle introuvable." };
    if (existing.isSuperAdmin) {
      return {
        ok: false,
        message: "Le rôle super-administrateur ne peut pas être modifié.",
      };
    }
    try {
      await db.role.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || null,
          permissions: data.permissions,
        },
      });
    } catch (error) {
      return {
        ok: false,
        message: prismaMessage(error, "Le rôle n'a pas pu être modifié."),
      };
    }
    await writeAudit({
      userId: actor.id,
      actorEmail: actor.email,
      action: "role.update",
      entityType: "Role",
      entityId: id,
      metadata: { permissions: data.permissions },
    });
  } else {
    try {
      const created = await db.role.create({
        data: {
          name: data.name,
          description: data.description || null,
          permissions: data.permissions,
        },
      });
      await writeAudit({
        userId: actor.id,
        actorEmail: actor.email,
        action: "role.create",
        entityType: "Role",
        entityId: created.id,
        metadata: { permissions: data.permissions },
      });
    } catch (error) {
      return {
        ok: false,
        message: prismaMessage(error, "Le rôle n'a pas pu être créé."),
      };
    }
  }

  revalidatePath("/admin/utilisateurs");
  revalidatePath("/admin/utilisateurs/roles");
  return { ok: true, message: "Rôle enregistré." };
}

export async function deleteRoleAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("roles.manage");
  const id = text(formData, "id");
  const role = await db.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role || role.isSystem || role.isSuperAdmin) return;
  if (role._count.users > 0) return;

  await db.role.delete({ where: { id } });
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "role.delete",
    entityType: "Role",
    entityId: id,
    metadata: { name: role.name },
  });
  revalidatePath("/admin/utilisateurs/roles");
}

export async function updateContactStatusAction(formData: FormData): Promise<void> {
  const actor = await assertPermission("content.manage");
  const id = text(formData, "id");
  const status = text(formData, "status");
  if (!["NEW", "IN_PROGRESS", "CLOSED"].includes(status)) return;

  await db.contactMessage.update({
    where: { id },
    data: { status: status as "NEW" | "IN_PROGRESS" | "CLOSED" },
  });
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "contact.status",
    entityType: "ContactMessage",
    entityId: id,
    metadata: { status },
  });
  revalidatePath("/admin/messages");
}

export async function toggleNewsletterSubscriberAction(
  formData: FormData,
): Promise<void> {
  const actor = await assertPermission("content.manage");
  const id = text(formData, "id");
  const subscriber = await db.newsletterSubscriber.findUnique({ where: { id } });
  if (!subscriber) return;

  await db.newsletterSubscriber.update({
    where: { id },
    data: { isActive: !subscriber.isActive },
  });
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "newsletter.toggle",
    entityType: "NewsletterSubscriber",
    entityId: id,
    metadata: { isActive: !subscriber.isActive },
  });
  revalidatePath("/admin/messages");
}

export async function deleteNewsletterSubscriberAction(
  formData: FormData,
): Promise<void> {
  const actor = await assertPermission("content.manage");
  const id = text(formData, "id");
  const subscriber = await db.newsletterSubscriber.findUnique({ where: { id } });
  if (!subscriber) return;

  await db.newsletterSubscriber.delete({ where: { id } });
  await writeAudit({
    userId: actor.id,
    actorEmail: actor.email,
    action: "newsletter.delete",
    entityType: "NewsletterSubscriber",
    entityId: id,
    metadata: { emailHashOnly: true },
  });
  revalidatePath("/admin/messages");
}
