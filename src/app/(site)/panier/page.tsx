import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCartView } from "@/lib/cart";
import { formatDH } from "@/lib/money";
import { PRESCRIPTION_METHOD_LABELS } from "@/lib/constants";
import { getWishlistProductIds } from "@/lib/wishlist";
import {
  removeCartItemAction,
  removeCouponAction,
  updateCartItemAction,
} from "@/app/actions/cart";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/site/Price";
import { ProductCard, type ProductCardData } from "@/components/site/ProductCard";
import { CouponForm } from "@/components/site/CouponForm";
import { evaluateOpticalCompatibility, opticalCombinationFromSnapshot } from "@/lib/optical-compatibility-db";
import { OPTICAL_REVIEW_MESSAGE } from "@/lib/optical-compatibility";
import { getSettings } from "@/lib/settings";
import { WHATSAPP_MESSAGES, whatsappHref } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mon panier",
  description:
    "Retrouvez votre sélection de montures, verres et accessoires chez AGHARAS VISION. Paiement à la livraison partout au Maroc.",
  alternates: { canonical: "/panier" },
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const [cart, settings] = await Promise.all([getCartView(), getSettings()]);
  const whatsapp = whatsappHref(settings["store.whatsapp"], WHATSAPP_MESSAGES.cart);
  const whatsappCompatibility = whatsappHref(
    settings["store.whatsapp"],
    WHATSAPP_MESSAGES.compatibility,
  );
  const unavailable = (await Promise.all(cart.items.map(async (item) => {
    const combination = opticalCombinationFromSnapshot(item.productId, item.variantId, item.lens);
    return combination ? !(await evaluateOpticalCompatibility(db, combination)).allowed : false;
  }))).some(Boolean);

  if (cart.items.length === 0) {
    const [suggestions, wishlist] = await Promise.all([
      db.product.findMany({
         where: { isActive: true, isBestseller: true, category: { isActive: true }, brand: { isActive: true } },
        orderBy: { createdAt: "desc" },
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
    ]);

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
              <span className="text-primary">Panier d&apos;achat</span>
            </nav>
          </div>
        </div>

        <div className="canvas py-12 lg:py-16">
          <div className="mx-auto max-w-3xl border border-outline-variant bg-white p-8 text-center md:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center bg-surface-dim text-primary">
              <Icon name="bag" size={36} />
            </div>
            <p className="eyebrow mt-6 block">Votre sélection actuelle</p>
            <h1 className="mt-2 font-serif text-[2rem] leading-tight text-primary md:text-[2.6rem]">
              Votre panier est actuellement vide
            </h1>
            <p className="mx-auto mt-3 max-w-lg text-body-md leading-relaxed text-on-surface-variant">
              Prenez le temps d&apos;explorer nos collections de montures
              optiques, solaires et accessoires, sélectionnées par nos opticiens.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/catalogue" className="btn-primary w-full sm:w-auto">
                Découvrir les montures
              </Link>
              <Link
                href="/catalogue/solaires"
                className="btn-quiet w-full sm:w-auto"
              >
                Collection solaire
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-2 border-t border-outline-variant pt-6 text-left md:grid-cols-4">
              {[
                {
                  label: "Service atelier",
                  title: "Conseil opticien",
                  text: "Un opticien diplômé vous accompagne par WhatsApp ou en salon.",
                },
                {
                  label: "Mesure de précision",
                  title: "Centrage numérique",
                  text: "Les mesures sont vérifiées avant la taille des verres.",
                },
                {
                  label: "Logistique",
                  title: "Partout au Maroc",
                  text: "Expédition sous 48 à 72 heures ouvrées avec suivi.",
                },
                {
                  label: "Écrin",
                  title: "Étui et chiffon",
                  text: "Chaque monture est livrée dans son étui de protection.",
                },
              ].map((entry) => (
                <div key={entry.label} className="bg-surface-dim p-3">
                  <span className="block text-[0.55rem] uppercase tracking-[0.12em] text-outline">
                    {entry.label}
                  </span>
                  <span className="mt-1 block font-serif text-[0.95rem] text-primary">
                    {entry.title}
                  </span>
                  <p className="mt-1 text-[0.7rem] leading-relaxed text-on-surface-variant">
                    {entry.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {suggestions.length > 0 && (
            <section className="mt-12">
              <SectionHeading
                eyebrow="Sélection de la maison"
                title="Nos pièces les plus convoitées"
                action={{ label: "Tout le catalogue", href: "/catalogue" }}
              />
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {suggestions.map((entry) => (
                  <ProductCard
                    key={entry.id}
                    product={entry as ProductCardData}
                    saved={wishlist.has(entry.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    );
  }

  const threshold = cart.freeShippingThresholdCents;
  const remaining = threshold ? Math.max(0, threshold - cart.subtotalCents) : 0;
  const progress =
    threshold && threshold > 0
      ? Math.min(100, Math.round((cart.subtotalCents / threshold) * 100))
      : 100;

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
            <span className="text-primary">Panier d&apos;achat</span>
          </nav>
        </div>
      </div>

      <div className="canvas py-8 lg:py-12">
        {unavailable && (
          <div role="alert" className="mb-5 border border-error bg-white p-4 text-body-sm text-error">
            <p>{OPTICAL_REVIEW_MESSAGE} Vous pouvez retirer l&apos;article du panier.</p>
            <a
              href={whatsappCompatibility}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 font-medium underline"
              aria-label="Contacter sur WhatsApp"
            >
              <Icon name="whatsapp" size={14} />
              Besoin d&apos;aide ? Écrivez-nous sur WhatsApp
            </a>
          </div>
        )}
        <div className="mb-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="font-serif text-[2.2rem] leading-tight text-primary md:text-[2.6rem]">
                Mon panier
              </h1>
              <span className="text-[0.68rem] uppercase tracking-[0.14em] text-outline">
                {cart.itemCount} article{cart.itemCount > 1 ? "s" : ""}
              </span>
            </div>
            <p className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.12em] text-secondary">
              <Icon name="shield" size={15} />
              Informations de commande examinées avant le montage
            </p>
          </div>

          <p className="mt-3">
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[0.7rem] text-secondary hover:underline"
              aria-label="Contacter sur WhatsApp"
            >
              <Icon name="whatsapp" size={14} />
              Besoin d&apos;aide ? Écrivez-nous sur WhatsApp
            </a>
          </p>

          {threshold && (
            <div className="mt-5 bg-surface-container p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Icon
                    name="truck"
                    size={22}
                    className="shrink-0 text-secondary"
                  />
                  <div>
                    <p className="text-body-sm font-medium text-primary">
                      {remaining === 0
                        ? "Livraison offerte partout au Maroc"
                        : `Plus que ${formatDH(remaining)} pour la livraison offerte`}
                    </p>
                    <p className="text-[0.72rem] text-on-surface-variant">
                      Seuil de {formatDH(threshold)} — sous-total actuel :{" "}
                      {formatDH(cart.subtotalCents)}
                    </p>
                  </div>
                </div>
                <div
                  className="h-1.5 w-full overflow-hidden bg-surface-container-high md:w-64"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label="Progression vers la livraison offerte"
                >
                  <div
                    className="h-full bg-secondary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-7">
            {cart.items.map((item) => (
              <article
                key={item.id}
                className="grid gap-4 border border-outline-variant bg-white p-4 sm:grid-cols-12 md:p-5"
              >
                <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-surface-dim sm:col-span-4">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 220px"
                      className="object-contain p-3"
                    />
                  ) : (
                    <Icon name="glasses" size={48} className="text-outline" />
                  )}
                  <span className="absolute left-2 top-2 bg-white/90 px-1.5 py-0.5 text-[0.55rem] uppercase tracking-[0.12em] text-primary">
                    {item.colorName}
                  </span>
                </div>

                <div className="flex flex-col justify-between sm:col-span-8">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.6rem] uppercase tracking-[0.14em] text-secondary">
                          Réf. {item.sku}
                        </p>
                        <h2 className="mt-0.5 font-serif text-xl leading-tight text-primary">
                          <Link
                            href={`/produit/${item.slug}`}
                            className="hover:text-secondary"
                          >
                            {item.name}
                          </Link>
                        </h2>
                      </div>
                      <p className="shrink-0 text-right text-body-md font-semibold text-primary">
                        {formatDH(item.lineTotalCents)}
                      </p>
                    </div>

                    <div className="mt-3 bg-surface-dim p-3">
                      {item.lens ? (
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-3 text-body-sm">
                            <span className="flex items-start gap-1.5 text-on-surface">
                              <Icon
                                name="eye"
                                size={15}
                                className="mt-0.5 text-secondary"
                              />
                              {item.lens.lensTypeName ?? "Verres"}
                              {item.lens.lensIndexValue
                                ? ` — indice ${item.lens.lensIndexValue}`
                                : ""}
                            </span>
                            <span className="shrink-0 text-on-surface-variant">
                              {item.lens.lensPriceCents > 0
                                ? `+ ${formatDH(item.lens.lensPriceCents)}`
                                : "Inclus"}
                            </span>
                          </div>
                          {item.lens.treatments.length > 0 && (
                            <div className="flex items-start justify-between gap-3 text-body-sm">
                              <span className="flex items-start gap-1.5 text-on-surface">
                                <Icon
                                  name="sparkle"
                                  size={15}
                                  className="mt-0.5 text-secondary"
                                />
                                {item.lens.treatments
                                  .map((treatment) => treatment.name)
                                  .join(" • ")}
                              </span>
                              <span className="shrink-0 text-on-surface-variant">
                                inclus dans la configuration
                              </span>
                            </div>
                          )}
                          <p className="flex flex-wrap items-center justify-between gap-2 border-t border-outline-variant/60 pt-1.5 text-[0.66rem] uppercase tracking-[0.08em] text-outline">
                            <span>
                              Ordonnance :{" "}
                              {item.lens.prescriptionMethod
                                ? (PRESCRIPTION_METHOD_LABELS[
                                    item.lens.prescriptionMethod
                                  ] ?? item.lens.prescriptionMethod)
                                : "non requise"}
                            </span>
                            <span className="text-secondary">
                              Vérification opticien requise
                            </span>
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-3 text-body-sm">
                          <span className="flex items-center gap-1.5 text-on-surface">
                            <Icon
                              name="check"
                              size={15}
                              className="text-secondary"
                            />
                            Monture seule — prête pour équipement optique
                          </span>
                          <span className="text-[0.68rem] uppercase tracking-[0.08em] text-outline">
                            {formatDH(item.unitPriceCents)}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.stock === 0 ? (
                      <p className="mt-2 flex items-center gap-1.5 text-[0.7rem] text-error">
                        <Icon name="alert" size={13} />
                        Ce coloris n&apos;est plus en stock. Retirez-le pour
                        finaliser votre commande.
                      </p>
                    ) : item.stock <= 3 ? (
                      <p className="mt-2 text-[0.7rem] text-secondary">
                        Stock limité — {item.stock} exemplaire(s) disponible(s).
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant pt-3">
                    <form
                      action={updateCartItemAction}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="itemId" value={item.id} />
                      <span className="text-[0.6rem] uppercase tracking-[0.12em] text-outline">
                        Qté
                      </span>
                      <div className="flex items-center border border-outline-variant">
                        <button
                          type="submit"
                          name="quantity"
                          value={item.quantity - 1}
                          className="flex h-8 w-8 items-center justify-center text-primary hover:bg-surface-dim disabled:opacity-40"
                          aria-label={`Diminuer la quantité de ${item.name}`}
                        >
                          <Icon name="minus" size={13} />
                        </button>
                        <span
                          className="w-8 text-center text-body-sm"
                          aria-live="polite"
                        >
                          {item.quantity}
                        </span>
                        <button
                          type="submit"
                          name="quantity"
                          value={item.quantity + 1}
                          disabled={item.quantity >= 5 || item.quantity >= item.stock}
                          className="flex h-8 w-8 items-center justify-center text-primary hover:bg-surface-dim disabled:opacity-40"
                          aria-label={`Augmenter la quantité de ${item.name}`}
                        >
                          <Icon name="plus" size={13} />
                        </button>
                      </div>
                    </form>

                    <div className="flex items-center gap-4">
                      <Link
                        href={
                          item.lens
                            ? `/configurateur/${item.slug}?variant=${item.variantId}`
                            : `/produit/${item.slug}`
                        }
                        className="inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.1em] text-primary underline decoration-outline-variant underline-offset-4 hover:text-secondary"
                      >
                        {item.lens ? "Modifier les verres" : "Voir la monture"}
                      </Link>
                      <form action={removeCartItemAction}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.1em] text-error hover:opacity-75"
                        >
                          <Icon name="close" size={13} />
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            <div className="flex items-start gap-3 border border-outline-variant bg-surface-dim p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary text-white">
                <Icon name="shield" size={18} />
              </span>
              <div>
                <h2 className="text-[0.65rem] uppercase tracking-[0.12em] text-primary">
                  Prise en charge médicale
                </h2>
                <p className="mt-1 text-[0.76rem] leading-relaxed text-on-surface-variant">
                  Les éventuels documents de remboursement dépendent de votre
                  organisme. Renseignez-vous auprès de celui-ci sur les pièces
                  requises avant votre achat.
                </p>
              </div>
            </div>

            <Link
              href="/catalogue"
              className="inline-flex items-center gap-2 self-start text-[0.65rem] uppercase tracking-[0.12em] text-primary hover:text-secondary"
            >
              <Icon name="arrow-left" size={15} />
              Continuer mes achats
            </Link>
          </div>

          <aside className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="border border-outline-variant bg-white p-5 md:p-6">
              <h2 className="font-serif text-xl text-primary">
                Récapitulatif de commande
              </h2>

              <dl className="mt-4 space-y-2.5 border-b border-outline-variant pb-4 text-body-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">
                    Montures, verres &amp; accessoires
                  </dt>
                  <dd className="text-primary">{formatDH(cart.subtotalCents)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">
                    Façonnage &amp; montage atelier
                  </dt>
                  <dd className="text-[0.62rem] uppercase tracking-[0.1em] text-secondary">
                    Inclus
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">
                    {cart.shippingName}
                  </dt>
                  <dd
                    className={
                      cart.shippingCents === 0
                        ? "text-[0.62rem] uppercase tracking-[0.1em] text-secondary"
                        : "text-primary"
                    }
                  >
                    {cart.shippingCents === 0
                      ? "Offerte"
                      : formatDH(cart.shippingCents)}
                  </dd>
                </div>
                {cart.discountCents > 0 && (
                  <div className="flex items-center justify-between gap-3 bg-surface-dim px-2 py-1.5">
                    <dt className="flex items-center gap-1.5 text-primary">
                      <Icon name="tag" size={14} className="text-secondary" />
                      <span className="text-[0.62rem] uppercase tracking-[0.1em]">
                        {cart.couponCode}
                      </span>
                      {cart.couponLabel && (
                        <span className="text-[0.68rem] text-outline">
                          ({cart.couponLabel})
                        </span>
                      )}
                    </dt>
                    <dd className="flex items-center gap-2 text-error">
                      −{formatDH(cart.discountCents)}
                      <form action={removeCouponAction}>
                        <button
                          type="submit"
                          aria-label="Retirer le code promo"
                          className="text-outline hover:text-error"
                        >
                          <Icon name="close" size={13} />
                        </button>
                      </form>
                    </dd>
                  </div>
                )}
                {cart.couponError && (
                  <p className="flex items-start gap-1.5 bg-error-container/50 px-2 py-1.5 text-[0.72rem] text-error">
                    <Icon name="alert" size={13} className="mt-0.5" />
                    {cart.couponError}
                  </p>
                )}
              </dl>

              <div className="flex items-baseline justify-between py-4">
                <div>
                  <p className="font-serif text-xl text-primary">Total TTC</p>
                  <p className="text-[0.62rem] uppercase tracking-[0.1em] text-outline">
                    TVA marocaine incluse
                  </p>
                </div>
                <p className="text-2xl font-semibold text-primary">
                  {formatDH(cart.totalCents)}
                </p>
              </div>

              <div className="border-t border-outline-variant pt-4">
                <p className="mb-2 text-[0.6rem] uppercase tracking-[0.12em] text-outline">
                  Code privilège ou invitation
                </p>
                <CouponForm initialCode={cart.couponCode} />
              </div>

              <div className="mt-5 space-y-2">
                <Link href="/commande" className="btn-primary w-full gap-2 py-3.5">
                  Finaliser la commande
                  <Icon name="arrow-right" size={16} />
                </Link>
                <p className="text-center text-[0.68rem] leading-relaxed text-outline">
                  Paiement à la livraison uniquement. Aucun débit en ligne.
                </p>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 border-t border-outline-variant pt-4 text-center">
                {[
                  { icon: "lock" as const, label: "Paiement sécurisé" },
                  { icon: "shield" as const, label: "Conditions de garantie" },
                  { icon: "truck" as const, label: "Essai 48 h" },
                ].map((entry) => (
                  <div key={entry.label} className="space-y-1">
                    <Icon
                      name={entry.icon}
                      size={18}
                      className="mx-auto text-primary"
                    />
                    <span className="block text-[0.55rem] uppercase tracking-[0.1em] text-on-surface-variant">
                      {entry.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border border-outline-variant bg-surface-dim p-4">
              <p className="text-[0.75rem] text-on-surface-variant">
                Une question sur vos verres ?
              </p>
              <Link
                href="/contact"
                className="text-[0.62rem] uppercase tracking-[0.1em] text-primary hover:text-secondary"
              >
                Conseil opticien →
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
