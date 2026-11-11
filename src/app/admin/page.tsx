import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatDH } from "@/lib/money";
import { formatDateTimeFr } from "@/lib/utils";
import { AdminPageHeader, AdminEmpty, StatCard } from "@/components/admin/AdminUI";
import { OrderStatusBadge } from "@/components/site/OrderStatus";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Tableau de bord" };
export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requirePermission("dashboard.view");

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    pendingOrders,
    orders30,
    delivered30,
    pendingPrescriptions,
    publishedProducts,
    draftProducts,
    lowStock,
    recentOrders,
    recentPrescriptions,
    newMessages,
  ] = await Promise.all([
    db.order.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { createdAt: { gte: since } } }),
    db.order.aggregate({
      where: { status: "DELIVERED", createdAt: { gte: since } },
      _sum: { totalCents: true },
      _count: true,
    }),
    db.prescription.count({ where: { status: "PENDING" } }),
    db.product.count({ where: { isActive: true, archivedAt: null } }),
    db.product.count({ where: { isActive: false, archivedAt: null } }),
    db.inventoryItem.findMany({
      where: { quantity: { lte: 3 } },
      orderBy: { quantity: "asc" },
      take: 5,
      include: {
        variant: { include: { product: { select: { name: true, slug: true } } } },
      },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        reference: true,
        firstName: true,
        lastName: true,
        city: true,
        totalCents: true,
        status: true,
        createdAt: true,
      },
    }),
    db.prescription.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      take: 4,
      select: {
        id: true,
        method: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
      },
    }),
    db.contactMessage.count({ where: { status: "NEW" } }),
  ]);

  const revenue = delivered30._sum.totalCents ?? 0;
  const averageBasket =
    delivered30._count > 0 ? Math.round(revenue / delivered30._count) : 0;
  const awaitingSettlement = await db.order.aggregate({
    where: { status: { notIn: ["CANCELLED", "DELIVERED"] } },
    _sum: { totalCents: true },
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Pilotage"
        title="Tableau de bord"
        description="Vue d'ensemble de l'activité, des commandes et des contrôles optiques en attente. Toutes les valeurs proviennent de la base, sans données simulées."
        actions={
          <Link href="/admin/commandes?statut=PENDING" className="btn-primary btn-sm">
            Commandes à confirmer ({pendingOrders})
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires livré (30 j)"
          value={formatDH(revenue)}
          hint={`${delivered30._count} commande(s) livrée(s)`}
          icon="bag"
          tone="gold"
          href="/admin/commandes?statut=DELIVERED"
        />
        <StatCard
          label="Panier moyen livré"
          value={formatDH(averageBasket)}
          hint="Commandes livrées sur 30 jours"
          icon="tag"
        />
        <StatCard
          label="À confirmer"
          value={String(pendingOrders)}
          hint="Commandes en attente de validation"
          icon="clock"
          tone={pendingOrders > 0 ? "alert" : "default"}
          href="/admin/commandes?statut=PENDING"
        />
        <StatCard
          label="Ordonnances à contrôler"
          value={String(pendingPrescriptions)}
          hint="Contrôle optique requis avant montage"
          icon="file"
          tone={pendingPrescriptions > 0 ? "alert" : "default"}
          href="/admin/ordonnances?statut=PENDING"
        />
        <StatCard
          label="Commandes (30 j)"
          value={String(orders30)}
          hint="Toutes statuts confondus"
          icon="list"
          href="/admin/commandes"
        />
        <StatCard
          label="Encours à la livraison"
          value={formatDH(awaitingSettlement._sum.totalCents ?? 0)}
          hint="Commandes clients non encore réglées (COD)"
          icon="truck"
        />
        <StatCard
          label="Produits publiés"
          value={String(publishedProducts)}
          hint={`${draftProducts} brouillon(s) à finaliser`}
          icon="glasses"
          href="/admin/produits"
        />
        <StatCard
          label="Messages non traités"
          value={String(newMessages)}
          hint="Demandes reçues via le formulaire de contact"
          icon="mail"
          tone={newMessages > 0 ? "alert" : "default"}
          href="/admin/messages"
        />
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-12">
        <section className="min-w-0 xl:col-span-8">
          <div className="border border-outline-variant bg-white">
            <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
              <h2 className="font-serif text-lg text-primary">Dernières commandes</h2>
              <Link
                href="/admin/commandes"
                className="text-[0.65rem] uppercase tracking-[0.12em] text-secondary hover:text-primary"
              >
                Tout voir
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="p-5">
                <AdminEmpty
                  title="Aucune commande"
                  description="Les commandes passées sur la boutique apparaîtront ici."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-admin">
                  <thead>
                    <tr>
                      <th>Référence</th>
                      <th>Client</th>
                      <th>Ville</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <Link
                            href={`/admin/commandes/${order.id}`}
                            className="font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {order.reference}
                          </Link>
                        </td>
                        <td>
                          {order.firstName} {order.lastName}
                        </td>
                        <td className="text-on-surface-variant">{order.city}</td>
                        <td className="whitespace-nowrap font-medium">
                          {formatDH(order.totalCents)}
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
          </div>

          <div className="mt-5 border border-outline-variant bg-white">
            <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
              <h2 className="font-serif text-lg text-primary">
                Alertes de stock
              </h2>
              <Link
                href="/admin/stock?filtre=bas"
                className="text-[0.65rem] uppercase tracking-[0.12em] text-secondary hover:text-primary"
              >
                Gérer le stock
              </Link>
            </div>
            {lowStock.length === 0 ? (
              <p className="px-4 py-5 text-[0.78rem] text-on-surface-variant">
                Aucun coloris sous le seuil d&apos;alerte.
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant">
                {lowStock.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-[0.78rem]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-primary">{entry.variant.product.name}</p>
                      <p className="text-[0.68rem] text-on-surface-variant">
                        {entry.variant.colorName} · {entry.variant.sku}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 border px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.1em] ${
                        entry.quantity === 0
                          ? "border-error/30 bg-error-container text-error"
                          : "border-gold/60 bg-gold/10 text-secondary"
                      }`}
                    >
                      {entry.quantity === 0 ? "Épuisé" : `${entry.quantity} restant(s)`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="min-w-0 space-y-4 xl:col-span-4">
          <div className="border border-outline-variant bg-white">
            <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
              <h2 className="font-serif text-lg text-primary">Ordonnances en attente</h2>
              <Link
                href="/admin/ordonnances"
                className="text-[0.65rem] uppercase tracking-[0.12em] text-secondary hover:text-primary"
              >
                Ouvrir
              </Link>
            </div>
            {recentPrescriptions.length === 0 ? (
              <p className="px-4 py-5 text-[0.78rem] text-on-surface-variant">
                Aucune ordonnance en attente de contrôle.
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant">
                {recentPrescriptions.map((entry) => (
                  <li key={entry.id} className="px-4 py-2.5">
                    <p className="text-[0.78rem] text-primary">
                      {entry.user
                        ? `${entry.user.firstName} ${entry.user.lastName}`
                        : "Client invité"}
                    </p>
                    <p className="text-[0.66rem] text-on-surface-variant">
                      Reçue le {formatDateTimeFr(entry.createdAt)} · {entry.method}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border border-outline-variant bg-primary p-4 text-white">
            <p className="text-[0.55rem] uppercase tracking-[0.18em] text-gold">
              Rappel
            </p>
            <p className="mt-1 font-serif text-lg leading-snug">
              Paiement à la livraison uniquement
            </p>
            <p className="mt-1.5 text-[0.74rem] leading-relaxed text-white/70">
              Aucun paiement en ligne n&apos;est encaissé. CMI reste indisponible
              tant qu&apos;une passerelle réelle n&apos;est pas intégrée et
              validée.
            </p>
          </div>

          <div className="border border-outline-variant bg-white p-4">
            <h2 className="font-serif text-lg text-primary">Accès rapide</h2>
            <ul className="mt-2 space-y-1.5 text-[0.78rem]">
              <li>
                <Link
                  href="/admin/produits/nouveau"
                  className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary"
                >
                  <Icon name="plus" size={13} /> Ajouter un produit
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/stock"
                  className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary"
                >
                  <Icon name="box" size={13} /> Ajuster le stock
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/promotions"
                  className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary"
                >
                  <Icon name="tag" size={13} /> Créer un code promo
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/contenu"
                  className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary"
                >
                  <Icon name="edit" size={13} /> Modifier une page
                </Link>
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <p className="mt-6 text-[0.68rem] leading-relaxed text-outline">
        Les indicateurs financiers sont calculés à partir des commandes
        réellement enregistrées. Les commandes annulées sont exclues des encours.
        Les montants sont stockés en centimes et affichés en dirhams.
      </p>
    </>
  );
}
