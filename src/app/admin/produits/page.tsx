import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { accessSubject } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { formatDH } from "@/lib/money";
import { PRODUCT_TYPE_LABELS } from "@/lib/constants";
import { AdminEmpty, AdminPageHeader, Pagination } from "@/components/admin/AdminUI";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Produits" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string; categorie?: string; page?: string }>;
}) {
  const actor = await requirePermission("products.view");
  const canUpdate = hasPermission(accessSubject(actor), "products.update");
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const status =
    params.statut === "inactif"
      ? "inactif"
      : params.statut === "actif"
        ? "actif"
        : params.statut === "archives"
          ? "archives"
          : "";
  const categoryId = params.categorie ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = {
    ...(query
      ? {
          OR: [
            { name: { contains: query } },
            { sku: { contains: query } },
            { brand: { name: { contains: query } } },
          ],
        }
      : {}),
    ...(status === "archives"
      ? { archivedAt: { not: null } }
      : status
        ? { isActive: status === "actif", archivedAt: null }
        : { archivedAt: null }),
    ...(categoryId ? { categoryId } : {}),
  };

  const [products, total, categories, activeCount, allCount] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        brand: { select: { name: true } },
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        variants: {
          select: {
            isActive: true,
            inventory: { select: { quantity: true } },
          },
        },
      },
    }),
    db.product.count({ where }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
    db.product.count({ where: { isActive: true, archivedAt: null } }),
    db.product.count({ where: { archivedAt: null } }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Produits"
        description={`${activeCount} produit(s) actif(s) sur ${allCount}. Gérez les fiches, les coloris et la disponibilité.`}
        actions={
          <Link href="/admin/produits/nouveau" className="btn-primary btn-sm">
            <Icon name="plus" size={14} />
            Nouveau produit
          </Link>
        }
      />

      <form
        method="get"
        className="mb-4 flex flex-col gap-2 border border-outline-variant bg-white p-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="product-search" className="field-label">
            Rechercher
          </label>
          <input
            id="product-search"
            name="q"
            defaultValue={query}
            placeholder="Nom, SKU ou marque…"
            className="admin-input"
          />
        </div>
        <div className="sm:w-44">
          <label htmlFor="product-status" className="field-label">
            Statut
          </label>
          <select
            id="product-status"
            name="statut"
            defaultValue={status}
            className="admin-input"
          >
            <option value="">Tous</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
            <option value="archives">Archivés</option>
          </select>
        </div>
        <div className="sm:w-52">
          <label htmlFor="product-category" className="field-label">
            Catégorie
          </label>
          <select
            id="product-category"
            name="categorie"
            defaultValue={categoryId}
            className="admin-input"
          >
            <option value="">Toutes</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary btn-sm">
          Filtrer
        </button>
        {(query || status || categoryId) && (
          <Link href="/admin/produits" className="btn-quiet btn-sm">
            Réinitialiser
          </Link>
        )}
      </form>

      {products.length === 0 ? (
        <AdminEmpty
          title="Aucun produit trouvé"
          description="Ajustez les filtres ou créez un nouveau produit."
          action={
            <Link href="/admin/produits/nouveau" className="btn-primary btn-sm">
              Créer un produit
            </Link>
          }
        />
      ) : (
        <div className="overflow-x-auto border border-outline-variant bg-white">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Marque</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const stock = product.variants.reduce(
                  (sum, variant) => sum + (variant.inventory?.quantity ?? 0),
                  0,
                );
                const activeVariants = product.variants.filter(
                  (variant) => variant.isActive,
                ).length;
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        {product.images[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
                            alt=""
                            loading="lazy"
                            className="h-10 w-10 shrink-0 border border-outline-variant object-cover"
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-outline-variant bg-surface-dim text-outline">
                            <Icon name="glasses" size={16} />
                          </span>
                        )}
                        <div className="min-w-0">
                          <Link
                            href={
                              canUpdate
                                ? `/admin/produits/${product.slug}`
                                : `/produit/${product.slug}`
                            }
                            target={canUpdate ? undefined : "_blank"}
                            rel={canUpdate ? undefined : "noopener"}
                            className="block truncate font-medium text-primary hover:underline"
                          >
                            {product.name}
                          </Link>
                          <span className="block text-[0.66rem] text-on-surface-variant">
                            {product.sku} · {PRODUCT_TYPE_LABELS[product.type] ?? product.type}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="text-on-surface-variant">{product.brand.name}</td>
                    <td className="text-on-surface-variant">{product.category.name}</td>
                    <td className="whitespace-nowrap font-medium">
                      {formatDH(product.priceCents)}
                    </td>
                    <td>
                      <span
                        className={
                          stock === 0
                            ? "text-error"
                            : stock <= 3
                              ? "text-secondary"
                              : "text-on-surface-variant"
                        }
                      >
                        {stock} unité(s)
                      </span>
                      <span className="block text-[0.64rem] text-outline">
                        {activeVariants} coloris actif(s)
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          product.archivedAt
                            ? "badge"
                            : product.isActive
                              ? "badge-success"
                              : "badge"
                        }
                      >
                        {product.archivedAt
                          ? "Archivé"
                          : product.isActive
                            ? "Publié"
                            : "Brouillon"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-3 whitespace-nowrap text-[0.7rem]">
                        {canUpdate && (
                          <Link
                            href={`/admin/produits/${product.slug}`}
                            className="text-primary underline underline-offset-2 hover:no-underline"
                          >
                            Modifier
                          </Link>
                        )}
                        <Link
                          href={
                            product.isActive
                              ? `/produit/${product.slug}`
                              : `/admin/produits/${product.slug}/apercu`
                          }
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary"
                        >
                          {product.isActive ? "Voir" : "Aperçu"}
                          <Icon name="external" size={11} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        baseHref="/admin/produits"
        params={{ q: query, statut: status, categorie: categoryId }}
      />
    </>
  );
}
