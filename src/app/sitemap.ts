import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE } from "@/lib/constants";

const staticRoutes: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/catalogue", changeFrequency: "daily", priority: 0.9 },
  { path: "/boutiques", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.6 },
  { path: "/a-propos", changeFrequency: "monthly", priority: 0.5 },
  { path: "/livraison", changeFrequency: "monthly", priority: 0.5 },
  { path: "/retours", changeFrequency: "monthly", priority: 0.5 },
  { path: "/cgv", changeFrequency: "yearly", priority: 0.4 },
  { path: "/confidentialite", changeFrequency: "yearly", priority: 0.4 },
  { path: "/mentions-legales", changeFrequency: "yearly", priority: 0.3 },
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: new URL(route.path, SITE.url).toString(),
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  try {
    const [categories, products] = await Promise.all([
      db.category.findMany({
        where: { isActive: true, products: { some: { isActive: true, brand: { isActive: true } } } },
        select: { slug: true, updatedAt: true },
      }),
      db.product.findMany({
        where: { isActive: true, category: { isActive: true }, brand: { isActive: true } },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    for (const category of categories) {
      entries.push({
        url: new URL(`/catalogue/${category.slug}`, SITE.url).toString(),
        lastModified: category.updatedAt,
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    for (const product of products) {
      entries.push({
        url: new URL(`/produit/${product.slug}`, SITE.url).toString(),
        lastModified: product.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch {
    // Le plan du site reste fonctionnel avec les routes statiques si la base
    // n'est pas joignable au moment de la génération.
  }

  return entries;
}
