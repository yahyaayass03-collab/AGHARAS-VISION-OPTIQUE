import { describe, expect, it } from "vitest";
import {
  formatDateFr,
  initials,
  orderReferenceShort,
  pluralize,
  slugify,
} from "@/lib/utils";

describe("initials", () => {
  it("compose les initiales en majuscules", () => {
    expect(initials("salma", "benali")).toBe("SB");
  });
});

describe("slugify", () => {
  it("produit un slug sans accents", () => {
    expect(slugify("L'Hivernal Écaille Classique")).toBe(
      "l-hivernal-ecaille-classique",
    );
    expect(slugify("  Titane & Or  ")).toBe("titane-or");
  });
});

describe("formatDateFr", () => {
  it("formate en français", () => {
    expect(formatDateFr(new Date("2026-01-15T12:00:00Z"))).toBe("15 janvier 2026");
  });
});

describe("pluralize", () => {
  it("accorde le libellé avec une espace insécable", () => {
    expect(pluralize(1, "commande")).toBe("1\u00A0commande");
    expect(pluralize(3, "commande")).toBe("3\u00A0commandes");
    expect(pluralize(0, "article", "articles")).toBe("0\u00A0article");
  });
});

describe("orderReferenceShort", () => {
  it("retire le préfixe AVO-", () => {
    expect(orderReferenceShort("AVO-2026-0001")).toBe("2026-0001");
    expect(orderReferenceShort("2026-0001")).toBe("2026-0001");
  });
});
