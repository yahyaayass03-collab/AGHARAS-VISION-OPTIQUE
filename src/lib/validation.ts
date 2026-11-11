import { z } from "zod";

/** Nettoie un numéro marocain : espaces, points, tirets. */
export function normalizePhone(input: string): string {
  return input.replace(/[\s.\-()]/g, "");
}

const phone = z
  .string()
  .trim()
  .min(1, "Le numéro de téléphone est requis.")
  .transform(normalizePhone)
  .refine(
    (value) => /^(?:\+212|00212|0)[5-7]\d{8}$/.test(value),
    "Numéro marocain invalide (ex. 0612345678 ou +212612345678).",
  );

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Adresse e-mail invalide.")
  .max(160, "Adresse e-mail trop longue.");

const name = z
  .string()
  .trim()
  .min(2, "2 caractères minimum.")
  .max(60, "60 caractères maximum.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Mot de passe requis."),
  next: z.string().optional(),
});

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Libellé requis.").max(40),
  firstName: name,
  lastName: name,
  phone,
  line1: z.string().trim().min(5, "Adresse trop courte.").max(180),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Ville requise.").max(60),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Code postal à 5 chiffres.")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
  isDefault: z.string().optional(),
});

export const profileSchema = z.object({
  firstName: name,
  lastName: name,
  phone: phone.or(z.literal("")),
});

const optionalNumber = (min: number, max: number, label: string) =>
  z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      if (typeof value === "string") {
        const parsed = Number(value.replace(",", "."));
        return Number.isNaN(parsed) ? value : parsed;
      }
      return value;
    },
    z
      .number({ error: `${label} invalide.` })
      .min(min, `${label} hors plage.`)
      .max(max, `${label} hors plage.`)
      .optional(),
  );

// Technical storage bounds for Decimal(5,2), not clinical plausibility rules.
const prescriptionDecimal = optionalNumber(-999.99, 999.99, "Mesure").refine(
  (value) => value === undefined || Math.abs(value * 100 - Math.round(value * 100)) < 1e-7,
  "Saisissez au maximum deux décimales.",
);

const axis = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return undefined;
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
  },
  z
    .number({ error: "Axe invalide." })
    .int("L'axe doit être un nombre entier.")
    .min(-2147483648, "Valeur d'axe trop petite pour être enregistrée.")
    .max(2147483647, "Valeur d'axe trop grande pour être enregistrée.")
    .optional(),
);

export const prescriptionSchema = z
  .object({
    method: z.enum(["UPLOAD", "MANUAL", "WHATSAPP", "LATER"]),
    rightSphere: prescriptionDecimal,
    rightCylinder: prescriptionDecimal,
    rightAxis: axis,
    leftSphere: prescriptionDecimal,
    leftCylinder: prescriptionDecimal,
    leftAxis: axis,
    customerNote: z.string().trim().max(500, "500 caractères maximum.").optional().or(z.literal("")),
    consent: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.method === "MANUAL") {
      const hasAnyEyeValue =
        data.rightSphere !== undefined ||
        data.leftSphere !== undefined ||
        data.rightCylinder !== undefined ||
        data.leftCylinder !== undefined;
      if (!hasAnyEyeValue) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["rightSphere"],
          message: "Renseignez au moins une mesure pour l'œil droit ou gauche.",
        });
      }
    }
  });

export const lensSelectionSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1),
  hasCorrection: z.enum(["true", "false"]),
  lensTypeId: z.string().optional(),
  lensIndexId: z.string().optional(),
  treatmentIds: z.array(z.string()).default([]),
  quantity: z.coerce.number().int().min(1).max(5).default(1),
});

export const cartAddSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(5).default(1),
});

export const cartUpdateSchema = z.object({
  itemId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(5),
});

export const couponSchemaInput = z.object({
  code: z
    .string()
    .trim()
    .min(3, "Code trop court.")
    .max(32)
    .transform((v) => v.toUpperCase())
    .or(z.literal("")),
});

export const checkoutSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  phone,
  addressLine1: z.string().trim().min(5, "Adresse complète requise.").max(180),
  addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Ville requise.").max(60),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Code postal à 5 chiffres.")
    .optional()
    .or(z.literal("")),
  deliveryNotes: z.string().trim().max(500).optional().or(z.literal("")),
  shippingCode: z.string().min(1, "Choisissez un mode de livraison."),
  paymentMethod: z.enum(["CASH_ON_DELIVERY"]),
  couponCode: z.string().trim().max(32).optional().or(z.literal("")),
  acceptTerms: z.literal("on", { error: "Vous devez accepter les CGV." }),
  idempotencyKey: z.string().uuid("Jeton de commande invalide."),
});

export const contactSchema = z.object({
  name: name,
  email,
  phone: phone.optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Objet requis.").max(120),
  message: z.string().trim().min(20, "Votre message doit contenir au moins 20 caractères.").max(3000),
  consent: z.literal("on", { error: "Le consentement est requis." }),
});

export const newsletterSchema = z.object({ email });

