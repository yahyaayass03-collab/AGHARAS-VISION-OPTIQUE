/**
 * Coordonnées WhatsApp publiques.
 *
 * La valeur enregistrée dans les réglages de la boutique (`store.whatsapp`)
 * reste la source autoritaire. Ce module ne fait que normaliser cette valeur
 * pour construire des liens `wa.me` cohérents, y compris pour les composants
 * clients qui ne peuvent pas lire les réglages côté serveur.
 */
export const OFFICIAL_WHATSAPP_NUMBER = "+212 628-889950";
export const OFFICIAL_WHATSAPP_DIGITS = "212628889950";

/** Messages contextuels en français, sans donnée personnelle ni ordonnance. */
export const WHATSAPP_MESSAGES = {
  general:
    "Bonjour, je souhaite échanger avec AGHARAS VISION.",
  product: (name: string) =>
    `Bonjour, je souhaite obtenir des informations sur ce produit : ${name}.`,
  optical: "Bonjour, j'ai besoin d'aide pour choisir mes verres.",
  compatibility:
    "Bonjour, j'ai besoin d'aide concernant la compatibilité de ma monture et de mes verres.",
  cart: "Bonjour, j'ai besoin d'aide pour finaliser mon panier.",
  checkout: "Bonjour, j'ai besoin d'aide pour ma commande.",
  order: "Bonjour, je vous contacte au sujet de ma commande.",
  appointment: "Bonjour, je souhaite prendre rendez-vous en salon.",
  faq: "Bonjour, j'ai une question.",
  content: "Bonjour, j'aimerais obtenir des informations.",
} as const;

/**
 * Convertit un numéro saisi par le propriétaire en format international sans
 * indicatif `+` (format attendu par `wa.me`). Un numéro marocain local commençant
 * par 0 est préfixé par 212. Une valeur absente retombe sur le numéro officiel.
 */
export function whatsappDigits(value?: string | null): string {
  let digits = (value ?? "").replace(/\D/g, "");
  if (!digits) return OFFICIAL_WHATSAPP_DIGITS;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) {
    digits = `212${digits.slice(1)}`;
  }
  return digits;
}

export function whatsappDisplay(value?: string | null): string {
  return value?.trim() || OFFICIAL_WHATSAPP_NUMBER;
}

export function isValidWhatsAppNumber(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (!/^[+\d\s().-]+$/.test(trimmed)) return false;
  const digits = whatsappDigits(trimmed);
  return digits.length >= 8 && digits.length <= 15;
}

export function whatsappHref(
  value: string | null | undefined,
  message?: string,
): string {
  const base = `https://wa.me/${whatsappDigits(value)}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
