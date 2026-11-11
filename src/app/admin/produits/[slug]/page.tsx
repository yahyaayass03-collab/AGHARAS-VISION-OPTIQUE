import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatDH } from "@/lib/money";
import { toggleProductActiveAction, toggleVariantAction, archiveProductAction } from "@/app/actions/admin/catalog";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { ProductForm } from "@/components/admin/ProductForm";
import { VariantForm } from "@/components/admin/VariantForm";
import { ConfirmButton } from "@/components/admin/FormBits";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Modifier un produit" };
export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requirePermission("products.update");
  const { slug } = await params;

  const product = await db.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        orderBy: { sortOrder: "asc" },
        include: { inventory: true },
      },
    },
  });
  if (!product) notFound();

  const [brands, categories] = await Promise.all([
    db.brand.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title={product.name}
        description={`${product.sku} · ${formatDH(product.priceCents)} · ${
          product.variants.length
        } coloris`}
        actions={
          <>
            <Link
              href={product.isActive ? `/produit/${product.slug}` : `/admin/produits/${product.slug}/apercu`}
              target="_blank"
              rel="noopener"
              className="btn-quiet btn-sm"
            >
              <Icon name="external" size={13} />
               {product.isActive ? "Voir la fiche" : "Prévisualiser"}
            </Link>
            <Link href="/admin/produits" className="btn-quiet btn-sm">
              Retour
            </Link>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2 border border-outline-variant bg-white px-4 py-3">
        <span className={product.isActive ? "badge-success" : "badge"}>
           {product.archivedAt
             ? "Archivé"
             : product.isActive
               ? "Publié"
               : "Brouillon / dépublié"}
        </span>
        <span className="text-[0.7rem] text-on-surface-variant">
          Mis à jour le{" "}
          {product.updatedAt.toLocaleDateString("fr-MA", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </span>
        {!product.archivedAt && (
          <form action={toggleProductActiveAction} className="ml-auto">
            <input type="hidden" name="id" value={product.id} />
            <ConfirmButton
              label={product.isActive ? "Dépublier" : "Publier"}
              message={
                product.isActive
                  ? "Désactiver ce produit ? Il ne sera plus commandable sur la boutique."
                  : "Publier ce produit sur la boutique ?"
              }
              className="text-[0.7rem] text-primary underline underline-offset-2 hover:no-underline"
            />
          </form>
        )}
        <form
          action={archiveProductAction}
          className={product.archivedAt ? "ml-auto" : undefined}
        >
          <input type="hidden" name="id" value={product.id} />
          {product.archivedAt && <input type="hidden" name="restore" value="1" />}
          <ConfirmButton
            label={product.archivedAt ? "Restaurer le produit" : "Archiver"}
            message={
              product.archivedAt
                ? "Restaurer ce produit en brouillon ? Il faudra le publier pour le remettre en vente."
                : "Archiver ce produit ? Il sera retiré de la boutique sans supprimer son historique."
            }
            className="text-[0.7rem] text-error underline underline-offset-2 hover:no-underline"
          />
        </form>
      </div>

      <ProductForm
        product={{
          id: product.id,
          name: product.name,
          slug: product.slug,
          subtitle: product.subtitle,
          description: product.description,
          story: product.story,
          brandId: product.brandId,
          categoryId: product.categoryId,
          type: product.type,
          gender: product.gender,
          material: product.material,
          shape: product.shape,
          sku: product.sku,
          priceCents: product.priceCents,
          compareAtCents: product.compareAtCents,
          badge: product.badge,
          isActive: product.isActive,
          isFeatured: product.isFeatured,
          isNew: product.isNew,
          isBestseller: product.isBestseller,
          lensCompatible: product.lensCompatible,
          weightGrams: product.weightGrams,
          lensWidthMm: product.lensWidthMm,
          bridgeMm: product.bridgeMm,
          templeLengthMm: product.templeLengthMm,
          images: product.images.map((image) => ({ url: image.url })),
        }}
        brands={brands}
        categories={categories}
      />

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between border-b border-outline-variant pb-2">
          <div>
            <h2 className="font-serif text-2xl text-primary">Coloris & stock</h2>
            <p className="mt-1 text-[0.76rem] text-on-surface-variant">
              Chaque coloris possède sa propre référence et son stock. Les
              mouvements sont tracés dans le journal d&apos;inventaire.
            </p>
          </div>
          <Link href="/admin/stock" className="text-[0.7rem] text-secondary hover:text-primary">
            Ajuster le stock
          </Link>
        </div>

        {product.variants.length === 0 ? (
          <p className="mb-4 border border-dashed border-outline-variant bg-white px-4 py-4 text-[0.78rem] text-on-surface-variant">
            Aucun coloris. Ajoutez-en un pour rendre le produit commandable.
          </p>
        ) : (
          <div className="mb-4 overflow-x-auto border border-outline-variant bg-white">
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Coloris</th>
                  <th>SKU</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>État</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {product.variants.map((variant) => {
                  const quantity = variant.inventory?.quantity ?? 0;
                  return (
                    <tr key={variant.id}>
                      <td>
                        <span className="inline-flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className="h-3.5 w-3.5 border border-outline-variant"
                            style={{ backgroundColor: variant.colorHex }}
                          />
                          {variant.colorName}
                        </span>
                      </td>
                      <td className="text-on-surface-variant">{variant.sku}</td>
                      <td className="whitespace-nowrap">
                        {variant.priceCents
                          ? formatDH(variant.priceCents)
                          : `${formatDH(product.priceCents)} (hérité)`}
                      </td>
                      <td>
                        <span
                          className={
                            quantity === 0
                              ? "text-error"
                              : quantity <= 3
                                ? "text-secondary"
                                : ""
                          }
                        >
                          {quantity}
                        </span>
                      </td>
                      <td>
                        <span className={variant.isActive ? "badge-success" : "badge"}>
                          {variant.isActive ? "Actif" : "Inactif"}
                        </span>
                      </td>
                      <td className="text-right">
                        <form action={toggleVariantAction} className="inline">
                          <input type="hidden" name="id" value={variant.id} />
                          <input type="hidden" name="slug" value={product.slug} />
                          <button
                            type="submit"
                            className="text-[0.7rem] text-primary underline underline-offset-2 hover:no-underline"
                          >
                            {variant.isActive ? "Désactiver" : "Activer"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border border-outline-variant bg-white p-4">
          <h3 className="mb-3 font-serif text-lg text-primary">Ajouter un coloris</h3>
          <VariantForm productId={product.id} productSlug={product.slug} />
        </div>
      </section>
    </>
  );
}
