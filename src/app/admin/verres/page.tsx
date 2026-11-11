import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { LensOptionForm } from "@/components/admin/LensOptionForm";
import Link from "next/link";

export const dynamic = "force-dynamic";
export default async function LensesAdminPage() {
  await requirePermission("products.view");
  const [types, indices, treatments] = await Promise.all([
    db.lensType.findMany({ orderBy: { sortOrder: "asc" } }),
    db.lensIndex.findMany({ orderBy: { sortOrder: "asc" } }),
    db.lensTreatment.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return <>
    <AdminPageHeader eyebrow="Configuration optique" title="Verres et corrections" description="Modifiez les tarifs et la disponibilité des options existantes. Les prix déjà enregistrés dans les commandes restent inchangés." />
    <p className="mb-5"><Link href="/admin/verres/compatibilite" className="btn-primary btn-sm">Revoir la compatibilité optique</Link></p>
    {([
      { title: "Types de verres", kind: "type" as const, items: types },
      { title: "Indices d'amincissement", kind: "index" as const, items: indices },
      { title: "Traitements", kind: "treatment" as const, items: treatments },
    ]).map((group) => <section key={group.kind} className="mb-7">
      <h2 className="mb-3 font-serif text-xl text-primary">{group.title}</h2>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{group.items.map((item) => <LensOptionForm key={item.id} kind={group.kind} item={item} />)}</div>
    </section>)}
  </>;
}
