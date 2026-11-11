import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { CollectionForm } from "@/components/admin/CollectionForm";

export const dynamic = "force-dynamic";
export default async function BrandsAdminPage() {
  await requirePermission("products.view");
  const brands = await db.brand.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  return <>
    <AdminPageHeader title="Marques" eyebrow="Catalogue" description="Gérez les marques et leurs logos. Une marque masquée retire ses produits de la découverte et du paiement." />
    <section className="mb-7"><h2 className="mb-3 font-serif text-xl">Nouvelle marque</h2><CollectionForm kind="brand" /></section>
    <div className="space-y-6">{brands.map((item) => <section key={item.id}>
      <h2 className="mb-2 font-serif text-xl text-primary">{item.name} · {item._count.products} produit(s) · {item.isActive ? "Visible" : "Masquée"}</h2>
      <CollectionForm kind="brand" item={item} />
    </section>)}</div>
  </>;
}
