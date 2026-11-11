"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "recommended", label: "Recommandés" },
  { value: "price-asc", label: "Prix croissant (DH)" },
  { value: "price-desc", label: "Prix décroissant (DH)" },
  { value: "newest", label: "Nouveautés" },
  { value: "name", label: "Ordre alphabétique" },
];

export function CatalogSort({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "recommended") params.delete("sort");
    else params.set("sort", next);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.1em] text-on-surface-variant">
      <span className="hidden sm:inline">Trier</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-outline-variant bg-white px-3 py-2 text-[0.75rem] text-primary focus:border-primary"
        aria-label="Trier les résultats"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
