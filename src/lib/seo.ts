/** Remove historic/current brand suffixes before Next's metadata template adds the CMS name. */
export function withoutBrandTitleSuffix(title: string, brandName: string): string {
  const suffixes = ["AGHARAS VISION OPTIQUE", brandName]
    .filter(Boolean)
    .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (suffixes.length === 0) return title.trim();

  const suffixPattern = new RegExp(`\\s*[|—–-]\\s*(?:${suffixes.join("|")})\\s*$`, "i");
  let result = title.trim();
  while (suffixPattern.test(result)) result = result.replace(suffixPattern, "").trim();
  return result;
}
