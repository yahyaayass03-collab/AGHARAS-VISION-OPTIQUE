import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatDH } from "@/lib/money";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PRESCRIPTION_METHOD_LABELS,
} from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";
import { OrderStatusBadge, OrderTimeline } from "@/components/site/OrderStatus";
import { PrintButton } from "@/components/site/PrintButton";
import { WHATSAPP_MESSAGES, whatsappHref } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirmation de commande",
  robots: { index: false, follow: false, nocache: true },
};

type LensConfig = {
  lensTypeName?: string;
  lensIndexValue?: string;
  treatments?: Array<{ name: string }>;
  summary?: string;
  prescriptionMethod?: string;
};

function lensConfig(value: unknown): LensConfig | null {
  if (!value || typeof value !== "object") return null;
  return value as LensConfig;
}

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const [{ reference }, query, settings] = await Promise.all([
    params,
    searchParams,
    getSettings(),
  ]);

  const token = Array.isArray(query.token) ? query.token[0] : query.token;

  const order = await db.order.findUnique({
    where: { reference },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      history: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      shipments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!order) notFound();

  const hasToken = Boolean(token && token === order.accessToken);
  if (!hasToken) notFound();

  const whatsapp = whatsappHref(
    settings["store.whatsapp"],
    WHATSAPP_MESSAGES.order,
  );
  const created = order.createdAt.toLocaleDateString("fr-MA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const payment = order.payments[0] ?? null;

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
            <span className="text-primary">Confirmation de commande</span>
          </nav>
        </div>
      </div>

      <div className="canvas py-10 lg:py-14">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="bg-primary p-4 text-gold">
            <Icon name="check" size={30} strokeWidth={2} />
          </div>
          <p className="mt-5 flex items-center gap-2 text-[0.62rem] uppercase tracking-[0.16em] text-secondary">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />
            {settings["store.name"]} · {settings["store.city"]}
          </p>
          <h1 className="mt-2 font-serif text-[2.1rem] leading-tight text-primary md:text-[2.8rem]">
            Merci pour votre commande
          </h1>
          <p className="mt-3 max-w-2xl text-body-md leading-relaxed text-on-surface-variant">
            Votre commande{" "}
            <span className="font-medium tracking-wide text-primary">
              {order.reference}
            </span>{" "}
            a bien été enregistrée auprès de notre atelier. Un conseiller vous
            contacte pour confirmer les détails et le créneau de livraison.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <PrintButton />
            <span className="inline-flex items-center gap-1.5 border border-outline-variant bg-white px-3 py-2 text-[0.62rem] uppercase tracking-[0.1em] text-on-surface-variant">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-secondary" />
              Atelier de calibrage informé
            </span>
          </div>
        </div>

        <div className="mt-8 border border-outline-variant bg-white p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-surface-dim text-primary">
                <Icon name="whatsapp" size={19} />
              </span>
              <div>
                <p className="text-[0.62rem] uppercase tracking-[0.12em] text-secondary">
                  Confirmation &amp; suivi
                </p>
                <p className="mt-1 text-body-sm leading-relaxed text-on-surface-variant">
                  Conservez votre référence{" "}
                  <strong className="font-medium text-primary">{order.reference}</strong>.
                  La confirmation est adressée à{" "}
                  <strong className="font-medium text-primary">{order.email}</strong>{" "}
                  et notre équipe peut vous joindre au {order.phone}.
                </p>
              </div>
            </div>
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary shrink-0 gap-2"
              aria-label="Contacter sur WhatsApp"
            >
              <Icon name="whatsapp" size={16} />
              Ouvrir WhatsApp
            </a>
          </div>
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-12">
          <section className="space-y-4 lg:col-span-5">
            <div className="border border-outline-variant bg-white p-5">
              <div className="flex items-center justify-between gap-3 border-b border-outline-variant pb-3">
                <h2 className="font-serif text-xl text-primary">
                  Synthèse de la commande
                </h2>
                <OrderStatusBadge status={order.status} />
              </div>

              <dl className="mt-4 space-y-3 text-body-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">Référence</dt>
                  <dd className="font-medium tracking-wide text-primary">
                    {order.reference}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">Date</dt>
                  <dd className="text-primary">{created}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-on-surface-variant">Règlement</dt>
                  <dd className="text-right">
                    <span className="block font-medium text-primary">
                      {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
                    </span>
                    <span className="text-[0.7rem] text-on-surface-variant">
                      {payment
                        ? PAYMENT_STATUS_LABELS[payment.status] ?? payment.status
                        : PAYMENT_STATUS_LABELS[order.paymentStatus]}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">Livraison</dt>
                  <dd className="text-right text-primary">
                    {order.shippingMethodName}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 bg-surface-dim p-4">
                <p className="text-[0.6rem] uppercase tracking-[0.12em] text-on-surface-variant">
                  Montant à préparer à la livraison
                </p>
                <p className="mt-1 font-serif text-3xl text-primary">
                  {formatDH(order.totalCents)}
                </p>
                <p className="mt-1 text-[0.65rem] uppercase tracking-[0.08em] text-outline">
                  TVA, montage et calibrage inclus
                </p>
              </div>

              {order.couponCode && order.discountCents > 0 && (
                <p className="mt-3 flex items-center gap-1.5 text-[0.72rem] text-secondary">
                  <Icon name="tag" size={13} />
                  Code {order.couponCode} appliqué : −{formatDH(order.discountCents)}
                </p>
              )}
            </div>

            <div className="border border-outline-variant bg-white p-5">
              <h2 className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.12em] text-primary">
                <Icon name="truck" size={16} className="text-secondary" />
                Adresse d&apos;expédition
              </h2>
              <address className="mt-3 bg-surface-dim p-4 text-body-sm not-italic leading-relaxed text-on-surface-variant">
                <span className="block font-medium text-primary">
                  {order.firstName} {order.lastName}
                </span>
                <span className="block">{order.addressLine1}</span>
                {order.addressLine2 && <span className="block">{order.addressLine2}</span>}
                <span className="block font-medium text-primary">
                  {order.city}
                  {order.postalCode ? `, ${order.postalCode}` : ""}
                </span>
                <span className="block">Maroc · {order.phone}</span>
                {order.deliveryNotes && (
                  <span className="mt-2 block border-t border-outline-variant pt-2 text-[0.72rem]">
                    Note : {order.deliveryNotes}
                  </span>
                )}
              </address>
            </div>

            <div className="border border-outline-variant bg-white p-5">
              <h2 className="mb-3 text-[0.68rem] uppercase tracking-[0.12em] text-primary">
                Statut &amp; suivi
              </h2>
              <OrderTimeline status={order.status} history={order.history} />
            </div>
          </section>

          <section className="space-y-4 lg:col-span-7">
            <div className="border border-outline-variant bg-white p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-outline-variant pb-3">
                <h2 className="font-serif text-xl text-primary">
                  Pièces optiques commandées
                </h2>
                <span className="text-[0.6rem] uppercase tracking-[0.1em] text-outline">
                  {itemCount} article{itemCount > 1 ? "s" : ""}
                </span>
              </div>

              <div className="divide-y divide-outline-variant/70">
                {order.items.map((item) => {
                  const config = lensConfig(item.configuration);
                  return (
                    <article key={item.id} className="flex gap-4 py-4">
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden bg-surface-dim">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.productName}
                            fill
                            sizes="96px"
                            className="object-contain p-2"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center text-outline">
                            <Icon name="glasses" size={32} />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-serif text-lg leading-tight text-primary">
                              {item.productName}
                            </h3>
                            <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.08em] text-secondary">
                              {item.variantName} · Réf. {item.sku}
                            </p>
                          </div>
                          <p className="shrink-0 text-body-sm font-semibold text-primary">
                            {formatDH(item.lineTotalCents)}
                          </p>
                        </div>

                        <div className="mt-2 space-y-1 text-[0.75rem] text-on-surface-variant">
                          {config?.lensTypeName ? (
                            <>
                              <p className="flex items-start gap-1.5">
                                <Icon
                                  name="lens"
                                  size={13}
                                  className="mt-0.5 shrink-0 text-secondary"
                                />
                                {config.lensTypeName}
                                {config.lensIndexValue
                                  ? ` — indice ${config.lensIndexValue}`
                                  : ""}
                              </p>
                              {config.treatments && config.treatments.length > 0 && (
                                <p className="flex items-start gap-1.5">
                                  <Icon
                                    name="sparkle"
                                    size={13}
                                    className="mt-0.5 shrink-0 text-secondary"
                                  />
                                  {config.treatments.map((t) => t.name).join(" • ")}
                                </p>
                              )}
                              {config.prescriptionMethod && (
                                <p className="flex items-start gap-1.5">
                                  <Icon
                                    name="file"
                                    size={13}
                                    className="mt-0.5 shrink-0 text-secondary"
                                  />
                                  Ordonnance :{" "}
                                  {PRESCRIPTION_METHOD_LABELS[config.prescriptionMethod] ??
                                    config.prescriptionMethod}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="flex items-center gap-1.5">
                              <Icon name="glasses" size={13} className="text-secondary" />
                              Monture seule — prête pour équipement optique
                            </p>
                          )}
                          <p className="text-[0.68rem] text-outline">
                            Quantité : {item.quantity} · Prix unitaire{" "}
                            {formatDH(item.unitPriceCents)}
                            {item.lensPriceCents > 0
                              ? ` + verres ${formatDH(item.lensPriceCents)}`
                              : ""}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <dl className="mt-2 space-y-2 border-t border-outline-variant pt-4 text-body-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">Sous-total</dt>
                  <dd className="text-primary">{formatDH(order.subtotalCents)}</dd>
                </div>
                {order.discountCents > 0 && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-on-surface-variant">
                      Remise {order.couponCode ? `(${order.couponCode})` : ""}
                    </dt>
                    <dd className="text-error">−{formatDH(order.discountCents)}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-on-surface-variant">{order.shippingMethodName}</dt>
                  <dd className={order.shippingCents === 0 ? "text-secondary" : "text-primary"}>
                    {order.shippingCents === 0 ? "Offerte" : formatDH(order.shippingCents)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-t border-outline-variant pt-3">
                  <dt className="font-serif text-lg text-primary">Total TTC</dt>
                  <dd className="text-xl font-semibold text-primary">
                    {formatDH(order.totalCents)}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="border border-outline-variant bg-white p-5">
              <h2 className="font-serif text-xl text-primary">Et maintenant ?</h2>
              <ol className="mt-3 space-y-3">
                {[
                  {
                    title: "Vérification par un opticien",
                    text: "Nous contrôlons votre ordonnance et les mesures avant tout montage. Un conseiller peut vous appeler pour préciser un détail.",
                  },
                  {
                    title: "Montage en atelier",
                    text: "Les verres sont taillés et montés dans notre atelier, puis contrôlés au banc optique.",
                  },
                  {
                    title: "Expédition suivie",
                     text: "Vous êtes contacté pour convenir du créneau de livraison. Le paiement s'effectue à la réception.",
                  },
                ].map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-outline-variant text-[0.6rem] text-secondary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-body-sm font-medium text-primary">{step.title}</p>
                      <p className="mt-0.5 text-[0.75rem] leading-relaxed text-on-surface-variant">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-4 border-t border-outline-variant pt-3 text-[0.7rem] leading-relaxed text-outline">
                Aucun paiement en ligne n&apos;est effectué sur ce site. Le
                paiement à la livraison est le seul mode actif.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <p className="flex-1 border border-outline-variant bg-surface-dim px-4 py-3 text-body-sm text-on-surface-variant">
                Conservez le lien confidentiel de cette page pour consulter votre commande sans compte.
              </p>
              <Link href="/catalogue" className="btn-quiet flex-1">
                Continuer mes achats
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
