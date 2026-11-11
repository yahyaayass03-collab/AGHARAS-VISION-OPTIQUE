export const HOME_SECTIONS = [
  ["hero", "Bannière principale"],
  ["banners", "Bannières complémentaires"],
  ["categories", "Catégories mises en avant"],
  ["products", "Sélection de produits"],
  ["optical", "Services optiques"],
  ["promotion", "Offre promotionnelle"],
  ["trust", "Engagements"],
  ["newsletter", "Newsletter"],
] as const;
export type HomeSection = (typeof HOME_SECTIONS)[number][0];

export function homeSectionOrder(value: string | undefined): HomeSection[] {
  const defaults = HOME_SECTIONS.map(([id]) => id);
  try {
    const parsed: unknown = JSON.parse(value ?? "null");
    if (!Array.isArray(parsed) || parsed.length !== defaults.length ||
        new Set(parsed).size !== defaults.length || !parsed.every((id) => defaults.includes(id))) return defaults;
    return parsed as HomeSection[];
  } catch { return defaults; }
}

export function featuredCategoryIds(value: string | undefined): string[] | null {
  if (value === undefined) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) && parsed.every((id) => typeof id === "string") && new Set(parsed).size === parsed.length ? parsed : null;
  } catch { return null; }
}
