import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getWishlistProductIds } from "@/lib/wishlist";
import { getSettings } from "@/lib/settings";
import { formatDH } from "@/lib/money";
import { WHATSAPP_MESSAGES, whatsappHref } from "@/lib/whatsapp";
import { SITE, PRODUCT_TYPE_LABELS, SHAPE_LABELS } from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";
import { Price, SectionHeading } from "@/components/site/Price";
import { ProductGallery } from "@/components/site/ProductGallery";
import { ProductPurchase } from "@/components/site/ProductPurchase";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { WishlistButton } from "@/components/site/WishlistButton";
import { withoutBrandTitleSuffix } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    db.product.findFirst({
      where: { slug, isActive: true, brand: { isActive: true }, category: { isActive: true } },
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    }),
    getSettings(),
  ]);
  if (!product) return { title: "Produit introuvable" };
  const brandName = settings["store.name"] || SITE.name;
  const productTitle = withoutBrandTitleSuffix(
    product.metaTitle ?? `${product.name} — ${product.subtitle ?? "monture"}`,
    brandName,
  );
  return {
    title: productTitle,
    description:
      product.metaDescription ??
      product.description.slice(0, 160),
    alternates: { canonical: `/produit/${product.slug}` },
    openGraph: {
      title: `${productTitle} | ${brandName}`,
      description: product.subtitle ?? product.description.slice(0, 160),
      siteName: brandName,
      images: product.images[0] ? [{ url: product.images[0].url }] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await db.product.findFirst({
    where: { slug, isActive: true, brand: { isActive: true }, category: { isActive: true } },
    include: {
      brand: true,
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { inventory: true },
      },
    },
  });

  if (!product) notFound();

  const [related, wishlist, settings] = await Promise.all([
    db.product.findMany({
      where: {
        isActive: true,
        brand: { isActive: true },
        category: { isActive: true },
        id: { not: product.id },
        OR: [{ categoryId: product.categoryId }, { type: product.type }],
      },
      orderBy: [{ isBestseller: "desc" }, { createdAt: "desc" }],
      take: 4,
      include: {
        brand: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: { inventory: true },
        },
      },
    }),
    getWishlistProductIds(),
    getSettings(),
  ]);

  const stock = product.variants.reduce(
    (sum, variant) => sum + (variant.inventory?.quantity ?? 0),
    0,
  );
  const configurable =
    product.lensCompatible &&
    product.type !== "ACCESSORY" &&
    product.type !== "CONTACT_LENS";

  const galleryImages = product.images.map((image) => ({
    id: image.id,
    url: image.url,
    alt: image.alt,
  }));

  const purchaseVariants = product.variants.map((variant) => ({
    id: variant.id,
    colorName: variant.colorName,
    colorHex: variant.colorHex,
    sku: variant.sku,
    priceCents: variant.priceCents,
    stock: variant.inventory?.quantity ?? 0,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand.name },
    category: product.category.name,
    image: product.images.map((image) => `${SITE.url}${image.url}`),
    offers: {
      "@type": "Offer",
      url: `${SITE.url}/produit/${product.slug}`,
      priceCurrency: "MAD",
      price: (product.priceCents / 100).toFixed(2),
      availability:
        stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  const dimensions = [
    ["Largeur du verre", product.lensWidthMm ? `${product.lensWidthMm} mm` : null],
    ["Pont", product.bridgeMm ? `${product.bridgeMm} mm` : null],
    ["Longueur des branches", product.templeLengthMm ? `${product.templeLengthMm} mm` : null],
    ["Hauteur du verre", product.lensHeightMm ? `${product.lensHeightMm} mm` : null],
    ["Largeur totale", product.totalWidthMm ? `${product.totalWidthMm} mm` : null],
    ["Poids", product.weightGrams ? `${product.weightGrams} g` : null],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <div className="bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <div className="border-b border-outline-variant bg-surface-dim">
        <div className="canvas py-4">
          <nav aria-label="Fil d'Ariane" className="text-[0.68rem] uppercase tracking-[0.12em] text-on-surface-variant">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-primary">Accueil</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/catalogue" className="hover:text-primary">Catalogue</Link></li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href={`/catalogue/${product.category.slug}`} className="hover:text-primary">
                  {product.category.name}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-primary">{product.name}</li>
            </ol>
          </nav>
        </div>
      </div>

      <div className="canvas py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <ProductGallery
              images={galleryImages}
              name={product.name}
              badge={product.badge}
            />
          </div>

          <div className="lg:col-span-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.18em] text-secondary">
                  {product.brand.name}
                </p>
                <h1 className="mt-1.5 font-serif text-[2rem] leading-tight text-primary md:text-[2.4rem]">
                  {product.name}
                </h1>
                {product.subtitle && (
                  <p className="mt-2 text-body-md text-on-surface-variant">
                    {product.subtitle}
                  </p>
                )}
              </div>
              <WishlistButton
                productId={product.id}
                initialSaved={wishlist.has(product.id)}
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center border border-outline-variant"
              />
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <Price
                cents={product.priceCents}
                compareAt={product.compareAtCents}
                size="lg"
              />
              <span className="text-[0.65rem] uppercase tracking-[0.1em] text-outline">
                TVA incluse
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="badge">{PRODUCT_TYPE_LABELS[product.type] ?? product.type}</span>
              <span className="badge">{SHAPE_LABELS[product.shape] ?? product.shape}</span>
              {product.material && <span className="badge">{product.material}</span>}
            </div>

            <p className="mt-5 text-body-sm leading-relaxed text-on-surface-variant">
              {product.description}
            </p>

            <div className="mt-6">
              <ProductPurchase
                productId={product.id}
                productName={product.name}
                slug={product.slug}
                basePriceCents={product.priceCents}
                variants={purchaseVariants}
                configurable={configurable}
                type={product.type}
              />
            </div>

            <ul className="mt-6 space-y-2.5 border-t border-outline-variant pt-5 text-body-sm text-on-surface-variant">
              <li className="flex items-start gap-2.5">
                <Icon name="truck" size={17} className="mt-0.5 text-secondary" />
                Les frais et options de livraison sont indiqués au moment de la commande.
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="shield" size={17} className="mt-0.5 text-secondary" />
                Consultez les conditions de retour et de garantie avant votre achat.
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="phone" size={17} className="mt-0.5 shrink-0 text-secondary" />
                <span>
                  Conseil opticien par WhatsApp ou en salon privé.{" "}
                  <a
                    href={whatsappHref(
                      settings["store.whatsapp"],
                      WHATSAPP_MESSAGES.product(product.name),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-secondary hover:underline"
                    aria-label="Contacter sur WhatsApp"
                  >
                    Contacter sur WhatsApp
                  </a>
                </span>
              </li>
            </ul>

            {product.deliveryNote && (
              <p className="mt-4 border border-outline-variant bg-surface-dim px-3 py-2 text-[0.72rem] leading-relaxed text-on-surface-variant">
                <Icon name="info" size={14} className="mr-1.5 inline text-secondary" />
                {product.deliveryNote}
              </p>
            )}
          </div>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-12">
          <details className="border border-outline-variant bg-white p-5 lg:col-span-4" open>
            <summary className="flex items-center justify-between font-serif text-lg text-primary">
              Savoir-faire
              <Icon name="chevron-down" size={16} />
            </summary>
            <p className="mt-3 text-body-sm leading-relaxed text-on-surface-variant">
              {product.story ?? product.description}
            </p>
          </details>

          <details className="border border-outline-variant bg-white p-5 lg:col-span-4">
            <summary className="flex items-center justify-between font-serif text-lg text-primary">
              Dimensions &amp; métrologie
              <Icon name="chevron-down" size={16} />
            </summary>
            <div className="mt-3">
              {dimensions.length > 0 ? (
                <dl className="divide-y divide-outline-variant/70 text-body-sm">
                  {dimensions.map(([label, value]) => (
                    <div key={label} className="flex justify-between gap-4 py-1.5">
                      <dt className="text-on-surface-variant">{label}</dt>
                      <dd className="font-medium text-primary">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-body-sm text-on-surface-variant">
                  Les mesures détaillées de ce modèle sont disponibles sur demande
                  auprès de notre conciergerie.
                </p>
              )}
              <p className="mt-3 border-t border-outline-variant pt-3 text-[0.72rem] leading-relaxed text-outline">
                Comparez ces mesures à une monture que vous portez déjà. Un opticien
                peut vous aider à choisir la taille adaptée.
              </p>
            </div>
          </details>

          <details className="border border-outline-variant bg-white p-5 lg:col-span-4">
            <summary className="flex items-center justify-between font-serif text-lg text-primary">
              Verres &amp; traitements
              <Icon name="chevron-down" size={16} />
            </summary>
            <div className="mt-3 space-y-2 text-body-sm text-on-surface-variant">
              <p>
                Verres unifocaux haute définition inclus avec traitement anti-reflet
                et anti-rayures. Options d&apos;amincissement 1.60, 1.67 et 1.74.
              </p>
              <p>
                Traitements disponibles : filtre BlueProtect, photochromique,
                hydrophobe. Les prix sont calculés à la configuration.
              </p>
              <p className="text-[0.72rem] text-outline">
                Une ordonnance ophtalmologique récente est requise pour les verres
                correcteurs. Aucune interprétation médicale automatique n&apos;est réalisée.
              </p>
            </div>
          </details>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="border border-outline-variant bg-surface-dim p-5">
            <h2 className="font-serif text-lg text-primary">Livraison &amp; retours</h2>
            <ul className="mt-2 space-y-1.5 text-body-sm text-on-surface-variant">
              <li>Expédition sous 48 h ouvrées pour les montures en stock.</li>
              <li>Montage des verres correcteurs : 2 à 4 jours ouvrés supplémentaires.</li>
              <li>Retours sous 30 jours, hors verres taillés sur mesure.</li>
              <li>
                <Link href="/livraison" className="link-underline">Détails de livraison</Link>
                {" · "}
                <Link href="/retours" className="link-underline">Retours &amp; garanties</Link>
              </li>
            </ul>
          </div>
          <div className="border border-outline-variant bg-surface-dim p-5">
            <h2 className="font-serif text-lg text-primary">Besoin d&apos;un conseil ?</h2>
            <p className="mt-2 text-body-sm leading-relaxed text-on-surface-variant">
              Notre conciergerie vous accompagne pour choisir la forme, le calibre et
              les verres adaptés à votre visage et à votre ordonnance.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/contact" className="btn-outline btn-sm">Écrire à la maison</Link>
              <Link href="/boutiques" className="btn-quiet btn-sm">Prendre rendez-vous</Link>
            </div>
          </div>
        </div>

        <div className="mt-6 border border-outline-variant bg-white p-5">
          <details>
            <summary className="flex items-center justify-between font-serif text-lg text-primary">
              Guide des calibres &amp; ajustements
              <Icon name="chevron-down" size={16} />
            </summary>
            <div className="mt-3 grid gap-4 text-body-sm text-on-surface-variant md:grid-cols-3">
              <div>
                <h3 className="mb-1 text-[0.7rem] uppercase tracking-[0.1em] text-primary">Largeur du verre</h3>
                <p>Mesure du verre au point le plus large. Elle détermine la proportion de la face.</p>
              </div>
              <div>
                <h3 className="mb-1 text-[0.7rem] uppercase tracking-[0.1em] text-primary">Pont</h3>
                <p>Distance entre les deux verres. Un pont étroit convient mieux aux nez fins.</p>
              </div>
              <div>
                <h3 className="mb-1 text-[0.7rem] uppercase tracking-[0.1em] text-primary">Branches</h3>
                <p>Longueur jusqu&apos;au manchon auriculaire. Vérifiez le confort derrière l&apos;oreille.</p>
              </div>
            </div>
          </details>
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-outline-variant bg-surface-dim py-12">
          <div className="canvas">
            <SectionHeading
              eyebrow="Correspondances"
              title="Ces montures pourraient vous plaire"
              action={{ label: "Tout le catalogue", href: "/catalogue" }}
            />
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((entry) => (
                <ProductCard
                  key={entry.id}
                  product={entry as ProductCardData}
                  saved={wishlist.has(entry.id)}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
