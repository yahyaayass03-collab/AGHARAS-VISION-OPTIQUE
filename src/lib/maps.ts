export function googleMapsAddressHref(address: string, city = "Agadir"): string {
  const query = [address, city, "Maroc"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
