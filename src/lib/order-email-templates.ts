import { formatDH } from "@/lib/money";
import { formatDateTimeFr } from "@/lib/utils";

export type OrderEmailDetails = {
  id: string;
  reference: string;
  createdAt: Date;
  totalCents: number;
  paymentMethod: string;
  shippingMethodName: string;
  city: string;
  items: Array<{
    productName: string;
    variantName: string | null;
    quantity: number;
    lineTotalCents: number;
  }>;
};

export type StoreEmailContact = {
  name: string;
  email: string;
  phone: string;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function itemLines(order: OrderEmailDetails): string[] {
  return order.items.map((item) =>
    `- ${item.productName}${item.variantName ? ` — ${item.variantName}` : ""} × ${item.quantity} : ${formatDH(item.lineTotalCents)}`,
  );
}

function htmlList(lines: string[]): string {
  return `<ul>${lines.map((line) => `<li>${escapeHtml(line.slice(2))}</li>`).join("")}</ul>`;
}

export function ownerOrderEmail(order: OrderEmailDetails, recipient: string, adminUrl?: string) {
  const date = formatDateTimeFr(order.createdAt);
  const items = itemLines(order);
  const manageText = adminUrl ? `\nGérer cette commande : ${adminUrl}` : "\nConnectez-vous à l'administration pour gérer cette commande.";
  return {
    to: recipient,
    subject: `Nouvelle commande ${order.reference}`,
    text: [
      `Nouvelle commande reçue — ${order.reference}`,
      `Date : ${date}`,
      "Articles :",
      ...items,
      `Total : ${formatDH(order.totalCents)}`,
      `Règlement : ${order.paymentMethod === "CASH_ON_DELIVERY" ? "Paiement à la livraison" : "À vérifier dans l'administration"}`,
      manageText,
    ].join("\n"),
    html: `<h1>Nouvelle commande reçue</h1><p>Référence : <strong>${escapeHtml(order.reference)}</strong></p><p>Date : ${escapeHtml(date)}</p>${htmlList(items)}<p>Total : <strong>${escapeHtml(formatDH(order.totalCents))}</strong></p><p>Règlement : ${order.paymentMethod === "CASH_ON_DELIVERY" ? "Paiement à la livraison" : "À vérifier dans l'administration"}</p>${adminUrl ? `<p><a href="${escapeHtml(adminUrl)}">Gérer la commande</a></p>` : "<p>Connectez-vous à l'administration pour gérer cette commande.</p>"}`,
  };
}

export function customerOrderConfirmationEmail(order: OrderEmailDetails, recipient: string, store: StoreEmailContact) {
  const items = itemLines(order);
  const contactLines = [store.email && `E-mail : ${store.email}`, store.phone && `Téléphone : ${store.phone}`].filter(Boolean) as string[];
  const itemList = htmlList(items);
  return {
    to: recipient,
    subject: `Réception de votre commande ${order.reference}`,
    text: [
      `Bonjour, nous avons bien reçu votre commande ${order.reference}.`,
      "Ce message confirme uniquement la réception de votre demande. Il ne vaut ni validation professionnelle de l'ordonnance ou de la compatibilité optique, ni confirmation de préparation ou d'expédition. L'équipe vous recontactera pour les prochaines étapes.",
      "",
      "Récapitulatif :",
      ...items,
      `Total : ${formatDH(order.totalCents)}`,
      `Mode de livraison choisi : ${order.shippingMethodName}`,
      `Ville de livraison : ${order.city}`,
      "Les modalités et délais seront confirmés séparément ; aucune date d'expédition n'est promise par ce message.",
      "",
      store.name,
      ...contactLines,
      "Aucune ordonnance ni donnée de correction n'est jointe à cet e-mail.",
    ].join("\n"),
    html: `<h1>Commande reçue</h1><p>Bonjour, nous avons bien reçu votre commande <strong>${escapeHtml(order.reference)}</strong>.</p><p>Ce message confirme uniquement la réception de votre demande. Il ne vaut ni validation professionnelle de l'ordonnance ou de la compatibilité optique, ni confirmation de préparation ou d'expédition. L'équipe vous recontactera pour les prochaines étapes.</p><h2>Récapitulatif</h2>${itemList}<p>Total : <strong>${escapeHtml(formatDH(order.totalCents))}</strong></p><p>Mode de livraison choisi : ${escapeHtml(order.shippingMethodName)}<br>Ville : ${escapeHtml(order.city)}</p><p>Les modalités et délais seront confirmés séparément ; aucune date d'expédition n'est promise.</p><hr><p>${escapeHtml(store.name)}<br>${contactLines.map(escapeHtml).join("<br>")}</p><p>Aucune ordonnance ni donnée de correction n'est jointe à cet e-mail.</p>`,
  };
}
