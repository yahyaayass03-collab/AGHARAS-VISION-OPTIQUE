import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CatalogView } from "@/components/site/CatalogView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await db.category.findFirst({
    where: { slug, isActive: true },
  });
  if (!category) return { title: "Collection introuvable" };
  return {
    title: `${category.name} — collection`,
    description:
      category.description ??
      `Découvrez la collection ${category.name} d’AGHARAS VISION.`,
    alternates: { canonical: `/catalogue/${category.slug}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const category = await db.category.findFirst({
    where: { slug, isActive: true },
  });
  if (!category) notFound();

  return <CatalogView categorySlug={slug} searchParams={await searchParams} />;
}
