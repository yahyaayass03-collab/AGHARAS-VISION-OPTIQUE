import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { AdminPageHeader, AdminNotice } from "@/components/admin/AdminUI";
import { ProductForm } from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Nouveau produit" };
export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requirePermission("products.create");

  const [brands, categories] = await Promise.all([
    db.brand.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Nouveau produit"
        description="Créez la fiche, puis ajoutez les coloris et le stock depuis la page du produit."
        actions={
          <Link href="/admin/produits" className="btn-quiet btn-sm">
            Retour à la liste
          </Link>
        }
      />

      {brands.length === 0 || categories.length === 0 ? (
        <AdminNotice tone="warning">
          Une marque et une catégorie sont nécessaires avant de créer un produit.
          {" "}Ajoutez une marque dans{" "}
          <Link href="/admin/marques" className="underline">Marques</Link>
          {" "}et une catégorie dans{" "}
          <Link href="/admin/categories" className="underline">Catégories</Link>.
        </AdminNotice>
      ) : (
        <ProductForm brands={brands} categories={categories} />
      )}
    </>
  );
}
