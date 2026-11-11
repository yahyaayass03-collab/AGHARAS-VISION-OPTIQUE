import { describe, expect, it } from "vitest";
import { featuredCategoryIds, homeSectionOrder, HOME_SECTIONS } from "@/lib/home-layout";

describe("configuration de l'accueil", () => {
  it("conserve un ordre valide", () => {
    const order = HOME_SECTIONS.map(([key]) => key).reverse();
    expect(homeSectionOrder(JSON.stringify(order))).toEqual(order);
  });
  it("rejette les doublons et éléments inconnus", () => {
    const defaults = HOME_SECTIONS.map(([key]) => key);
    expect(homeSectionOrder(JSON.stringify(defaults.map(() => "hero")))).toEqual(defaults);
    expect(homeSectionOrder('["inconnu"]')).toEqual(defaults);
  });
  it("distingue une sélection vide et une configuration absente", () => {
    expect(featuredCategoryIds("[]")).toEqual([]);
    expect(featuredCategoryIds(undefined)).toBeNull();
    expect(featuredCategoryIds('["a","a"]')).toBeNull();
  });
});
