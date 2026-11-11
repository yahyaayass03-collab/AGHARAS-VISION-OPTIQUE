import type { Metadata } from "next";
import { ContentArticle } from "@/components/site/ContentArticle";
import { contentMetadata } from "@/lib/content-metadata";

export const dynamic = "force-dynamic";

export function generateMetadata(): Promise<Metadata> {
  return contentMetadata({
    slug: "a-propos",
    fallbackTitle: "AGHARAS VISION",
    description:
      "Une maison d'optique indépendante dédiée à la lunetterie d'exception, au montage de précision et au conseil optométrique.",
    canonical: "/a-propos",
  });
}

export default function AProposPage() {
  return <ContentArticle slug="a-propos" />;
}
