import { describe, expect, it } from "vitest";
import {
  hasPlaceholders,
  parseContent,
  slugifyHeading,
  splitEmphasis,
} from "@/lib/content";

describe("slugifyHeading", () => {
  it("normalise accents et ponctuation", () => {
    expect(slugifyHeading("Livraison & retours")).toBe("livraison-et-retours");
    expect(slugifyHeading("Précision réfractive")).toBe("precision-refractive");
    expect(slugifyHeading("  —  ")).toBe("");
  });
});

describe("parseContent", () => {
  const body = [
    "Chapeau introductif.",
    "",
    "## Première section",
    "",
    "Un paragraphe",
    "sur deux lignes.",
    "",
    "- Point un",
    "- Point deux",
    "",
    "> Encadré important",
    "",
    "### Sous-section",
    "",
    "Texte final.",
    "",
    "## Première section",
  ].join("\n");

  it("sépare l'introduction des sections", () => {
    const parsed = parseContent(body);
    expect(parsed.intro).toEqual([
      { kind: "paragraph", text: "Chapeau introductif." },
    ]);
    expect(parsed.sections).toHaveLength(2);
    expect(parsed.sections[0]?.title).toBe("Première section");
    expect(parsed.sections[1]?.title).toBe("Première section");
  });

  it("génère un sommaire avec des ancres uniques", () => {
    const parsed = parseContent(body);
    expect(parsed.toc).toEqual([
      { id: "premiere-section", title: "Première section" },
      { id: "premiere-section-2", title: "Première section" },
    ]);
  });

  it("analyse paragraphes, listes, encadrés et sous-titres", () => {
    const parsed = parseContent(body);
    const blocks = parsed.sections[0]?.blocks ?? [];
    expect(blocks).toContainEqual({
      kind: "paragraph",
      text: "Un paragraphe sur deux lignes.",
    });
    expect(blocks).toContainEqual({
      kind: "list",
      items: ["Point un", "Point deux"],
    });
    expect(blocks).toContainEqual({
      kind: "note",
      text: "Encadré important",
    });
    expect(blocks).toContainEqual({
      kind: "heading",
      level: 3,
      id: "sous-section",
      text: "Sous-section",
    });
  });

  it("traite un contenu vide sans erreur", () => {
    expect(parseContent("")).toEqual({ intro: [], sections: [], toc: [] });
  });

  it("conserve le texte brut, y compris les chevrons HTML (rendu React échappé)", () => {
    const parsed = parseContent("## Titre\n\n<script>alert(1)</script>");
    expect(parsed.sections[0]?.blocks[0]).toEqual({
      kind: "paragraph",
      text: "<script>alert(1)</script>",
    });
  });
});

describe("splitEmphasis", () => {
  it("découpe les segments en gras", () => {
    expect(splitEmphasis("Avant **fort** après")).toEqual([
      { bold: false, value: "Avant " },
      { bold: true, value: "fort" },
      { bold: false, value: " après" },
    ]);
  });

  it("ne modifie pas un texte sans emphase", () => {
    expect(splitEmphasis("Texte simple")).toEqual([
      { bold: false, value: "Texte simple" },
    ]);
  });

  it("gère les astérisques non appariés", () => {
    expect(splitEmphasis("2 * 3 = 6")).toEqual([
      { bold: false, value: "2 * 3 = 6" },
    ]);
  });
});

describe("hasPlaceholders", () => {
  it("détecte les mentions à compléter", () => {
    expect(hasPlaceholders("ICE : À RENSEIGNER")).toBe(true);
    expect(hasPlaceholders("Valeur placeholder")).toBe(true);
    expect(hasPlaceholders("Texte définitif")).toBe(false);
  });
});
