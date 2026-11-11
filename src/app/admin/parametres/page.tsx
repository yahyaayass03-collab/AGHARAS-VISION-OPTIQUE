import type { Metadata } from "next";
import { requirePermission } from "@/lib/auth/guards";
import { getSettings } from "@/lib/settings";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { ShippingMethodForm } from "@/components/admin/ShippingMethodForm";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Paramètres" };
export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requirePermission("settings.manage");
  const settings = await getSettings();
  const shippingMethods = await db.shippingMethod.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <AdminPageHeader
        eyebrow="Configuration"
        title="Paramètres"
        description="Coordonnées, mentions légales, paiement et référencement. Les valeurs de démonstration restent des placeholders explicites jusqu'à validation par le propriétaire."
      />
      <SettingsForm settings={settings} />
      <section className="mt-8">
        <h2 className="mb-2 font-serif text-2xl text-primary">Modes de livraison</h2>
        <p className="mb-4 text-body-sm text-on-surface-variant">Les frais sont calculés côté serveur et reflétés immédiatement au panier et à la commande.</p>
        <div className="grid gap-4 lg:grid-cols-2">{shippingMethods.map((method) => <ShippingMethodForm key={method.id} method={method} />)}</div>
      </section>
    </>
  );
}
