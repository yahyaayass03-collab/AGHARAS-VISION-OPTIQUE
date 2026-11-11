import type { Metadata } from "next";
import { CatalogView } from "@/components/site/CatalogView";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue — montures optiques & solaires",
  description:
    "Explorez les montures d’AGHARAS VISION : optiques, solaires, clips 2-en-1, lentilles et accessoires. Filtrez par forme, marque, genre et budget.",
  alternates: { canonical: "/catalogue" },
};

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <CatalogView searchParams={await searchParams} />;
}
