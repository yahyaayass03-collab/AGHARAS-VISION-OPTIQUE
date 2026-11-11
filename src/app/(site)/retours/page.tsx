import type { Metadata } from "next";
import { ContentArticle } from "@/components/site/ContentArticle";
import { contentMetadata } from "@/lib/content-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return contentMetadata({
    slug: "retours",
    fallbackTitle: "Retours, échanges & garanties",
    description:
      "Délai de rétractation, procédure de retour, garantie casse et garantie d'adaptation des verres chez AGHARAS VISION.",
    canonical: "/retours",
  });
}

export default function RetoursPage() {
  return <ContentArticle slug="retours" />;
}
