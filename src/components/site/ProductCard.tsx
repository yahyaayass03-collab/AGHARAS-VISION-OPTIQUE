import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Price } from "@/components/site/Price";
import { WishlistButton } from "@/components/site/WishlistButton";
import { formatDH } from "@/lib/money";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  priceCents: number;
  compareAtCents: number | null;
  badge: string | null;
  type: string;
  lensCompatible: boolean;
  images: Array<{ url: string; alt: string }>;
  variants: Array<{
    id: string;
    colorName: string;
    colorHex: string;
    isActive: boolean;
    inventory: { quantity: number } | null;
  }>;
  brand: { name: string };
};

export function ProductCard({
  product,
  saved = false,
  priority = false,
}: {
  product: ProductCardData;
  saved?: boolean;
  priority?: boolean;
}) {
  const stock = product.variants
    .filter((variant) => variant.isActive)
    .reduce((sum, variant) => sum + (variant.inventory?.quantity ?? 0), 0);
  const inStock = stock > 0;
  const lowStock = inStock && stock <= 3;
  const image = product.images[0];
  const colorVariants = product.variants.filter((variant) => variant.isActive);
  const href = `/produit/${product.slug}`;
  const configurable =
    product.lensCompatible && product.type !== "ACCESSORY" && product.type !== "CONTACT_LENS";

  return (
    <article className="group flex min-w-0 flex-col border border-outline-variant bg-white transition-colors duration-200 hover:border-primary">
      <div className="relative aspect-[4/3] overflow-hidden border-b border-outline-variant/60 bg-surface-dim p-3 sm:p-5">
        <div className="flex w-full items-start justify-between">
          <div className="z-10 flex flex-wrap gap-1">
            {product.badge && (
              <span className="bg-primary px-2 py-1 text-[0.6rem] uppercase tracking-[0.1em] text-white">
                {product.badge}
              </span>
            )}
            {product.compareAtCents && product.compareAtCents > product.priceCents && (
              <span className="bg-gold px-2 py-1 text-[0.6rem] uppercase tracking-[0.1em] text-primary">
                Offre
              </span>
            )}
          </div>
          <WishlistButton
            productId={product.id}
            initialSaved={saved}
            className="z-10 -mr-1 -mt-1 flex h-9 w-9 items-center justify-center border border-outline-variant bg-white/90 backdrop-blur-sm"
          />
        </div>

        <Link
          href={href}
          className="absolute inset-0 flex items-center justify-center p-5 sm:p-7"
          aria-label={`Voir ${product.name}`}
        >
          {image ? (
            <Image
              src={image.url}
              alt={image.alt || product.name}
              width={520}
              height={390}
              priority={priority}
              sizes="(max-width: 768px) 90vw, (max-width: 1200px) 45vw, 300px"
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <span className="flex h-40 w-full items-center justify-center border border-dashed border-outline-variant text-outline">
              <Icon name="glasses" size={40} />
            </span>
          )}
        </Link>

      </div>

      <div className="flex flex-1 flex-col justify-between p-3.5 sm:p-5">
        <div>
          <div className="mb-2 flex min-h-3 flex-wrap items-center gap-1.5" role="group" aria-label={`${colorVariants.length} coloris disponibles`}>
            {colorVariants.slice(0, 5).map((variant) => (
              <span
                key={variant.id}
                title={variant.colorName}
                aria-label={variant.colorName}
                className="inline-block h-3 w-3 rounded-full border border-outline-variant"
                style={{ backgroundColor: variant.colorHex }}
              />
            ))}
            {colorVariants.length > 5 && (
              <span className="text-[0.65rem] text-outline">
                +{colorVariants.length - 5}
              </span>
            )}
          </div>
          <p className="mb-1 text-[0.6rem] uppercase tracking-[0.14em] text-outline">
            {product.brand.name}
          </p>
          <h3 className="mb-1 font-serif text-[1.15rem] leading-tight text-primary">
            <Link href={href} className="hover:text-secondary">
              {product.name}
            </Link>
          </h3>
          <p className="mb-3 line-clamp-2 min-h-[2.4em] text-body-sm text-on-surface-variant">
            {product.subtitle}
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2 border-t border-outline-variant pt-3">
            <div>
              <Price cents={product.priceCents} compareAt={product.compareAtCents} size="sm" />
              <p className="mt-0.5 text-[0.65rem] text-outline">
                {product.lensCompatible ? "Verres correcteurs disponibles" : "Prix TTC"}
              </p>
            </div>
            <span
              className={`text-[0.6rem] uppercase tracking-[0.1em] ${
                !inStock ? "text-error" : lowStock ? "text-secondary" : "text-success"
              }`}
            >
              {!inStock ? "Épuisé" : lowStock ? `Stock limité (${stock})` : "En stock"}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant pt-3">
            <Link
              href={href}
              className="group/link inline-flex min-h-10 items-center gap-2 text-[0.625rem] uppercase tracking-[0.12em] text-primary transition-colors hover:text-secondary"
            >
              Découvrir
              <Icon name="arrow-right" size={14} className="transition-transform group-hover/link:translate-x-0.5" />
            </Link>
            {configurable && inStock ? (
              <Link
                href={`/configurateur/${product.slug}`}
                className="inline-flex min-h-10 items-center bg-primary px-3 text-center text-[0.6rem] uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-container"
              >
                Configurer
              </Link>
            ) : (
              <Link
                href={href}
                className="inline-flex min-h-10 items-center bg-primary px-3 text-center text-[0.6rem] uppercase tracking-[0.1em] text-white transition-colors hover:bg-primary-container"
              >
                {inStock ? "Voir le produit" : "Indisponible"}
              </Link>
            )}
          </div>
          {product.compareAtCents && product.compareAtCents > product.priceCents && (
            <p className="mt-1 text-[0.65rem] text-secondary">
              Économisez {formatDH(product.compareAtCents - product.priceCents)}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
