/** Read JSON-backed Prisma list columns without trusting malformed stored data. */
export function jsonStringList(value: unknown): string[] {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) return [];
  return value as string[];
}
