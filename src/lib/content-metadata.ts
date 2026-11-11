import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { withoutBrandTitleSuffix } from "@/lib/seo";

/**
 * Construit les métadonnées d'une page de contenu à partir de la base, avec un
 * repli statique lorsque le document n'est pas encore publié.
 */
export async function contentMetadata({
  slug,
  fallbackTitle,
  description,
  canonical,
}: {
  slug: string;
  fallbackTitle: string;
  description: string;
  canonical: string;
}): Promise<Metadata> {
  const [page, settings] = await Promise.all([
    db.contentPage.findFirst({
      where: { slug, isPublished: true },
      select: { title: true, metaDescription: true, updatedAt: true },
    }),
    getSettings(),
  ]);

  const brandName = settings["store.name"] || "AGHARAS VISION";
  const pageTitle = withoutBrandTitleSuffix(page?.title ?? fallbackTitle, brandName);
  const title: Metadata["title"] =
    pageTitle.localeCompare(brandName, undefined, { sensitivity: "accent" }) === 0
      ? { absolute: pageTitle }
      : pageTitle;
  const metaDescription = page?.metaDescription ?? description;

  return {
    title,
    description: metaDescription,
    alternates: { canonical },
    openGraph: {
      title,
      description: metaDescription,
      siteName: brandName,
      images: [{ url: settings["store.logo_url"] || "/images/brand/agharass-vision-logo-header.webp", alt: `Logo ${settings["store.name"]}` }],
      url: canonical,
      type: "article",
      ...(page ? { modifiedTime: page.updatedAt.toISOString() } : {}),
    },
  };
}
