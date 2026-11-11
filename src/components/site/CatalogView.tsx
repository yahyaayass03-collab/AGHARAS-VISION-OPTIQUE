import Link from "next/link";
import { notFound } from "next/navigation";
import type { FrameShape, Gender, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getWishlistProductIds } from "@/lib/wishlist";
import { parseDHToCents } from "@/lib/money";
import {
  GENDER_LABELS,
  SHAPE_LABELS,
} from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { CatalogSort } from "@/components/site/CatalogSort";

type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 9;

const SORT_OPTIONS = new Set([
  "recommended",
  "price-asc",
  "price-desc",
  "newest",
  "name",
]);

const SHAPES = Object.keys(SHAPE_LABELS) as Array<keyof typeof SHAPE_LABELS>;

function one(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function buildHref(
  pathname: string,
  params: SearchParams,
  updates: Record<string, string | null>,
): string {
  const query = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    const value = one(raw);
    if (value) query.set(key, value);
  }
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === "") query.delete(key);
    else query.set(key, value);
  }
  const serialized = query.toString();
  return serialized ? `${pathname}?${serialized}` : pathname;
}

export async function CatalogView({
  categorySlug,
  searchParams,
}: {
  categorySlug?: string;
  searchParams: SearchParams;
}) {
  const category = categorySlug
    ? await db.category.findFirst({
        where: { slug: categorySlug, isActive: true },
      })
    : null;

  if (categorySlug && !category) notFound();

  const pathname = categorySlug ? `/catalogue/${categorySlug}` : "/catalogue";

  const q = one(searchParams.q).trim().slice(0, 120);
  const gender = one(searchParams.genre);
  const brandSlug = one(searchParams.marque);
  const shape = one(searchParams.forme);
  const inStock = one(searchParams.stock) === "1";
  const minRaw = one(searchParams.min);
  const maxRaw = one(searchParams.max);
  const sortRaw = one(searchParams.sort);
  const sort = SORT_OPTIONS.has(sortRaw) ? sortRaw : "recommended";

  const minCents = minRaw ? parseDHToCents(minRaw) : null;
  const maxCents = maxRaw ? parseDHToCents(maxRaw) : null;

  const pageRaw = Number.parseInt(one(searchParams.page), 10);
  const requestedPage = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const conditions: Prisma.ProductWhereInput[] = [{ isActive: true, category: { isActive: true }, brand: { isActive: true } }];

  if (categorySlug) {
    conditions.push({ category: { slug: categorySlug, isActive: true } });
  }
  if (q) {
    conditions.push({
      OR: [
        { name: { contains: q } },
        { subtitle: { contains: q } },
        { description: { contains: q } },
        { material: { contains: q } },
        { brand: { name: { contains: q } } },
      ],
    });
  }
  if (gender && gender in GENDER_LABELS) {
    conditions.push({ gender: gender as Gender });
  }
  if (brandSlug) {
    conditions.push({ brand: { slug: brandSlug, isActive: true } });
  }
  if (shape && shape in SHAPE_LABELS) {
    conditions.push({ shape: shape as FrameShape });
  }
  if (minCents !== null) conditions.push({ priceCents: { gte: minCents } });
  if (maxCents !== null) conditions.push({ priceCents: { lte: maxCents } });
  if (inStock) {
    conditions.push({
      variants: {
        some: { isActive: true, inventory: { quantity: { gt: 0 } } },
      },
    });
  }

  const where: Prisma.ProductWhereInput = { AND: conditions };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "price-asc"
      ? [{ priceCents: "asc" }, { name: "asc" }]
      : sort === "price-desc"
        ? [{ priceCents: "desc" }, { name: "asc" }]
        : sort === "newest"
          ? [{ createdAt: "desc" }, { name: "asc" }]
          : sort === "name"
            ? [{ name: "asc" }]
            : [{ isBestseller: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }];

  const total = await db.product.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const [products, brands, wishlist, categories] = await Promise.all([
    db.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
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
    db.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    }),
    getWishlistProductIds(),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);

  const activeChips: Array<{ label: string; href: string }> = [];
  if (q) activeChips.push({ label: `« ${q} »`, href: buildHref(pathname, searchParams, { q: null, page: null }) });
  if (gender && gender in GENDER_LABELS) {
    activeChips.push({
      label: GENDER_LABELS[gender] ?? gender,
      href: buildHref(pathname, searchParams, { genre: null, page: null }),
    });
  }
  if (brandSlug) {
    const brand = brands.find((entry) => entry.slug === brandSlug);
    activeChips.push({
      label: brand?.name ?? brandSlug,
      href: buildHref(pathname, searchParams, { marque: null, page: null }),
    });
  }
  if (shape && shape in SHAPE_LABELS) {
    activeChips.push({
      label: SHAPE_LABELS[shape] ?? shape,
      href: buildHref(pathname, searchParams, { forme: null, page: null }),
    });
  }
  if (minCents !== null || maxCents !== null) {
    activeChips.push({
      label: `Prix : ${minRaw || "0"} – ${maxRaw || "sans limite"} DH`,
      href: buildHref(pathname, searchParams, { min: null, max: null, page: null }),
    });
  }
  if (inStock) {
    activeChips.push({
      label: "En stock",
      href: buildHref(pathname, searchParams, { stock: null, page: null }),
    });
  }

  const pageNumbers: number[] = [];
  const windowStart = Math.max(1, Math.min(page - 2, totalPages - 4));
  const windowEnd = Math.min(totalPages, windowStart + 4);
  for (let index = windowStart; index <= windowEnd; index += 1) {
    pageNumbers.push(index);
  }

  const filterForm = (
    <form action={pathname} method="get" className="space-y-5">
      {sort !== "recommended" && <input type="hidden" name="sort" value={sort} />}
      <div>
        <label htmlFor="catalog-q" className="field-label">
          Recherche
        </label>
        <div className="relative">
          <input
            id="catalog-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Ex. Titane, Pantos, acétate…"
            className="field bg-surface-dim py-2.5 pl-9 text-body-sm"
          />
          <Icon
            name="search"
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
          />
        </div>
      </div>

      <fieldset>
        <legend className="field-label">Genre</legend>
        <div className="space-y-1.5 text-body-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="radio" name="genre" value="" defaultChecked={!gender} />
            Tous les genres
          </label>
          {Object.entries(GENDER_LABELS).map(([value, label]) => (
            <label key={value} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="genre"
                value={value}
                defaultChecked={gender === value}
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="catalog-brand" className="field-label">
          Marque / atelier
        </label>
        <select
          id="catalog-brand"
          name="marque"
          defaultValue={brandSlug}
          className="field py-2.5 text-body-sm"
        >
          <option value="">Toutes les marques</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.slug}>
              {brand.name} ({brand._count.products})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="catalog-shape" className="field-label">
          Forme
        </label>
        <select
          id="catalog-shape"
          name="forme"
          defaultValue={shape}
          className="field py-2.5 text-body-sm"
        >
          <option value="">Toutes les formes</option>
          {SHAPES.map((value) => (
            <option key={value} value={value}>
              {SHAPE_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="field-label">Prix (DH)</legend>
        <div className="flex items-center gap-2">
          <input
            name="min"
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            defaultValue={minRaw}
            placeholder="0"
            aria-label="Prix minimum en dirhams"
            className="field py-2 text-body-sm"
          />
          <span className="text-outline">—</span>
          <input
            name="max"
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            defaultValue={maxRaw}
            placeholder="3 500"
            aria-label="Prix maximum en dirhams"
            className="field py-2 text-body-sm"
          />
        </div>
      </fieldset>

      <label className="flex cursor-pointer items-center gap-2 text-body-sm">
        <input type="checkbox" name="stock" value="1" defaultChecked={inStock} />
        Uniquement les articles en stock
      </label>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary btn-sm flex-1">
          Appliquer
        </button>
        <Link
          href={pathname}
          className="btn-quiet btn-sm flex-1 text-center"
        >
          Réinitialiser
        </Link>
      </div>
    </form>
  );

  return (
    <div className="bg-surface">
      <div className="border-b border-outline-variant bg-surface-dim">
        <div className="canvas py-8 lg:py-12">
          <nav aria-label="Fil d'Ariane" className="mb-4 text-[0.68rem] uppercase tracking-[0.12em] text-on-surface-variant">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-primary">Accueil</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                {category ? (
                  <Link href="/catalogue" className="hover:text-primary">Catalogue</Link>
                ) : (
                  <span className="text-primary">Catalogue</span>
                )}
              </li>
              {category && (
                <>
                  <li aria-hidden="true">/</li>
                  <li className="text-primary">{category.name}</li>
                </>
              )}
            </ol>
          </nav>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow mb-2">
                {category?.tagline ?? "Haute lunetterie & précision optique"}
              </p>
              <h1 className="font-serif text-[2.2rem] leading-tight text-primary md:text-[2.8rem]">
                {category ? category.name : "La collection"}
              </h1>
              <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
                {category?.description ??
                  "Montures optiques, solaires et accessoires sélectionnés pour la justesse de leurs lignes et la qualité de leurs matières. Filtrez par forme, matière, marque ou budget."}
              </p>
            </div>

            <dl className="flex gap-6 border-t border-outline-variant pt-4 md:border-t-0 md:pt-0">
              <div>
                <dt className="text-[0.6rem] uppercase tracking-[0.12em] text-outline">Modèles</dt>
                <dd className="font-serif text-2xl text-primary">{total}</dd>
              </div>
              <div>
                <dt className="text-[0.6rem] uppercase tracking-[0.12em] text-outline">Ateliers</dt>
                <dd className="font-serif text-2xl text-primary">{brands.length}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((entry) => (
              <Link
                key={entry.id}
                href={`/catalogue/${entry.slug}`}
                className={`border px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.1em] transition-colors ${
                  entry.slug === categorySlug
                    ? "border-primary bg-primary text-white"
                    : "border-outline-variant bg-white text-primary hover:border-primary"
                }`}
              >
                {entry.name}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="canvas py-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-12">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-28 border border-outline-variant bg-white p-5">
              <div className="mb-4 flex items-center justify-between border-b border-outline-variant pb-3">
                <h2 className="text-label uppercase tracking-[0.14em] text-primary">Filtres</h2>
                <Icon name="filter" size={16} className="text-outline" />
              </div>
              {filterForm}
            </div>
          </aside>

          <div className="lg:col-span-9">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-body-sm text-on-surface-variant" aria-live="polite">
                {total === 0
                  ? "Aucun modèle ne correspond à votre recherche."
                  : `${total} modèle${total > 1 ? "s" : ""} · page ${page} sur ${totalPages}`}
              </p>
              <CatalogSort value={sort} />
            </div>

            <details className="mb-5 border border-outline-variant bg-white lg:hidden">
              <summary className="flex items-center justify-between px-4 py-3 text-label uppercase tracking-[0.12em] text-primary">
                Filtrer les résultats
                <Icon name="filter" size={16} />
              </summary>
              <div className="border-t border-outline-variant p-4">{filterForm}</div>
            </details>

            {activeChips.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] uppercase tracking-[0.1em] text-outline">
                  Filtres actifs :
                </span>
                {activeChips.map((chip) => (
                  <Link
                    key={chip.label}
                    href={chip.href}
                    className="inline-flex items-center gap-1.5 border border-outline-variant bg-surface-dim px-2.5 py-1 text-[0.68rem] text-primary hover:border-primary"
                  >
                    {chip.label}
                    <Icon name="close" size={12} />
                  </Link>
                ))}
                <Link
                  href={pathname}
                  className="text-[0.68rem] text-secondary underline underline-offset-4"
                >
                  Tout effacer
                </Link>
              </div>
            )}

            {products.length === 0 ? (
              <div className="border border-outline-variant bg-surface-dim p-10 text-center">
                <Icon name="search" size={32} className="mx-auto mb-3 text-outline" />
                <h2 className="font-serif text-xl text-primary">
                  Aucune monture trouvée
                </h2>
                <p className="mx-auto mt-2 max-w-md text-body-sm text-on-surface-variant">
                  Élargissez votre recherche ou consultez notre sélection complète.
                  Un opticien peut aussi vous conseiller une forme adaptée à votre visage.
                </p>
                <Link href="/catalogue" className="btn-outline mt-5">
                  Voir tout le catalogue
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product as ProductCardData}
                    saved={wishlist.has(product.id)}
                    priority={index < 3}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav
                aria-label="Pagination du catalogue"
                className="mt-10 flex items-center justify-center gap-1.5"
              >
                {page > 1 && (
                  <Link
                    href={buildHref(pathname, searchParams, { page: String(page - 1) })}
                    className="flex h-9 w-9 items-center justify-center border border-outline-variant bg-white text-primary hover:border-primary"
                    aria-label="Page précédente"
                  >
                    <Icon name="arrow-left" size={15} />
                  </Link>
                )}
                {pageNumbers.map((number) => (
                  <Link
                    key={number}
                    href={buildHref(pathname, searchParams, { page: String(number) })}
                    aria-current={number === page ? "page" : undefined}
                    className={`flex h-9 min-w-9 items-center justify-center border px-2 text-body-sm ${
                      number === page
                        ? "border-primary bg-primary text-white"
                        : "border-outline-variant bg-white text-primary hover:border-primary"
                    }`}
                  >
                    {number}
                  </Link>
                ))}
                {page < totalPages && (
                  <Link
                    href={buildHref(pathname, searchParams, { page: String(page + 1) })}
                    className="flex h-9 w-9 items-center justify-center border border-outline-variant bg-white text-primary hover:border-primary"
                    aria-label="Page suivante"
                  >
                    <Icon name="arrow-right" size={15} />
                  </Link>
                )}
              </nav>
            )}

            <div className="mt-10 grid gap-4 border border-outline-variant bg-surface-dim p-5 md:grid-cols-3">
              {[
                ["truck", "Options de livraison", "Les frais applicables sont affichés au moment de la commande."],
                ["shield", "Paiement à la livraison", "Aucun paiement en ligne n'est simulé."],
                ["phone", "Conseil opticien", "Une question sur un calibre ? Écrivez-nous."],
              ].map(([icon, title, text]) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon name={icon as "truck"} size={22} className="mt-0.5 text-secondary" />
                  <div>
                    <h2 className="text-[0.7rem] uppercase tracking-[0.1em] text-primary">{title}</h2>
                    <p className="mt-1 text-body-sm text-on-surface-variant">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
