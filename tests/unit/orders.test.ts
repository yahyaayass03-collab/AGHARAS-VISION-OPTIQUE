import { describe, expect, it } from "vitest";
import { ORDER_TRANSITIONS, allowedTransitions } from "@/lib/orders";

describe("transitions de commande", () => {
  it("démarre par la confirmation ou l'annulation", () => {
    expect(allowedTransitions("PENDING")).toEqual(["CONFIRMED", "CANCELLED"]);
  });

  it("suit le parcours atelier puis livraison", () => {
    expect(allowedTransitions("CONFIRMED")).toEqual([
      "IN_PRODUCTION",
      "CANCELLED",
    ]);
    expect(allowedTransitions("IN_PRODUCTION")).toEqual(["SHIPPED", "CANCELLED"]);
    expect(allowedTransitions("SHIPPED")).toEqual(["DELIVERED"]);
  });

  it("rend les statuts finaux immuables", () => {
    expect(allowedTransitions("DELIVERED")).toEqual([]);
    expect(allowedTransitions("CANCELLED")).toEqual([]);
  });

  it("interdit une expédition non payée à la livraison d'être annulée", () => {
    expect(allowedTransitions("SHIPPED")).not.toContain("CANCELLED");
  });

  it("retourne un tableau vide pour un statut inconnu", () => {
    expect(allowedTransitions("UNKNOWN")).toEqual([]);
    expect(ORDER_TRANSITIONS.UNKNOWN).toBeUndefined();
  });
});
