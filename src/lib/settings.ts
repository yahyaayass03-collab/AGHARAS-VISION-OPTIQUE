import "server-only";

import { cache } from "react";
import { db } from "@/lib/db";

export const DEFAULT_SETTINGS = {
  "store.name": "AGHARAS VISION",
  "store.legal_name": "Agharas Vision SARL AU — démonstration",
  "store.logo_url": "/images/brand/agharass-vision-logo-header.webp",
  "store.email": "contact@agharas-optique.ma",
  "store.phone": "+212 5 22 00 00 00",
  "store.whatsapp": "+212 628-889950",
  "store.address": "N° 13 Imm 08 , Lot 4 Al kheir,Cité Essalam,AGADIR",
  "store.city": "Agadir",
  "store.hours": "Lundi – Samedi : 09h30 – 19h30",
  "site.announcement": "Découvrez notre collection de montures et verres de précision",
  "home.categories_visible": "true",
  "home.featured_visible": "true",
  "home.optical_visible": "true",
  "home.trust_visible": "true",
  "home.announcement_visible": "true",
  "site.footer_text": "Maison d'optique indépendante. Découvrez notre sélection de montures et de verres de précision.",
  "social.instagram": "",
  "social.facebook": "",
  "social.pinterest": "",
  "social.linkedin": "",
  "store.ice": "À RENSEIGNER (ICE)",
  "store.rc": "À RENSEIGNER (RC)",
  "store.if": "À RENSEIGNER (IF)",
  "store.patente": "À RENSEIGNER (Patente)",
  "store.cnss": "À RENSEIGNER (agrément CNSS/CNOPS)",
  "store.cndp": "À RENSEIGNER (autorisation CNDP)",
  "payment.cod_enabled": "true",
  "payment.online_enabled": "false",
  "payment.online_notice":
    "Paiement en ligne indisponible : aucune passerelle CMI n'est configurée.",
  "shipping.free_threshold": "80000",
  "order.prescription_required": "false",
  "order.owner_email_enabled": "true",
  "order.customer_confirmation_enabled": "false",
  "order.confirmation_notice":
    "Notre équipe vous contacte par téléphone ou WhatsApp pour confirmer votre commande.",
  "seo.default_title": "AGHARAS VISION | Optique au Maroc",
  "seo.default_description":
    "Découvrez notre sélection de montures et les options disponibles.",
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

export const getSettings = cache(async (): Promise<Record<string, string>> => {
  try {
    const rows = await db.setting.findMany();
    const map: Record<string, string> = { ...DEFAULT_SETTINGS };
    for (const row of rows) map[row.key] = row.value;
    return map;
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
});

export function settingBoolean(
  settings: Record<string, string>,
  key: string,
): boolean {
  return settings[key] === "true";
}
