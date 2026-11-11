import type { Metadata } from "next";
import { ContentArticle } from "@/components/site/ContentArticle";
import { contentMetadata } from "@/lib/content-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return contentMetadata({
    slug: "cgv",
    fallbackTitle: "Conditions générales de vente",
    description:
      "Prix, commande, paiement à la livraison, livraison, rétractation et droit applicable pour les ventes d’AGHARAS VISION.",
    canonical: "/cgv",
  });
}

export default function CgvPage() {
  return <ContentArticle slug="cgv" />;
}
