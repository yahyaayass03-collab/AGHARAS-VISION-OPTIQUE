import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { CollectionForm } from "@/components/admin/CollectionForm";

export const dynamic = "force-dynamic";
export default async function CategoriesAdminPage() {
  await requirePermission("products.view");
  const categories = await db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  return <>
    <AdminPageHeader title="Catégories" eyebrow="Catalogue" description="Créez et organisez les collections. Une catégorie masquée est retirée du catalogue et ses produits ne peuvent plus être commandés." />
    <section className="mb-7"><h2 className="mb-3 font-serif text-xl">Nouvelle catégorie</h2><CollectionForm kind="category" /></section>
    <div className="space-y-6">{categories.map((item) => <section key={item.id}>
      <h2 className="mb-2 font-serif text-xl text-primary">{item.name} · {item._count.products} produit(s) · {item.isActive ? "Visible" : "Masquée"}</h2>
      <CollectionForm kind="category" item={item} />
    </section>)}</div>
  </>;
}
