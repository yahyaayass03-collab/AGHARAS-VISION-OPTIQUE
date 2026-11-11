import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { accessSubject } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { formatDateTimeFr } from "@/lib/utils";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
  Pagination,
} from "@/components/admin/AdminUI";
import { StockAdjustForm } from "@/components/admin/StockAdjustForm";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Stock" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminStockPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtre?: string; page?: string }>;
}) {
  const actor = await requirePermission("inventory.view");
  const canAdjust = hasPermission(accessSubject(actor), "inventory.adjust");
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const filter = params.filtre === "bas" ? "bas" : params.filtre === "epuise" ? "epuise" : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = {
    ...(filter === "bas" ? { quantity: { lte: 3 } } : {}),
    ...(filter === "epuise" ? { quantity: 0 } : {}),
    ...(query
      ? {
          variant: {
            OR: [
              { sku: { contains: query } },
              { colorName: { contains: query } },
              {
                product: {
                  name: { contains: query },
                },
              },
            ],
          },
        }
      : {}),
  };

  const [items, total, lowCount, outCount] = await Promise.all([
    db.inventoryItem.findMany({
      where,
      orderBy: { quantity: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        variant: {
          include: {
            product: { select: { name: true, slug: true, sku: true } },
          },
        },
      },
    }),
    db.inventoryItem.count({ where }),
    db.inventoryItem.count({ where: { quantity: { lte: 3 } } }),
    db.inventoryItem.count({ where: { quantity: 0 } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const recentMovements = await db.inventoryMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: {
      variant: { include: { product: { select: { name: true } } } },
      user: { select: { firstName: true, lastName: true } },
    },
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Atelier"
        title="Stock & inventaire"
        description={`${lowCount} coloris sous le seuil d'alerte, dont ${outCount} épuisé(s). Chaque ajustement crée un mouvement tracé.`}
      />

      {!canAdjust && (
        <div className="mb-4">
          <AdminNotice>
            Votre rôle permet de consulter le stock, mais pas de l&apos;ajuster.
          </AdminNotice>
        </div>
      )}

      <form
        method="get"
        className="mb-4 flex flex-col gap-2 border border-outline-variant bg-white p-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="stock-search" className="field-label">
            Rechercher
          </label>
          <input
            id="stock-search"
            name="q"
            defaultValue={query}
            placeholder="Produit, coloris ou SKU…"
            className="admin-input"
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="stock-filter" className="field-label">
            Filtre
          </label>
          <select
            id="stock-filter"
            name="filtre"
            defaultValue={filter}
            className="admin-input"
          >
            <option value="">Tout le stock</option>
            <option value="bas">Stock bas (≤ 3)</option>
            <option value="epuise">Épuisé</option>
          </select>
        </div>
        <button type="submit" className="btn-primary btn-sm">
          Filtrer
        </button>
        {(query || filter) && (
          <Link href="/admin/stock" className="btn-quiet btn-sm">
            Réinitialiser
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <AdminEmpty
          title="Aucun coloris trouvé"
          description="Les coloris apparaissent ici dès qu'ils sont créés sur une fiche produit."
        />
      ) : (
        <div className="overflow-x-auto border border-outline-variant bg-white">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Coloris</th>
                <th>SKU</th>
                <th>Stock</th>
                {canAdjust && <th className="text-right">Ajustement</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link
                      href={`/admin/produits/${item.variant.product.slug}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {item.variant.product.name}
                    </Link>
                    <span className="block text-[0.64rem] text-outline">
                      {item.variant.product.sku}
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="h-3 w-3 border border-outline-variant"
                        style={{ backgroundColor: item.variant.colorHex }}
                      />
                      {item.variant.colorName}
                    </span>
                  </td>
                  <td className="text-[0.72rem] text-on-surface-variant">
                    {item.variant.sku}
                  </td>
                  <td>
                    <span
                      className={`inline-flex min-w-[2.2rem] justify-center border px-2 py-0.5 text-[0.72rem] ${
                        item.quantity === 0
                          ? "border-error/30 bg-error-container text-error"
                          : item.quantity <= item.lowStockThreshold
                            ? "border-gold/60 bg-gold/10 text-secondary"
                            : "border-outline-variant bg-surface-dim text-primary"
                      }`}
                    >
                      {item.quantity}
                    </span>
                    <span className="ml-1.5 text-[0.64rem] text-outline">
                      seuil {item.lowStockThreshold}
                    </span>
                  </td>
                  {canAdjust && (
                    <td>
                      <StockAdjustForm variantId={item.variantId} />
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        baseHref="/admin/stock"
        params={{ q: query, filtre: filter }}
      />

      <section className="mt-6">
        <h2 className="mb-2 font-serif text-xl text-primary">Derniers mouvements</h2>
        <div className="overflow-x-auto border border-outline-variant bg-white">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Date</th>
                <th>Produit</th>
                <th>Variante</th>
                <th>Mouvement</th>
                <th>Motif</th>
                <th>Acteur</th>
              </tr>
            </thead>
            <tbody>
              {recentMovements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-on-surface-variant">
                    Aucun mouvement enregistré.
                  </td>
                </tr>
              ) : (
                recentMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="whitespace-nowrap text-[0.7rem] text-on-surface-variant">
                      {formatDateTimeFr(movement.createdAt)}
                    </td>
                    <td>{movement.variant.product.name}</td>
                    <td className="text-on-surface-variant">
                      {movement.variant.colorName}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 font-medium ${
                          movement.delta > 0 ? "text-success" : "text-error"
                        }`}
                      >
                        <Icon
                          name={movement.delta > 0 ? "plus" : "minus"}
                          size={11}
                        />
                        {Math.abs(movement.delta)}
                      </span>
                      <span className="ml-1 text-[0.64rem] uppercase tracking-[0.08em] text-outline">
                        {movement.reason}
                      </span>
                    </td>
                    <td className="text-[0.72rem] text-on-surface-variant">
                      {movement.note ?? "—"}
                    </td>
                    <td className="text-[0.72rem] text-on-surface-variant">
                      {movement.user
                        ? `${movement.user.firstName} ${movement.user.lastName}`
                        : "Système"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
