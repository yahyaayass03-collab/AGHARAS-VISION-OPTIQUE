export const SITE = {
  name: "AGHARAS VISION",
  shortName: "AGHARAS VISION",
  tagline: "Haute Lunetterie",
  description:
    "Découvrez notre sélection de montures et les options de verres disponibles.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "+212628889950",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "contact@agharas-optique.ma",
  currency: "MAD",
  locale: "fr-MA",
} as const;

export const NAV_LINKS = [
  { label: "Femme", href: "/catalogue/femme" },
  { label: "Homme", href: "/catalogue/homme" },
  { label: "Solaires", href: "/catalogue/solaires" },
  { label: "2-en-1", href: "/catalogue/clips-2-en-1" },
  { label: "Lentilles", href: "/catalogue/lentilles" },
  { label: "Accessoires", href: "/catalogue/accessoires" },
] as const;

export const CITIES = [
  "Casablanca",
  "Rabat",
  "Salé",
  "Marrakech",
  "Tanger",
  "Fès",
  "Agadir",
  "Meknès",
  "Kénitra",
  "Oujda",
  "Tétouan",
  "Autre ville",
] as const;

export const LOW_STOCK_THRESHOLD = 3;

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  OPTICAL: "Lunettes de vue",
  SUNGLASSES: "Solaires",
  CLIP: "Clips 2-en-1",
  CONTACT_LENS: "Lentilles",
  ACCESSORY: "Accessoires",
};

export const GENDER_LABELS: Record<string, string> = {
  FEMME: "Femme",
  HOMME: "Homme",
  MIXTE: "Mixte",
  ENFANT: "Enfant",
};

export const SHAPE_LABELS: Record<string, string> = {
  PANTOS: "Pantos",
  RONDE: "Ronde",
  RECTANGULAIRE: "Rectangulaire",
  PAPILLON: "Papillon / Cat-eye",
  CERCLEE: "Cerclée",
  PERCEE: "Percée (Rimless)",
  AUTRE: "Autre",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente de confirmation",
  CONFIRMED: "Confirmée",
  IN_PRODUCTION: "En préparation à l'atelier",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH_ON_DELIVERY: "Paiement à la livraison",
  CARD_ONLINE: "Carte bancaire en ligne",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  PAID: "Payé",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
};

export const PRESCRIPTION_METHOD_LABELS: Record<string, string> = {
  UPLOAD: "Ordonnance téléversée",
  MANUAL: "Saisie manuelle",
  WHATSAPP: "Transmission WhatsApp",
  LATER: "Transmission ultérieure",
};

export const PRESCRIPTION_STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  RECEIVED: "Reçue",
  VERIFIED: "Vérifiée",
  REJECTED: "Refusée",
};
