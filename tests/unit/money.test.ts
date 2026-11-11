import { describe, expect, it } from "vitest";
import { centsToInput, formatDH, parseDHToCents } from "@/lib/money";

const NBSP = "\u00A0";

describe("formatDH", () => {
  it("affiche les montants ronds en dirhams avec espaces insécables", () => {
    expect(formatDH(0)).toBe(`0${NBSP}DH`);
    expect(formatDH(100)).toBe(`1${NBSP}DH`);
    expect(formatDH(185_000)).toBe(`1${NBSP}850${NBSP}DH`);
    expect(formatDH(1_234_567_00)).toBe(
      `1${NBSP}234${NBSP}567${NBSP}DH`,
    );
  });

  it("affiche les centimes avec une virgule", () => {
    expect(formatDH(185_050)).toBe(`1${NBSP}850,50${NBSP}DH`);
    expect(formatDH(99)).toBe(`0,99${NBSP}DH`);
    expect(formatDH(1_000_005)).toBe(`10${NBSP}000,05${NBSP}DH`);
  });

  it("neutralise les valeurs négatives ou non entières", () => {
    expect(formatDH(-500)).toBe(`0${NBSP}DH`);
    expect(formatDH(100.6)).toBe(`1,01${NBSP}DH`);
  });
});

describe("parseDHToCents", () => {
  it("accepte les formats français et anglais", () => {
    expect(parseDHToCents("1 850")).toBe(185_000);
    expect(parseDHToCents("1 850,50")).toBe(185_050);
    expect(parseDHToCents("1850.5")).toBe(185_050);
    expect(parseDHToCents("1850,5 DH")).toBe(185_050);
    expect(parseDHToCents("0")).toBe(0);
  });

  it("refuse les saisies invalides", () => {
    expect(parseDHToCents("")).toBeNull();
    expect(parseDHToCents("abc")).toBeNull();
    expect(parseDHToCents("12,345")).toBeNull();
    expect(parseDHToCents("1.2.3")).toBeNull();
  });

  it("accepte les montants négatifs (utile aux remboursements)", () => {
    expect(parseDHToCents("-10")).toBe(-1_000);
  });
});

describe("centsToInput", () => {
  it("produit une valeur éditable en dirhams", () => {
    expect(centsToInput(185_050)).toBe("1850.50");
    expect(centsToInput(0)).toBe("0.00");
  });
});
