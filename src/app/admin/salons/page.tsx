import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { StoreForm } from "@/components/admin/StoreForm";

export const dynamic = "force-dynamic";
export default async function StoresAdminPage() {
  await requirePermission("settings.manage");
  const stores = await db.store.findMany({ orderBy: { sortOrder: "asc" } });
  return <>
    <AdminPageHeader eyebrow="Paramètres de la boutique" title="Adresses du magasin" description="Gérez les coordonnées de l’adresse physique publiée sur le site. N’activez que les points de vente confirmés par le propriétaire." />
    <section className="mb-7"><h2 className="mb-3 font-serif text-xl">Ajouter une adresse confirmée</h2><StoreForm /></section>
    <div className="space-y-6">{stores.map((store) => <section key={store.id}>
      <h2 className="mb-2 font-serif text-xl text-primary">{store.name} · {store.isActive ? "Visible" : "Masqué"}</h2>
      <StoreForm store={store} />
    </section>)}</div>
  </>;
}
