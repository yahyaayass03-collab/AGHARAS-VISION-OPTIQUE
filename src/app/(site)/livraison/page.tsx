import type { Metadata } from "next";
import { ContentArticle } from "@/components/site/ContentArticle";
import { contentMetadata } from "@/lib/content-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return contentMetadata({
    slug: "livraison",
    fallbackTitle: "Livraison & expédition",
    description:
      "Délais de préparation, modes de livraison au Maroc, suivi et adresse de livraison pour vos commandes AGHARAS VISION.",
    canonical: "/livraison",
  });
}

export default function LivraisonPage() {
  return <ContentArticle slug="livraison" />;
}
