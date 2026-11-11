import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { jsonStringList } from "@/lib/json-string-list";
import { getSettings } from "@/lib/settings";
import { LensWizard } from "@/components/site/LensWizard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await db.product.findFirst({
    where: { slug, isActive: true, category: { isActive: true }, brand: { isActive: true } },
    select: { name: true },
  });
  if (!product) return { title: "Monture introuvable" };
  return {
    title: `Configurer les verres — ${product.name}`,
    description: `Composez vos verres correcteurs pour la monture ${product.name} : indices, traitements, ordonnance et récapitulatif transparent.`,
    alternates: { canonical: `/configurateur/${slug}` },
    robots: { index: false, follow: true },
  };
}

export default async function ConfiguratorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ variant?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);

  const product = await db.product.findFirst({
    where: { slug, isActive: true, category: { isActive: true }, brand: { isActive: true } },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 2 },
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { inventory: true },
      },
    },
  });

  if (!product) notFound();

  const configurable =
    product.lensCompatible &&
    product.type !== "ACCESSORY" &&
    product.type !== "CONTACT_LENS";

  if (!configurable) redirect(`/produit/${product.slug}`);

  const [allLensTypes, lensIndices, treatments, settings] = await Promise.all([
    db.lensType.findMany({
      where: { isActive: true, kind: { notIn: ["NONE", "PROGRESSIVE"] } },
      orderBy: { sortOrder: "asc" },
    }),
    db.lensIndex.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.lensTreatment.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getSettings(),
  ]);
  const lensTypes = allLensTypes.filter((lens) => jsonStringList(lens.productTypes).includes(product.type));

  const initialVariant =
    product.variants.find((variant) => variant.id === query.variant) ??
    product.variants[0] ??
    null;

  return (
    <div className="bg-surface">
      <div className="border-b border-outline-variant bg-surface-dim">
        <div className="canvas py-4">
          <nav
            aria-label="Fil d'Ariane"
            className="text-[0.68rem] uppercase tracking-[0.12em] text-on-surface-variant"
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-primary">
                  Accueil
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/catalogue" className="hover:text-primary">
                  Catalogue
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/produit/${product.slug}`}
                  className="hover:text-primary"
                >
                  {product.name}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-primary">Configuration des verres</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="canvas py-8 lg:py-12">
        <header className="mb-8 max-w-3xl">
          <p className="eyebrow">Atelier verres &amp; corrections</p>
          <h1 className="mt-2 font-serif text-[2rem] leading-tight text-primary md:text-[2.6rem]">
            Composez vos verres de précision
          </h1>
          <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
            Chaque configuration est vérifiée par un opticien diplômé avant le
            montage. Prix transparents, ordonnance conservée de façon privée et
            feuille de soins fournie pour vos remboursements.
          </p>
        </header>

        <LensWizard
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            brand: product.brand.name,
            priceCents: product.priceCents,
            imageUrl: product.images[0]?.url ?? null,
            imageAlt: product.images[0]?.alt ?? product.name,
            lensWidthMm: product.lensWidthMm,
            bridgeMm: product.bridgeMm,
            templeLengthMm: product.templeLengthMm,
          }}
          variants={product.variants.map((variant) => ({
            id: variant.id,
            colorName: variant.colorName,
            colorHex: variant.colorHex,
            sku: variant.sku,
            priceCents: variant.priceCents,
            stock: variant.inventory?.quantity ?? 0,
          }))}
          initialVariantId={initialVariant?.id ?? ""}
          lensTypes={lensTypes.map((entry) => ({
            id: entry.id,
            name: entry.name,
            description: entry.description,
            kind: entry.kind,
            priceCents: entry.priceCents,
          }))}
          lensIndices={lensIndices.map((entry) => ({
            id: entry.id,
            name: entry.name,
            label: entry.label,
            value: entry.value,
            priceCents: entry.priceCents,
            maxAbsSphere:
              entry.maxAbsSphere === null ? null : Number(entry.maxAbsSphere),
          }))}
          treatments={treatments.map((entry) => ({
            id: entry.id,
            name: entry.name,
            description: entry.description,
            priceCents: entry.priceCents,
            isDefault: entry.isDefault,
          }))}
          whatsapp={settings["store.whatsapp"] ?? ""}
        />
      </div>
    </div>
  );
}
