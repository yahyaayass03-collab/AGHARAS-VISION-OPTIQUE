import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatDH } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProductPreview({ params }: { params: Promise<{ slug: string }> }) {
  await requirePermission("products.view");
  const { slug } = await params;
  const product = await db.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { sortOrder: "asc" } }, brand: true, category: true, variants: { include: { inventory: true } } },
  });
  if (!product) notFound();
  return (
    <div className="space-y-6">
      <div className="border border-gold bg-white p-4 text-body-sm text-primary">Aperçu privé — ce produit n&apos;est pas disponible à l&apos;achat tant qu&apos;il n&apos;est pas publié.</div>
      <Link href={`/admin/produits/${slug}`} className="btn-quiet">← Revenir à la modification</Link>
      <div className="grid gap-8 border border-outline-variant bg-white p-6 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          {product.images.map((image) => (
            <div key={image.id} className="relative aspect-square bg-surface-dim"><Image src={image.url} alt={image.alt} fill sizes="(max-width: 768px) 50vw, 320px" className="object-contain" /></div>
          ))}
        </div>
        <div>
          <p className="eyebrow">{product.brand.name} · {product.category.name}</p>
          <h1 className="mt-3 font-serif text-3xl text-primary">{product.name}</h1>
          <p className="mt-4 text-xl text-primary">{formatDH(product.priceCents)}</p>
          <p className="mt-4 text-body-sm leading-relaxed text-on-surface-variant">{product.description}</p>
          <ul className="mt-6 space-y-2">{product.variants.map((variant) => <li key={variant.id}>{variant.colorName} · stock {variant.inventory?.quantity ?? 0}</li>)}</ul>
        </div>
      </div>
    </div>
  );
}
