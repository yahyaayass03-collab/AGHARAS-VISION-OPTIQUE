import type { Metadata } from "next";
import Link from "next/link";
import { getWishlistProducts } from "@/lib/wishlist";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { Icon } from "@/components/ui/Icon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mes favoris",
  description:
      "Retrouvez les montures et accessoires que vous avez enregistrés chez AGHARAS VISION.",
  alternates: { canonical: "/favoris" },
  robots: { index: false, follow: true },
};

export default async function WishlistPage() {
  const items = await getWishlistProducts();

  return (
    <div className="bg-surface">
      <div className="border-b border-outline-variant bg-surface-dim">
        <div className="canvas py-4">
          <nav
            aria-label="Fil d'Ariane"
            className="flex flex-wrap items-center gap-2 text-[0.68rem] uppercase tracking-[0.12em] text-on-surface-variant"
          >
            <Link href="/" className="hover:text-primary">
              Accueil
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-primary">Mes favoris</span>
          </nav>
        </div>
      </div>

      <div className="canvas py-8 lg:py-12">
        <div className="flex flex-col gap-3 border-b border-outline-variant pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Sélection personnelle</p>
            <h1 className="mt-1 font-serif text-[2.2rem] leading-tight text-primary md:text-[2.6rem]">
              Mes favoris
            </h1>
            <p className="mt-2 max-w-xl text-body-sm leading-relaxed text-on-surface-variant">
              Conservez les montures qui vous ont retenu. Vos favoris restent
              accessibles sur cet appareil, sans compte ni inscription.
            </p>
          </div>
          <span className="text-[0.65rem] uppercase tracking-[0.12em] text-outline">
            {items.length} pièce{items.length > 1 ? "s" : ""} enregistrée
            {items.length > 1 ? "s" : ""}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="mt-8 border border-outline-variant bg-white p-8 text-center md:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center bg-surface-dim text-primary">
              <Icon name="heart" size={30} />
            </div>
            <h2 className="mt-4 font-serif text-[1.6rem] text-primary">
              Votre carnet de favoris est vide
            </h2>
            <p className="mx-auto mt-2 max-w-md text-body-sm leading-relaxed text-on-surface-variant">
              Parcourez les collections et touchez le cœur d&apos;une monture pour
              la retrouver ici. Vous pourrez ensuite la configurer ou l&apos;offrir.
            </p>
            <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Link href="/catalogue" className="btn-primary w-full sm:w-auto">
                Découvrir les montures
              </Link>
              <Link href="/catalogue/solaires" className="btn-quiet w-full sm:w-auto">
                Collection solaire
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((entry) => (
              <ProductCard
                key={entry.id}
                product={entry.product as ProductCardData}
                saved
              />
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-3 border-t border-outline-variant pt-6 md:grid-cols-3">
          {[
            {
              icon: "store" as const,
              title: "Essai en salon",
              text: "Prenez rendez-vous pour essayer vos favoris dans un espace privé.",
            },
            {
              icon: "truck" as const,
              title: "Livraison au Maroc",
              text: "Expédition soignée et paiement à la réception.",
            },
            {
              icon: "shield" as const,
              title: "Conseil opticien",
              text: "Un opticien diplômé vérifie vos mesures et votre ordonnance.",
            },
          ].map((entry) => (
            <div key={entry.title} className="flex items-start gap-3 bg-surface-dim p-4">
              <Icon name={entry.icon} size={18} className="mt-0.5 shrink-0 text-secondary" />
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.1em] text-primary">
                  {entry.title}
                </p>
                <p className="mt-0.5 text-[0.72rem] leading-relaxed text-on-surface-variant">
                  {entry.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
