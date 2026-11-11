/**
 * Analyseur de contenu éditorial.
 *
 * Les pages légales et institutionnelles sont stockées en texte brut dans la
 * table `ContentPage`. Ce module transforme ce texte en blocs typés, rendus en
 * React (aucun `dangerouslySetInnerHTML`). Grammaire supportée, volontairement
 * minimale :
 *
 * - `## Titre`      → section de niveau 2 (entrée de sommaire)
 * - `### Titre`     → sous-section de niveau 3
 * - `- élément`     → liste à puces
 * - `> remarque`    → encart de mise en garde
 * - ligne vide      → séparation des paragraphes
 * - `**important**` → mise en emphase dans le texte
 */

export type ContentBlock =
  | { kind: "heading"; level: 2 | 3; id: string; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "note"; text: string };

export type ContentSection = {
  id: string;
  title: string;
  blocks: ContentBlock[];
};

export type ParsedContent = {
  intro: ContentBlock[];
  sections: ContentSection[];
  toc: Array<{ id: string; title: string }>;
};

/** Transforme un titre en identifiant d'ancre stable et lisible. */
export function slugifyHeading(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function parseContent(body: string): ParsedContent {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const intro: ContentBlock[] = [];
  const sections: ContentSection[] = [];
  const usedIds = new Set<string>();

  let currentSection: ContentSection | null = null;
  let paragraph: string[] = [];
  let list: string[] = [];

  const target = () => (currentSection ? currentSection.blocks : intro);

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    target().push({ kind: "paragraph", text: paragraph.join(" ").trim() });
    paragraph = [];
  };

  const flushList = () => {
    if (list.length === 0) return;
    target().push({ kind: "list", items: [...list] });
    list = [];
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  const uniqueId = (base: string) => {
    const fallback = "section";
    const root = base || fallback;
    let id = root;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${root}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    return id;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushAll();
      continue;
    }

    if (line.startsWith("### ")) {
      flushAll();
      const text = line.slice(4).trim();
      target().push({ kind: "heading", level: 3, id: uniqueId(slugifyHeading(text)), text });
      continue;
    }

    if (line.startsWith("## ")) {
      flushAll();
      const text = line.slice(3).trim();
      const id = uniqueId(slugifyHeading(text));
      currentSection = { id, title: text, blocks: [] };
      sections.push(currentSection);
      continue;
    }

    if (line.startsWith("- ")) {
      flushParagraph();
      list.push(line.slice(2).trim());
      continue;
    }

    if (line.startsWith("> ")) {
      flushAll();
      target().push({ kind: "note", text: line.slice(2).trim() });
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushAll();

  return {
    intro,
    sections,
    toc: sections.map((section) => ({ id: section.id, title: section.title })),
  };
}

/** Découpe un texte en segments `fort` / normal pour un rendu React sûr. */
export function splitEmphasis(text: string): Array<{ bold: boolean; value: string }> {
  const parts: Array<{ bold: boolean; value: string }> = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ bold: false, value: text.slice(lastIndex, match.index) });
    }
    parts.push({ bold: true, value: match[1] ?? "" });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ bold: false, value: text.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ bold: false, value: text }];
}

/** Vrai si le document contient des mentions restant à compléter. */
export function hasPlaceholders(body: string): boolean {
  return /À RENSEIGNER|placeholder/i.test(body);
}
