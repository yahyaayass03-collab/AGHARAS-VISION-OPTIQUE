import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { accessSubject } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { allowedTransitions } from "@/lib/orders";
import { formatDH } from "@/lib/money";
import { formatDateTimeFr } from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  PRESCRIPTION_METHOD_LABELS,
} from "@/lib/constants";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { OrderStatusForm } from "@/components/admin/OrderStatusForm";
import { retryOrderEmailNotificationsAction } from "@/app/actions/admin/commerce";
import { OrderStatusBadge, OrderTimeline } from "@/components/site/OrderStatus";
import { Icon } from "@/components/ui/Icon";
import type { LensSnapshot } from "@/lib/cart";

export const metadata: Metadata = { title: "Détail de commande" };
export const dynamic = "force-dynamic";

function lensOf(value: unknown): LensSnapshot | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<LensSnapshot>;
  if (typeof candidate.lensPriceCents !== "number") return null;
  return candidate as LensSnapshot;
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const actor = await requirePermission("orders.view");
  const subject = accessSubject(actor);
  const canUpdate = hasPermission(subject, "orders.update");
  const canCancel = hasPermission(subject, "orders.cancel");

  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          prescription: {
            select: { id: true, status: true, method: true, originalFileName: true },
          },
        },
      },
      history: { orderBy: { createdAt: "desc" }, include: { user: { select: { firstName: true, lastName: true } } } },
      payments: true,
      shipments: true,
      emailNotifications: { orderBy: { createdAt: "asc" } },
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      redemption: { include: { coupon: { select: { code: true, type: true, value: true } } } },
    },
  });
  if (!order) notFound();

  const transitions = allowedTransitions(order.status).filter(
    (status) => status !== "CANCELLED" || canCancel,
  );
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <AdminPageHeader
        eyebrow="Commande"
        title={order.reference}
        description={`Créée le ${formatDateTimeFr(order.createdAt)} · ${
          ORDER_STATUS_LABELS[order.status] ?? order.status
        } · ${itemCount} article(s)`}
        actions={
          <>
            <OrderStatusBadge status={order.status} />
            <Link href="/admin/commandes" className="btn-quiet btn-sm">
              Retour aux commandes
            </Link>
          </>
        }
      />

      <section className="my-5 border border-outline-variant bg-white p-4">
        <h2 className="font-serif text-lg text-primary">Notifications e-mail</h2>
        {order.emailNotifications.length === 0 ? (
          <p className="mt-2 text-sm text-on-surface-variant">Aucune notification n'a été mise en file pour cette commande.</p>
        ) : (
          <ul className="mt-2 space-y-2 text-sm">
            {order.emailNotifications.map((notification) => (
              <li key={notification.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>{notification.kind === "OWNER_ORDER" ? "Notification propriétaire" : "Confirmation client"}</span>
                <span className="text-on-surface-variant">
                  {notification.status === "SENT" ? "Envoyée" : notification.status === "DISCARDED" ? "Écartée (workflow désactivé ou transport discard)" : notification.status === "SENDING" ? "En cours" : notification.status === "FAILED" ? `Échec (${notification.lastErrorCode ?? "erreur"})` : "En attente"}
                  {` · ${notification.attempts} tentative(s)`}
                </span>
              </li>
            ))}
          </ul>
        )}
        {canUpdate && order.emailNotifications.some((notification) => notification.status === "FAILED") && (
          <form action={retryOrderEmailNotificationsAction} className="mt-3">
            <input type="hidden" name="orderId" value={order.id} />
            <button type="submit" className="btn-outline btn-sm">Réessayer les notifications en échec</button>
          </form>
        )}
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <section className="border border-outline-variant bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant px-4 py-3">
              <h2 className="font-serif text-lg text-primary">Pièces commandées</h2>
              <span className="text-[0.65rem] uppercase tracking-[0.1em] text-outline">
                Instantané de commande — les prix sont figés
              </span>
            </div>
            <div className="divide-y divide-outline-variant/70">
              {order.items.map((item) => {
                const lens = lensOf(item.configuration);
                return (
                  <article key={item.id} className="flex flex-col gap-3 p-4 sm:flex-row">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center border border-outline-variant bg-surface-dim">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <Icon name="glasses" size={22} className="text-outline" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-[0.9rem] font-medium text-primary">
                            {item.productName}
                          </p>
                          <p className="text-[0.68rem] text-on-surface-variant">
                            {item.variantName ?? "—"} · SKU {item.sku} · Qté{" "}
                            {item.quantity}
                          </p>
                        </div>
                        <p className="font-medium text-primary">
                          {formatDH(item.lineTotalCents)}
                        </p>
                      </div>
                      <div className="mt-1.5 space-y-0.5 text-[0.72rem] text-on-surface-variant">
                        {lens?.lensTypeName ? (
                          <>
                            <p>
                              {lens.lensTypeName}
                              {lens.lensIndexValue
                                ? ` · indice ${lens.lensIndexValue}`
                                : ""}
                            </p>
                            {lens.treatments.length > 0 && (
                              <p>{lens.treatments.map((t) => t.name).join(" • ")}</p>
                            )}
                            {lens.prescriptionMethod && (
                              <p>
                                Ordonnance :{" "}
                                {PRESCRIPTION_METHOD_LABELS[lens.prescriptionMethod] ??
                                  lens.prescriptionMethod}
                              </p>
                            )}
                          </>
                        ) : (
                          <p>Monture seule / verres neutres</p>
                        )}
                        <p className="text-[0.66rem] text-outline">
                          Monture {formatDH(item.unitPriceCents)} + verres{" "}
                          {formatDH(item.lensPriceCents)}
                        </p>
                      </div>
                      {item.prescription && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.7rem]">
                          <span className="badge">{item.prescription.status}</span>
                          {item.prescription.originalFileName && (
                            <span className="text-on-surface-variant">
                              {item.prescription.originalFileName}
                            </span>
                          )}
                          <a
                            href={`/api/ordonnances/${item.prescription.id}`}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:no-underline"
                          >
                            <Icon name="download" size={11} />
                            Télécharger l&apos;ordonnance
                          </a>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            <dl className="space-y-2 border-t border-outline-variant px-4 py-4 text-[0.8rem]">
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">Sous-total</dt>
                <dd>{formatDH(order.subtotalCents)}</dd>
              </div>
              {order.discountCents > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">
                    Remise{order.couponCode ? ` (${order.couponCode})` : ""}
                  </dt>
                  <dd className="text-error">−{formatDH(order.discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">
                  {order.shippingMethodName}
                </dt>
                <dd>
                  {order.shippingCents === 0
                    ? "Offerte"
                    : formatDH(order.shippingCents)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-outline-variant pt-2">
                <dt className="font-serif text-base text-primary">Total TTC</dt>
                <dd className="text-lg font-semibold text-primary">
                  {formatDH(order.totalCents)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="border border-outline-variant bg-white p-4">
            <h2 className="mb-3 font-serif text-lg text-primary">
              Historique des statuts
            </h2>
            <OrderTimeline status={order.status} history={order.history} />
            <ul className="mt-5 space-y-2 border-t border-outline-variant pt-3">
              {order.history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 text-[0.72rem]"
                >
                  <span className="text-primary">
                    {entry.fromStatus
                      ? `${ORDER_STATUS_LABELS[entry.fromStatus] ?? entry.fromStatus} → `
                      : ""}
                    {ORDER_STATUS_LABELS[entry.toStatus] ?? entry.toStatus}
                    {entry.note ? ` — ${entry.note}` : ""}
                  </span>
                  <span className="text-outline">
                    {formatDateTimeFr(entry.createdAt)}
                    {entry.user ? ` · ${entry.user.firstName}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {canUpdate && (
            <section className="border border-outline-variant bg-white p-4">
              <h2 className="mb-3 font-serif text-lg text-primary">
                Mettre à jour le statut
              </h2>
              <OrderStatusForm
                orderId={order.id}
                currentStatus={order.status}
                allowed={transitions}
              />
            </section>
          )}
        </div>

        <aside className="space-y-4 xl:col-span-4">
          <section className="border border-outline-variant bg-white p-4">
            <h2 className="text-[0.62rem] uppercase tracking-[0.14em] text-secondary">
              Client
            </h2>
            <p className="mt-1.5 text-[0.85rem] font-medium text-primary">
              {order.firstName} {order.lastName}
            </p>
            <p className="text-[0.74rem] text-on-surface-variant">{order.email}</p>
            <p className="text-[0.74rem] text-on-surface-variant">{order.phone}</p>
            {order.user ? (
              <Link
                href={`/admin/clients/${order.user.id}`}
                className="mt-2 inline-flex items-center gap-1 text-[0.72rem] text-primary underline underline-offset-2 hover:no-underline"
              >
                Compte client
                <Icon name="chevron-right" size={11} />
              </Link>
            ) : (
              <p className="mt-2 text-[0.7rem] text-outline">Commande invité</p>
            )}
          </section>

          <section className="border border-outline-variant bg-white p-4">
            <h2 className="text-[0.62rem] uppercase tracking-[0.14em] text-secondary">
              Livraison
            </h2>
            <address className="mt-2 space-y-0.5 text-[0.78rem] not-italic leading-relaxed text-on-surface-variant">
              <span className="block text-primary">{order.addressLine1}</span>
              {order.addressLine2 && <span className="block">{order.addressLine2}</span>}
              <span className="block">
                {order.city}
                {order.postalCode ? `, ${order.postalCode}` : ""}
              </span>
              <span className="block">Maroc</span>
            </address>
            {order.deliveryNotes && (
              <p className="mt-2 border-t border-outline-variant pt-2 text-[0.72rem] text-on-surface-variant">
                Note : {order.deliveryNotes}
              </p>
            )}
            <p className="mt-2 border-t border-outline-variant pt-2 text-[0.72rem] text-primary">
              {order.shippingMethodName}
            </p>
            {order.shipments[0] && (
              <p className="mt-1 text-[0.7rem] text-on-surface-variant">
                Expédition : {order.shipments[0].status}
                {order.shipments[0].trackingNumber
                  ? ` · ${order.shipments[0].trackingNumber}`
                  : ""}
              </p>
            )}
          </section>

          <section className="border border-outline-variant bg-white p-4">
            <h2 className="text-[0.62rem] uppercase tracking-[0.14em] text-secondary">
              Règlement
            </h2>
            <p className="mt-1.5 text-[0.82rem] text-primary">
              {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}
            </p>
            <p className="text-[0.72rem] text-on-surface-variant">
              {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
            </p>
            {order.payments.map((payment) => (
              <p key={payment.id} className="mt-1 text-[0.68rem] text-outline">
                {formatDH(payment.amountCents)} ·{" "}
                {PAYMENT_STATUS_LABELS[payment.status] ?? payment.status}
              </p>
            ))}
            {order.redemption && (
              <p className="mt-2 border-t border-outline-variant pt-2 text-[0.7rem] text-secondary">
                Code {order.redemption.coupon.code} utilisé · remise{" "}
                {formatDH(order.discountCents)}
              </p>
            )}
          </section>

          <section className="border border-outline-variant bg-surface-dim p-4">
            <h2 className="text-[0.62rem] uppercase tracking-[0.14em] text-secondary">
              Références internes
            </h2>
            <dl className="mt-2 space-y-1.5 text-[0.7rem]">
              <div>
                <dt className="text-outline">Identifiant</dt>
                <dd className="break-all text-primary">{order.id}</dd>
              </div>
              <div>
                <dt className="text-outline">Clé d&apos;idempotence</dt>
                <dd className="break-all text-primary">
                  {order.idempotencyKey ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-outline">Jeton d&apos;accès client</dt>
                <dd className="break-all text-primary">
                  Protégé — non affiché côté administration
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </>
  );
}
