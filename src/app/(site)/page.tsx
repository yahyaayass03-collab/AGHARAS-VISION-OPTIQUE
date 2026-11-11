import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getWishlistProductIds } from "@/lib/wishlist";
import { getSettings } from "@/lib/settings";
import { formatDH } from "@/lib/money";
import { Icon } from "@/components/ui/Icon";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { SectionHeading } from "@/components/site/Price";
import { Fragment, isValidElement, type ReactNode } from "react";
import { featuredCategoryIds, homeSectionOrder, type HomeSection } from "@/lib/home-layout";
import { WHATSAPP_MESSAGES, whatsappHref } from "@/lib/whatsapp";

function OrderedSections({ order, children }: { order: HomeSection[]; children: ReactNode }) {
  const sections = Array.isArray(children) ? children : [children];
  return <>{order.map((id) => sections.find((section) => isValidElement(section) && section.key === id))}</>;
}

export const dynamic = "force-dynamic";

const CATEGORY_VISUALS: Record<string, { image?: string; icon: "glasses" | "sun" | "lens" | "case"; note: string }> = {
  femme: { image: "/images/promotional/agharas-femme.webp", icon: "glasses", note: "Silhouettes & créateurs" },
  homme: { image: "/images/promotional/agharas-homme.webp", icon: "glasses", note: "Architecture & titane" },
  solaires: { image: "/images/promotional/agharas-category-solaires-1600.webp", icon: "sun", note: "Protection UV400" },
  "clips-2-en-1": { image: "/images/promotional/agharas-category-clips-960.webp", icon: "glasses", note: "Vue & solaire" },
  lentilles: { icon: "lens", note: "Journalières & mensuelles" },
  accessoires: { icon: "case", note: "Étuis cuir & chaînes" },
};

