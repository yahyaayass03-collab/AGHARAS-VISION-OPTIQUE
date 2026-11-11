import { describe, expect, it } from "vitest";
import {
  OFFICIAL_WHATSAPP_DIGITS,
  OFFICIAL_WHATSAPP_NUMBER,
  WHATSAPP_MESSAGES,
  isValidWhatsAppNumber,
  whatsappDigits,
  whatsappDisplay,
  whatsappHref,
} from "@/lib/whatsapp";

describe("coordonnées WhatsApp", () => {
  it("normalise les formats international, local et 00 vers wa.me", () => {
    expect(whatsappDigits(OFFICIAL_WHATSAPP_NUMBER)).toBe(OFFICIAL_WHATSAPP_DIGITS);
    expect(whatsappDigits("+212 628-889950")).toBe("212628889950");
    expect(whatsappDigits("0628889950")).toBe("212628889950");
    expect(whatsappDigits("00212628889950")).toBe("212628889950");
    expect(whatsappDigits("212628889950")).toBe("212628889950");
  });

  it("retombe sur le numéro officiel si la valeur est absente", () => {
    expect(whatsappDigits("")).toBe(OFFICIAL_WHATSAPP_DIGITS);
    expect(whatsappDigits(null)).toBe(OFFICIAL_WHATSAPP_DIGITS);
    expect(whatsappDisplay("")).toBe(OFFICIAL_WHATSAPP_NUMBER);
  });

  it("construit une URL wa.me valide et encode le message", () => {
    const message = "Bonjour, j'ai besoin d'aide.";
    const href = whatsappHref("+212 628-889950", message);
    expect(href.startsWith("https://wa.me/212628889950?text=")).toBe(true);
    expect(new URL(href).searchParams.get("text")).toBe(message);
    expect(href).not.toContain("+212");
    expect(() => new URL(href)).not.toThrow();
  });

  it("accepte uniquement les numéros plausibles saisis par le propriétaire", () => {
    expect(isValidWhatsAppNumber("+212 628-889950")).toBe(true);
    expect(isValidWhatsAppNumber("0628889950")).toBe(true);
    expect(isValidWhatsAppNumber("abc@example.com")).toBe(false);
  });

  it("prépare des messages sans valeur d'ordonnance ni donnée client", () => {
    const messages = Object.values(WHATSAPP_MESSAGES).map((entry) =>
      typeof entry === "function" ? entry("Le Marais N°04") : entry,
    );
    for (const message of messages) {
      expect(message).not.toMatch(/sphere|cylindre|axe|addition|ordonnance\s*:/i);
      expect(message).not.toMatch(/\b0[5-7]\d{8}\b/);
    }
  });
});
