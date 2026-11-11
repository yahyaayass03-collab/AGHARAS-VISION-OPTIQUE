import { describe, expect, it } from "vitest";
import {
  addressSchema,
  checkoutSchema,
  contentPageSchema,
  normalizePhone,
  prescriptionSchema,
  loginSchema,
  collectionSchema,
} from "@/lib/validation";

describe("normalizePhone", () => {
  it("retire espaces, points et tirets", () => {
    expect(normalizePhone("06 12 34 56 78")).toBe("0612345678");
    expect(normalizePhone("+212.6-12-34-56-78")).toBe("+212612345678");
  });
});

describe("connexion propriétaire et données de catalogue", () => {
  const valid = {
    email: "SALMA@Example.MA",
    password: "Synthetic!Secure1",
  };

  it("normalise l'e-mail de connexion", () => {
    const parsed = loginSchema.parse(valid);
    expect(parsed.email).toBe("salma@example.ma");
  });

  it("refuse une connexion sans mot de passe", () => {
    expect(loginSchema.safeParse({ ...valid, password: "" }).success).toBe(false);
  });

  it("refuse un identifiant de collection contenant des caractères dangereux", () => {
    const collection = { name: "Collection test", slug: "collection-test", sortOrder: 1 };
    expect(collectionSchema.safeParse(collection).success).toBe(true);
    expect(
      collectionSchema.safeParse({ ...collection, slug: "javascript:alert(1)" }).success,
    ).toBe(false);
  });

  it("refuse une adresse e-mail malformée", () => {
    expect(
      loginSchema.safeParse({ ...valid, email: "mauvaise-adresse" }).success,
    ).toBe(false);
  });
});

describe("ordonnance", () => {
  it("accepte une saisie manuelle cohérente", () => {
    const parsed = prescriptionSchema.safeParse({
      method: "MANUAL",
      rightSphere: "-2.25",
      rightCylinder: "-1.00",
      rightAxis: "90",
      leftSphere: "0.50",
      consent: "on",
    });
    expect(parsed.success).toBe(true);
  });

  it("accepte des mesures client sans Addition ni EP et sans jugement clinique", () => {
    const parsed = prescriptionSchema.safeParse({
      method: "MANUAL",
      rightSphere: "-25.00",
      rightCylinder: "-4.00",
      rightAxis: "240",
      leftSphere: "8.00",
      leftAxis: "-10",
    });
    expect(parsed.success).toBe(true);
  });

  it("conserve l'axe optionnel sans exiger une cohérence clinique", () => {
    const parsed = prescriptionSchema.safeParse({
      method: "MANUAL",
      rightSphere: "-2.25",
      rightCylinder: "-1.00",
    });
    expect(parsed.success).toBe(true);
  });

  it("exige au moins une mesure en saisie manuelle", () => {
    expect(
      prescriptionSchema.safeParse({ method: "MANUAL" }).success,
    ).toBe(false);
  });

  it("accepte les centièmes et ignore les anciens champs Addition et EP", () => {
    const parsed = prescriptionSchema.parse({
      method: "MANUAL",
      rightSphere: "-2.30",
      rightAdd: "2.00",
      leftAdd: "2.00",
      pupillaryDistance: "64",
    });
    expect(parsed.rightSphere).toBe(-2.3);
    expect(parsed).not.toHaveProperty("rightAdd");
    expect(parsed).not.toHaveProperty("leftAdd");
    expect(parsed).not.toHaveProperty("pupillaryDistance");
  });

  it("conserve les limites techniques de stockage et le typage numérique", () => {
    expect(prescriptionSchema.safeParse({ method: "MANUAL", rightSphere: "1000" }).success).toBe(false);
    expect(prescriptionSchema.safeParse({ method: "MANUAL", rightSphere: "NaN" }).success).toBe(false);
  });

  it("accepte un dépôt sans mesure", () => {
    expect(
      prescriptionSchema.safeParse({ method: "UPLOAD" }).success,
    ).toBe(true);
  });
});

describe("adresse", () => {
  it("valide une adresse marocaine", () => {
    expect(
      addressSchema.safeParse({
        label: "Domicile",
        firstName: "Youssef",
        lastName: "Alaoui",
        phone: "+212612345678",
        line1: "12 rue des Orangers",
        city: "Casablanca",
        postalCode: "20250",
      }).success,
    ).toBe(true);
  });

  it("refuse un code postal mal formé", () => {
    expect(
      addressSchema.safeParse({
        label: "Domicile",
        firstName: "Youssef",
        lastName: "Alaoui",
        phone: "0612345678",
        line1: "12 rue des Orangers",
        city: "Casablanca",
        postalCode: "7500",
      }).success,
    ).toBe(false);
  });
});

describe("checkout", () => {
  const valid = {
    firstName: "Nadia",
    lastName: "El Fassi",
    email: "nadia@example.ma",
    phone: "0612345678",
    addressLine1: "45 avenue Hassan II",
    city: "Rabat",
    shippingCode: "standard",
    paymentMethod: "CASH_ON_DELIVERY" as const,
    acceptTerms: "on" as const,
    idempotencyKey: "6f4a1e3c-6f4d-4d5a-9c2b-1a2b3c4d5e6f",
  };

  it("accepte une commande COD complète", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it("refuse le paiement en ligne", () => {
    expect(
      checkoutSchema.safeParse({ ...valid, paymentMethod: "CMI" }).success,
    ).toBe(false);
  });

  it("exige l'acceptation des CGV et une clé d'idempotence UUID", () => {
    expect(
      checkoutSchema.safeParse({ ...valid, acceptTerms: undefined as never }).success,
    ).toBe(false);
    expect(
      checkoutSchema.safeParse({ ...valid, idempotencyKey: "abc" }).success,
    ).toBe(false);
  });
});

describe("page de contenu", () => {
  it("n'autorise que des slugs sûrs", () => {
    expect(
      contentPageSchema.safeParse({
        slug: "mentions-legales",
        title: "Mentions légales",
        body: "Un contenu suffisamment long pour être valide.",
      }).success,
    ).toBe(true);
    expect(
      contentPageSchema.safeParse({
        slug: "Mentions Légales",
        title: "Mentions légales",
        body: "Un contenu suffisamment long pour être valide.",
      }).success,
    ).toBe(false);
    expect(
      contentPageSchema.safeParse({
        slug: "../admin",
        title: "Intrusion",
        body: "Un contenu suffisamment long pour être valide.",
      }).success,
    ).toBe(false);
  });
});