export default async function HomePage() {
  const [settings, wishlist, categories, featured, lensIndices, lensTypes, lensTreatments, banners] = await Promise.all([
    getSettings(),
    getWishlistProductIds(),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    }),
    db.product.findMany({
       where: { isActive: true, isFeatured: true, category: { isActive: true }, brand: { isActive: true } },
      orderBy: [{ isBestseller: "desc" }, { createdAt: "asc" }],
      take: 4,
      include: {
        brand: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          where: { isActive: true },
          include: { inventory: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    db.lensIndex.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 3 }),
    db.lensType.findMany({ where: { isActive: true, kind: "SINGLE_VISION" }, orderBy: { sortOrder: "asc" }, take: 1 }),
    db.lensTreatment.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 1 }),
    db.banner.findMany({ where: { position: "home" }, orderBy: { sortOrder: "asc" } }),
  ]);

  const hero = banners.find((banner) => banner.key === "home-hero");
  const promotionalBanner = banners.find((banner) => banner.key === "home-promo" && banner.isActive);
  const collectionsBanner = banners.find((banner) => banner.key === "home-collections" && banner.isActive);
  const identityBanner = banners.find((banner) => banner.key === "home-univers" && banner.isActive);

  const selectedIds = featuredCategoryIds(settings["home.featured_categories"]);
  const homepageCategories = selectedIds === null ? categories : selectedIds.flatMap((id) => {
    const category = categories.find((entry) => entry.id === id);
    return category ? [category] : [];
  });

  return (
    <OrderedSections order={homeSectionOrder(settings["home.section_order"])}>
      <Fragment key="hero">
      {hero?.isActive !== false && <section className="border-b border-outline-variant bg-surface-dim">
        <div className="mx-auto grid w-full max-w-canvas grid-cols-1 xl:grid-cols-12">
          <div className="flex flex-col justify-center px-6 py-14 md:px-12 xl:col-span-6 xl:px-16 xl:py-20">
            <div className="max-w-xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-secondary" />
                <span className="eyebrow tracking-[0.25em]">{hero?.eyebrow ?? "Atelier & Maison d'Optique"}</span>
              </div>
              <h1 className="mb-5 text-[2.5rem] leading-[1.08] text-primary md:text-[3.25rem]">
                {hero?.title ?? "Voyez la différence. Affirmez votre style."}
              </h1>
              <p className="mb-9 max-w-lg text-body-lg font-light leading-relaxed text-on-surface-variant">
                {hero?.subtitle ?? "Découvrez notre sélection de montures et composez votre choix selon les options disponibles."}
                {settings["store.city"] ? ` À ${settings["store.city"]} et partout au Maroc.` : ""}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={hero?.ctaHref || "/catalogue"} className="btn-primary group px-8 py-4">
                  {hero?.ctaLabel || "Découvrir la collection"}
                  <Icon name="arrow-right" size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link href="/catalogue/solaires" className="btn-outline px-8 py-4">
                  Lunettes de soleil
                </Link>
              </div>

            </div>
          </div>

          <div className="relative aspect-[16/9] overflow-hidden bg-surface-container xl:col-span-6 xl:aspect-auto xl:min-h-[620px]">
            <Image
              src={hero?.imageUrl || "/images/promotional/agharas-hero-eyewear-1920.webp"}
              alt="Montures optiques et solaires présentées dans un univers vert profond et doré"
              fill
              priority
              sizes="(max-width: 1279px) 100vw, 50vw"
              className="object-cover object-right"
            />
            <div className="absolute bottom-5 right-5 hidden max-w-xs border border-outline-variant bg-white/95 p-4 backdrop-blur-sm sm:block">
              <p className="mb-1 text-[0.6rem] uppercase tracking-[0.16em] text-secondary">
                Campagne officielle
              </p>
              <p className="font-serif text-base text-primary">
                Le Marais N°04 &amp; Silhouette Pure
              </p>
              <p className="mt-1 text-[0.75rem] text-on-surface-variant">
                Titane brossé &amp; acétate japonais
              </p>
            </div>
          </div>
        </div>
      </section>}
      </Fragment>

      <Fragment key="banners">
      {banners.filter((banner) => banner.isActive && !["home-hero", "home-promo", "home-collections", "home-univers"].includes(banner.key)).map((banner) => (
        <section key={banner.id} className="border-b border-outline-variant bg-surface-container-high/60 py-8">
          <div className="canvas flex flex-wrap items-center justify-between gap-4">
            {banner.imageUrl && <div className="relative h-24 w-40 shrink-0 overflow-hidden"><Image src={banner.imageUrl} alt={`Visuel promotionnel : ${banner.title}`} fill sizes="160px" className="object-cover" /></div>}
            <div>
              {banner.eyebrow && <p className="eyebrow">{banner.eyebrow}</p>}
              <h2 className="font-serif text-xl text-primary">{banner.title}</h2>
              {banner.subtitle && <p className="mt-1 text-body-sm text-on-surface-variant">{banner.subtitle}</p>}
            </div>
            {banner.ctaHref && banner.ctaLabel && <Link href={banner.ctaHref} className="btn-primary">{banner.ctaLabel}</Link>}
          </div>
        </section>
      ))}
      </Fragment>

      <Fragment key="categories">
      {settings["home.categories_visible"] !== "false" && <section className="border-b border-outline-variant bg-white py-14 lg:py-20" id="categories">
        <div className="canvas">
          <SectionHeading
            eyebrow="Univers & silhouettes"
            title="Explorez nos collections"
            description="Une sélection pensée pour toutes les physionomies, tous les modes de vie et toutes les exigences d'acuité visuelle."
          />

          {collectionsBanner && (
            <div className="mt-8 grid overflow-hidden border border-outline-variant bg-surface-dim md:grid-cols-2">
              {collectionsBanner.imageUrl && (
                <div className="relative aspect-[16/9] overflow-hidden bg-surface-container md:aspect-auto md:min-h-64">
                  <Image
                    src={collectionsBanner.imageUrl}
                    alt="Sélection de montures optiques présentées dans un décor vert et doré"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col items-start justify-center p-6 md:p-10">
                {collectionsBanner.eyebrow && <p className="eyebrow mb-2">{collectionsBanner.eyebrow}</p>}
                <h3 className="font-serif text-2xl text-primary md:text-3xl">{collectionsBanner.title}</h3>
                {collectionsBanner.subtitle && <p className="mt-3 max-w-lg text-body-sm leading-relaxed text-on-surface-variant">{collectionsBanner.subtitle}</p>}
                {collectionsBanner.ctaHref && collectionsBanner.ctaLabel && (
                  <Link href={collectionsBanner.ctaHref} className="btn-primary mt-5">{collectionsBanner.ctaLabel}<Icon name="arrow-right" size={15} /></Link>
                )}
              </div>
            </div>
          )}

          <div className={`${collectionsBanner ? "mt-6" : "mt-8"} grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 lg:gap-4`}>
            {homepageCategories.map((category) => {
              const visual = CATEGORY_VISUALS[category.slug] ?? { icon: "glasses" as const, note: "" };
              return (
                <Link
                  key={category.id}
                  href={`/catalogue/${category.slug}`}
                  className="group flex flex-col border border-outline-variant bg-surface-dim transition-colors hover:border-primary"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-surface-container">
                    {category.imageUrl || visual.image ? (
                      <Image
                        src={category.imageUrl || visual.image!}
                        alt={category.slug === "femme"
                          ? "Portrait d’une femme portant des lunettes dans une ambiance lumineuse"
                          : category.slug === "homme"
                            ? "Portrait d’un homme portant des lunettes dans une ambiance lumineuse"
                            : `Visuel de la collection ${category.name}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 220px"
                        className={`object-cover ${category.slug === "femme" || category.slug === "homme" ? "object-[68%_center]" : "object-center"} transition-transform duration-500 group-hover:scale-105`}
                      />
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                          <Icon name={visual.icon} size={26} />
                        </span>
                        <span className="text-[0.6rem] uppercase tracking-[0.14em] text-secondary">
                          {visual.note}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 bg-white p-3.5">
                    <div>
                      <h3 className="font-serif text-[1rem] leading-tight text-primary group-hover:text-secondary">
                        {category.name}
                      </h3>
                      <span className="text-[0.6rem] uppercase tracking-[0.1em] text-on-surface-variant">
                        {category._count.products} modèle{category._count.products > 1 ? "s" : ""}
                      </span>
                    </div>
                    <Icon name="arrow-right" size={15} className="text-outline transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>}
      </Fragment>

      <Fragment key="products">
      {settings["home.featured_visible"] !== "false" && <section className="border-b border-outline-variant bg-surface-dim py-14 lg:py-20" id="catalogue">
        <div className="canvas">
          <div className="mx-auto mb-9 max-w-2xl text-center">
            <p className="eyebrow mb-2">Sélection phare</p>
            <h2 className="font-serif text-[1.9rem] text-primary md:text-[2.4rem]">
              Nos meilleures ventes
            </h2>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              Les montures plébiscitées pour leur confort et leur silhouette intemporelle.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product as ProductCardData}
                saved={wishlist.has(product.id)}
              />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/catalogue" className="btn-outline">
              Voir toutes les montures
              <Icon name="arrow-right" size={15} />
            </Link>
          </div>
        </div>
      </section>}
      </Fragment>

      <Fragment key="optical">
      {settings["home.optical_visible"] !== "false" && <section className="border-b border-outline-variant bg-white py-14 lg:py-20">
        <div className="canvas">
          <div className="relative border border-outline-variant bg-surface-dim p-6 md:p-12">
            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r/srgb from-primary via-gold to-primary" />
            <div className="grid items-center gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <p className="eyebrow mb-2 tracking-[0.22em]">
                  Laboratoire optique &amp; précision réfractive
                </p>
                <h2 className="mb-3 text-[1.9rem] leading-tight text-primary md:text-[2.4rem]">
                  Verres correcteurs haute définition
                </h2>
                <p className="mb-7 max-w-xl text-body-md leading-relaxed text-on-surface-variant">
                  Des options optiques sélectionnées selon les disponibilités de la boutique,
                  bénéficiez de verres de précision taillés sur-mesure selon votre
                  ordonnance.
                </p>

                <ol className="mb-8 grid gap-5 border-t border-outline-variant pt-6 sm:grid-cols-3">
                  {[
                    ["Téléversez votre ordonnance", "Photo ou PDF de votre ophtalmologiste, conservé de façon privée."],
                    ["Choisissez vos traitements", "Anti-lumière bleue, amincissement, filtre anti-reflet."],
                    ["Remboursement", "Les conditions et documents requis dépendent de votre organisme."],
                  ].map(([title, text], index) => (
                    <li key={title}>
                      <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[0.7rem] font-semibold text-white">
                        {index + 1}
                      </span>
                      <h3 className="mb-1 font-serif text-base text-primary">{title}</h3>
                      <p className="text-[0.75rem] leading-relaxed text-on-surface-variant">{text}</p>
                    </li>
                  ))}
                </ol>

                <Link href="/catalogue" className="btn-primary group px-8 py-3.5">
                  Choisir mes verres
                  <Icon name="arrow-right" size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="lg:col-span-5">
                <div className="border border-outline-variant bg-white p-6">
                  <div className="flex items-center justify-between border-b border-outline-variant pb-4">
                    <span className="text-[0.65rem] uppercase tracking-[0.14em] text-secondary">
                      Simulateur réfractif
                    </span>
                    <span className="badge text-[0.6rem]">Options disponibles</span>
                  </div>
                  <div className="space-y-2.5 py-4 text-body-sm">
                    {lensTypes[0] && (
                      <div className="flex items-center justify-between border border-outline-variant bg-surface-dim p-3">
                        <span className="text-primary">{lensTypes[0].name}</span>
                        <span className="font-semibold text-primary">{lensTypes[0].priceCents === 0 ? "Inclus" : `+ ${formatDH(lensTypes[0].priceCents)}`}</span>
                      </div>
                    )}
                    {lensTreatments[0] && (
                      <div className="flex items-center justify-between border border-outline-variant bg-surface-dim p-3">
                        <span className="text-primary">{lensTreatments[0].name}</span>
                        <span className="font-semibold text-primary">{lensTreatments[0].priceCents === 0 ? "Inclus" : `+ ${formatDH(lensTreatments[0].priceCents)}`}</span>
                      </div>
                    )}
                    {lensIndices[2] && (
                      <div className="flex items-center justify-between border border-outline-variant bg-surface-dim p-3">
                        <span className="text-primary">{lensIndices[2].name} ({lensIndices[2].value})</span>
                        <span className="font-semibold text-primary">
                          + {formatDH(lensIndices[2].priceCents)}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="border-t border-outline-variant pt-3 text-[0.7rem] text-outline">
                    Prix transparents, calculés côté serveur à la configuration. Aucune
                    interprétation médicale automatique.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>}
      </Fragment>

      <Fragment key="promotion">
      {promotionalBanner && (
        <section className="border-b border-outline-variant bg-surface-container-high/60 py-5">
          <div className="canvas flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
            <div className="flex min-w-0 items-center gap-4">
              {promotionalBanner.imageUrl ? (
                <div className="relative h-16 w-24 shrink-0 overflow-hidden bg-surface-dim">
                  <Image src={promotionalBanner.imageUrl} alt={`Visuel promotionnel : ${promotionalBanner.title}`} fill sizes="96px" className="object-cover" />
                </div>
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold/40 text-secondary">
                  <Icon name="sun" size={22} />
                </span>
              )}
              <div>
                <p className="font-serif text-base text-primary">
                  {promotionalBanner.title}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  {promotionalBanner.subtitle}
                </p>
              </div>
            </div>
            <Link href={promotionalBanner.ctaHref || "/catalogue"} className="btn-primary">
              {promotionalBanner.ctaLabel || "Découvrir"}
            </Link>
          </div>
        </section>
      )}
      </Fragment>

      <Fragment key="trust">
      {settings["home.trust_visible"] !== "false" && <section className="border-b border-outline-variant bg-white py-14">
        <div className="canvas grid gap-4 md:grid-cols-3">
          {[
            ["truck", "Options de livraison", "Les frais et informations applicables sont présentés au moment de la commande."],
            ["shield", "Paiement à la livraison", "Réglez en toute sérénité à la réception de votre colis. Le paiement en ligne n'est activé que lorsqu'une passerelle réelle est configurée."],
            ["phone", "Une question ?", "Contactez notre équipe par WhatsApp pour obtenir des informations sur votre sélection."],
          ].map(([icon, title, text]) => (
            <div key={title} className="flex items-start gap-4 border border-outline-variant bg-surface-dim p-5">
              <Icon name={icon as "truck"} size={30} className="text-secondary" />
              <div>
                <h2 className="mb-1 font-serif text-lg text-primary">{title}</h2>
                <p className="text-body-sm leading-relaxed text-on-surface-variant">{text}</p>
                {title === "Conseils personnalisés" && (
                  <a
                    href={whatsappHref(
                      settings["store.whatsapp"],
                      WHATSAPP_MESSAGES.optical,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-body-sm text-secondary hover:underline"
                    aria-label="Contacter sur WhatsApp"
                  >
                    <Icon name="whatsapp" size={14} />
                    Contacter sur WhatsApp
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
        {identityBanner && (
          <div className="canvas mt-8">
            <div className="grid overflow-hidden border border-outline-variant bg-surface-dim md:grid-cols-2">
              {identityBanner.imageUrl && (
                <div className="relative aspect-[16/9] overflow-hidden bg-surface-container md:aspect-auto md:min-h-64">
                  <Image
                    src={identityBanner.imageUrl}
                    alt="Deux personnes portant des lunettes dans un intérieur vert et lumineux"
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-col items-start justify-center p-6 md:p-10">
                {identityBanner.eyebrow && <p className="eyebrow mb-2">{identityBanner.eyebrow}</p>}
                <h2 className="font-serif text-2xl text-primary md:text-3xl">{identityBanner.title}</h2>
                {identityBanner.subtitle && <p className="mt-3 max-w-lg text-body-sm leading-relaxed text-on-surface-variant">{identityBanner.subtitle}</p>}
                {identityBanner.ctaHref && identityBanner.ctaLabel && <Link href={identityBanner.ctaHref} className="btn-primary mt-5">{identityBanner.ctaLabel}<Icon name="arrow-right" size={15} /></Link>}
              </div>
            </div>
          </div>
        )}
      </section>}
      </Fragment>

      <Fragment key="newsletter">
      <section className="border-b border-outline-variant bg-surface-dim py-16 text-center">
        <div className="canvas max-w-2xl">
          <p className="eyebrow mb-2 tracking-[0.22em]">Correspondances d&apos;exception</p>
          <h2 className="mb-2 font-serif text-[1.9rem] text-primary md:text-[2.2rem]">
            Cercle Privilège AGHARAS VISION
          </h2>
          <p className="mb-7 text-body-sm leading-relaxed text-on-surface-variant">
            L’inscription aux actualités n’est pas disponible pour le moment. Aucune adresse e-mail n’est enregistrée depuis cette page.
          </p>
        </div>
      </section>
      </Fragment>
    </OrderedSections>
  );
}
