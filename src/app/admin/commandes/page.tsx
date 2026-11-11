import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatDH } from "@/lib/money";
import { formatDateTimeFr } from "@/lib/utils";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import {
  AdminEmpty,
  AdminPageHeader,
  Pagination,
} from "@/components/admin/AdminUI";
import { OrderStatusBadge } from "@/components/site/OrderStatus";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Commandes" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "IN_PRODUCTION",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string; page?: string }>;
}) {
  await requirePermission("orders.view");
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const status = STATUSES.includes(params.statut as (typeof STATUSES)[number])
    ? (params.statut as string)
    : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = {
    ...(status ? { status: status as (typeof STATUSES)[number] } : {}),
    ...(query
      ? {
          OR: [
            { reference: { contains: query } },
            { email: { contains: query } },
            { firstName: { contains: query } },
            { lastName: { contains: query } },
            { phone: { contains: query } },
            { city: { contains: query } },
          ],
        }
      : {}),
  };

  const [orders, total, grouped] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { items: true } } },
    }),
    db.order.count({ where }),
    db.order.groupBy({ by: ["status"], _count: true }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const counts = Object.fromEntries(grouped.map((row) => [row.status, row._count]));

  const tabHref = (value: string) => {
    const search = new URLSearchParams();
    if (value) search.set("statut", value);
    if (query) search.set("q", query);
    const qs = search.toString();
    return qs ? `/admin/commandes?${qs}` : "/admin/commandes";
  };

  return (
    <>
      <AdminPageHeader
        eyebrow="Ventes"
        title="Commandes"
        description="Suivez la préparation, l'expédition et le règlement à la livraison. Les transitions de statut sont contrôlées côté serveur."
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Link
          href={tabHref("")}
          className={`border px-2.5 py-1.5 text-[0.68rem] uppercase tracking-[0.08em] ${
            status === ""
              ? "border-primary bg-primary text-white"
              : "border-outline-variant bg-white text-on-surface-variant hover:border-primary"
          }`}
        >
          Toutes
        </Link>
        {STATUSES.map((value) => (
          <Link
            key={value}
            href={tabHref(value)}
            className={`border px-2.5 py-1.5 text-[0.68rem] ${
              status === value
                ? "border-primary bg-primary text-white"
                : "border-outline-variant bg-white text-on-surface-variant hover:border-primary"
            }`}
          >
            {ORDER_STATUS_LABELS[value]}
            <span className="ml-1.5 text-[0.6rem] opacity-70">
              {counts[value] ?? 0}
            </span>
          </Link>
        ))}
      </div>

      <form
        method="get"
        className="mb-4 flex flex-col gap-2 border border-outline-variant bg-white p-3 sm:flex-row sm:items-end"
      >
        {status && <input type="hidden" name="statut" value={status} />}
        <div className="flex-1">
          <label htmlFor="order-search" className="field-label">
            Rechercher
          </label>
          <input
            id="order-search"
            name="q"
            defaultValue={query}
            placeholder="Référence, e-mail, nom, téléphone, ville…"
            className="admin-input"
          />
        </div>
        <button type="submit" className="btn-primary btn-sm">
          Rechercher
        </button>
        {query && (
          <Link href={tabHref("")} className="btn-quiet btn-sm">
            Effacer
          </Link>
        )}
      </form>

      {orders.length === 0 ? (
        <AdminEmpty
          title="Aucune commande"
          description="Les commandes correspondant à ces critères apparaîtront ici."
        />
      ) : (
        <div className="overflow-x-auto border border-outline-variant bg-white">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Ville</th>
                <th>Articles</th>
                <th>Total</th>
                <th>Paiement</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <Link
                      href={`/admin/commandes/${order.id}`}
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      {order.reference}
                      <Icon name="chevron-right" size={11} className="text-outline" />
                    </Link>
                  </td>
                  <td>
                    <span className="block text-primary">
                      {order.firstName} {order.lastName}
                    </span>
                    <span className="block text-[0.64rem] text-on-surface-variant">
                      {order.email}
                    </span>
                  </td>
                  <td className="text-on-surface-variant">{order.city}</td>
                  <td className="text-on-surface-variant">{order._count.items}</td>
                  <td className="whitespace-nowrap font-medium">
                    {formatDH(order.totalCents)}
                  </td>
                  <td className="text-[0.72rem]">
                    <span
                      className={
                        order.paymentStatus === "PAID"
                          ? "text-success"
                          : "text-on-surface-variant"
                      }
                    >
                      {PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus}
                    </span>
                    <span className="block text-[0.62rem] text-outline">À la livraison</span>
                  </td>
                  <td>
                    <OrderStatusBadge status={order.status} />
                  </td>
                  <td className="whitespace-nowrap text-[0.7rem] text-on-surface-variant">
                    {formatDateTimeFr(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        baseHref="/admin/commandes"
        params={{ q: query, statut: status }}
      />
    </>
  );
}
