/** Transitions de statut autorisées pour une commande (paiement à la livraison). */
export const ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["IN_PRODUCTION", "CANCELLED"],
  IN_PRODUCTION: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function allowedTransitions(status: string): string[] {
  return ORDER_TRANSITIONS[status] ?? [];
}
