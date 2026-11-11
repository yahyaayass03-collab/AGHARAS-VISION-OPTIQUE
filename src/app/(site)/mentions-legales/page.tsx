import type { Metadata } from "next";
import { ContentArticle } from "@/components/site/ContentArticle";
import { contentMetadata } from "@/lib/content-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return contentMetadata({
    slug: "mentions-legales",
    fallbackTitle: "Mentions légales",
    description:
      "Éditeur du site, identifiants d'entreprise et informations d'hébergement d’AGHARAS VISION.",
    canonical: "/mentions-legales",
  });
}

export default function MentionsLegalesPage() {
  return <ContentArticle slug="mentions-legales" />;
}
