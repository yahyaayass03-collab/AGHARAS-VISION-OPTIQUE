import type { Metadata } from "next";
import { ContentArticle } from "@/components/site/ContentArticle";
import { contentMetadata } from "@/lib/content-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return contentMetadata({
    slug: "confidentialite",
    fallbackTitle: "Politique de confidentialité",
    description:
      "Données collectées, conservation privée des ordonnances, finalités et exercice de vos droits chez AGHARAS VISION.",
    canonical: "/confidentialite",
  });
}

export default function ConfidentialitePage() {
  return <ContentArticle slug="confidentialite" />;
}