export const productSchema = z.object({
  name: z.string().trim().min(3, "Nom requis.").max(120),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(140)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalide (minuscules, chiffres et tirets)."),
  subtitle: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().min(20, "Description trop courte.").max(8000),
  story: z.string().trim().max(8000).optional().or(z.literal("")),
  brandId: z.string().min(1, "Marque requise."),
  categoryId: z.string().min(1, "Catégorie requise."),
  type: z.enum(["OPTICAL", "SUNGLASSES", "CLIP", "CONTACT_LENS", "ACCESSORY"]),
  gender: z.enum(["FEMME", "HOMME", "MIXTE", "ENFANT"]),
  material: z.string().trim().max(80).optional().or(z.literal("")),
  shape: z.enum(["PANTOS", "RONDE", "RECTANGULAIRE", "PAPILLON", "CERCLEE", "PERCEE", "AUTRE"]),
  sku: z.string().trim().min(2, "Référence requise.").max(40),
  price: z.string().trim().min(1, "Prix requis."),
  compareAtPrice: z.string().trim().optional().or(z.literal("")),
  badge: z.string().trim().max(40).optional().or(z.literal("")),
  weightGrams: z.coerce.number().int().min(0).max(500).optional().or(z.literal("")),
  lensWidthMm: z.coerce.number().int().min(30).max(70).optional().or(z.literal("")),
  bridgeMm: z.coerce.number().int().min(10).max(30).optional().or(z.literal("")),
  templeLengthMm: z.coerce.number().int().min(100).max(160).optional().or(z.literal("")),
  lensCompatible: z.string().optional(),
  isActive: z.string().optional(),
  isFeatured: z.string().optional(),
  isNew: z.string().optional(),
  isBestseller: z.string().optional(),
});

export const variantSchema = z.object({
  productId: z.string().min(1),
  colorName: z.string().trim().min(1, "Coloris requis.").max(60),
  colorHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur hexadécimale requise (#RRGGBB)."),
  sku: z.string().trim().min(2, "Référence requise.").max(40),
  price: z.string().trim().optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0).max(9999),
});

export const stockAdjustSchema = z.object({
  variantId: z.string().min(1),
  delta: z.coerce.number().int().refine((v) => v !== 0, "Indiquez un ajustement non nul.").refine((v) => v > -100 && v < 100, "Ajustement trop important."),
  note: z.string().trim().max(200).optional().or(z.literal("")),
});

export const couponAdminSchema = z.object({
  code: z.string().trim().min(3).max(32).transform((v) => v.toUpperCase()),
  description: z.string().trim().max(160).optional().or(z.literal("")),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.coerce.number().int().min(1, "Valeur requise."),
  minSubtotal: z.string().trim().optional().or(z.literal("")),
  startsAt: z.string().trim().optional().or(z.literal("")),
  endsAt: z.string().trim().optional().or(z.literal("")),
  usageLimit: z.coerce.number().int().min(1).optional().or(z.literal("")),
  isActive: z.string().optional(),
});

export const roleSchema = z.object({
  name: z.string().trim().min(2, "Nom requis.").max(60),
  description: z.string().trim().max(200).optional().or(z.literal("")),
  permissions: z.array(z.string()).default([]),
});

export const staffSchema = z.object({
  firstName: name,
  lastName: name,
  email,
  password: z.string().min(8, "8 caractères minimum."),
  roleId: z.string().min(1, "Rôle requis."),
});

export const orderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "IN_PRODUCTION", "SHIPPED", "DELIVERED", "CANCELLED"]),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const faqSchema = z.object({
  question: z.string().trim().min(5, "Question requise.").max(240),
  answer: z.string().trim().min(10, "Réponse requise.").max(4000),
  category: z.string().trim().min(2).max(60),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.string().optional(),
});

export const contentPageSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/, "Slug invalide."),
  title: z.string().trim().min(2).max(160),
  intro: z.string().trim().max(500).optional().or(z.literal("")),
  body: z.string().trim().min(20).max(30000),
  metaDescription: z.string().trim().max(200).optional().or(z.literal("")),
  isPublished: z.string().optional(),
});

export const bannerSchema = z.object({
  key: z.string().trim().min(2).max(40),
  position: z.enum(["home", "about"]).optional(),
  eyebrow: z.string().trim().max(80).optional().or(z.literal("")),
  title: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().max(300).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(300).optional().or(z.literal("")),
  ctaLabel: z.string().trim().max(60).optional().or(z.literal("")),
  ctaHref: z.string().trim().max(300).refine((value) => !value || (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")), "Lien interne requis (ex. /catalogue)."),
  isActive: z.string().optional(),
});

export const collectionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Identifiant invalide."),
  description: z.string().trim().max(3000).optional().or(z.literal("")),
  tagline: z.string().trim().max(160).optional().or(z.literal("")),
  imageUrl: z.string().trim().max(300).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export const lensOptionSchema = z.object({
  id: z.string().min(1),
  price: z.string().trim().min(1),
  isActive: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type PrescriptionInput = z.infer<typeof prescriptionSchema>;
