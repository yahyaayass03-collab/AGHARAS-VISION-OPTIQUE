/**
 * Représentation monétaire autoritative : entiers en centimes de dirham.
 * 1 DH = 100 centimes. Aucun calcul monétaire en flottant.
 */

const NBSP = "\u00A0";

export function formatDH(cents: number): string {
  const safe = Math.max(0, Math.round(cents));
  const units = Math.floor(safe / 100);
  const rest = safe % 100;
  const grouped = units.toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return rest === 0
    ? `${grouped}${NBSP}DH`
    : `${grouped},${rest.toString().padStart(2, "0")}${NBSP}DH`;
}

/** Convertit une saisie utilisateur (« 1 850,50 », « 1850.5 ») en centimes. */
export function parseDHToCents(input: string): number | null {
  const normalized = input
    .replace(/\s|\u00A0|\u202F/g, "")
    .replace(/DH|MAD/gi, "")
    .replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
