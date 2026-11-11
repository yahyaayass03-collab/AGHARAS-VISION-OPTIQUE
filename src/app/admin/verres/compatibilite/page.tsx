import Link from "next/link";
import { db } from "@/lib/db";
import { jsonStringList } from "@/lib/json-string-list";
import { requirePermission } from "@/lib/auth/guards";
import { AdminPageHeader } from "@/components/admin/AdminUI";
import { OpticalDecisionForm } from "@/components/admin/OpticalDecisionForm";
import { Pagination } from "@/components/admin/AdminUI";

const STATUSES = ["APPROVED", "INCOMPATIBLE", "PENDING_REVIEW"] as const;
const PAGE_SIZE = 25;

export const dynamic = "force-dynamic";
export default async function OpticalCompatibilityPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; statut?: string; page?: string }>;
}) {
  await requirePermission("products.view");
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 120);
  const status = STATUSES.includes(params.statut as (typeof STATUSES)[number])
    ? params.statut as (typeof STATUSES)[number]
    : "";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const ruleWhere = {
    ...(status ? { status } : {}),
    ...(query ? {
      OR: [
        { product: { name: { contains: query } } },
        { variant: { colorName: { contains: query } } },
        { lensType: { name: { contains: query } } },
        { lensIndex: { name: { contains: query } } },
      ],
    } : {}),
  };
  const [products, lenses, indices, treatments, rules, total] = await Promise.all([
    db.product.findMany({ where: { lensCompatible: true }, orderBy: { name: "asc" }, include: { variants: { orderBy: { sortOrder: "asc" } } } }),
    db.lensType.findMany({ orderBy: { sortOrder: "asc" } }), db.lensIndex.findMany({ orderBy: { sortOrder: "asc" } }),
    db.lensTreatment.findMany({ orderBy: { sortOrder: "asc" } }),
    db.opticalCompatibilityRule.findMany({ where: ruleWhere, orderBy: { updatedAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: { product: true, variant: true, lensType: true, lensIndex: true } }),
    db.opticalCompatibilityRule.count({ where: ruleWhere }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return <>
    <AdminPageHeader title="Compatibilité optique" eyebrow="Verres et corrections" description="Toute combinaison sans décision est en attente. Enregistrez seulement les décisions réellement fournies par un opticien." />
    <Link href="/admin/verres" className="btn-quiet">← Tarifs des verres</Link>
    <p className="my-4 text-body-sm">Les décisions portent sur une combinaison exacte. Aucun historique de commande n'est modifié. Les nouvelles combinaisons non revues ne peuvent pas être commandées.</p>
    <OpticalDecisionForm products={products.map((p) => ({ id: p.id, name: p.name, variants: p.variants.map((v) => ({ id: v.id, name: v.colorName })) }))} lenses={lenses} indices={indices} treatments={treatments} />
    <h2 className="mt-8 font-serif text-xl">Décisions enregistrées ({total})</h2>
    <p className="my-2 text-body-sm">Les combinaisons sans règle enregistrée restent en attente et sont bloquées à la commande. Cette liste porte sur les décisions enregistrées; elle ne génère pas de recommandations optiques.</p>
    <form method="get" className="my-3 flex flex-col gap-2 border border-outline-variant bg-white p-3 sm:flex-row sm:items-end">
      <div className="flex-1"><label htmlFor="optical-rule-search" className="field-label">Rechercher</label><input id="optical-rule-search" name="q" defaultValue={query} placeholder="Monture, coloris ou option optique…" className="admin-input" /></div>
      <div className="sm:w-56"><label htmlFor="optical-rule-status" className="field-label">Décision</label><select id="optical-rule-status" name="statut" defaultValue={status} className="admin-input"><option value="">Toutes</option><option value="PENDING_REVIEW">En attente</option><option value="APPROVED">Validées par le professionnel indiqué</option><option value="INCOMPATIBLE">Incompatibles</option></select></div>
      <button type="submit" className="btn-primary btn-sm">Filtrer</button>
      {(query || status) && <Link href="/admin/verres/compatibilite" className="btn-quiet btn-sm">Effacer</Link>}
    </form>
    <div className="space-y-3">{rules.map((rule) => <div key={rule.id} className="border border-outline-variant bg-white p-4 text-body-sm">
      <p className="font-medium">{rule.product.name} · {rule.variant.colorName} · {rule.lensType.name} · {rule.lensIndex.name}</p>
      <p>Traitements : {jsonStringList(rule.treatmentIds).map((id) => treatments.find((t) => t.id === id)?.name ?? "Traitement supprimé").join(", ") || "aucun"}</p>
      <p>{rule.status === "APPROVED" ? "Compatible — Validé" : rule.status === "INCOMPATIBLE" ? "Incompatible" : "En attente de validation"} {rule.reviewer && `· Vérifié par ${rule.reviewer} · ${rule.reviewedAt?.toISOString().slice(0, 10)}`}</p>
      {rule.evidence && <p>Référence : {rule.evidence}</p>}
      <p className="text-on-surface-variant">Pour modifier ou revoir cette décision, saisissez à nouveau la même combinaison ci-dessus.</p>
    </div>)}
    {rules.length === 0 && <p className="border border-outline-variant bg-white p-4 text-body-sm">Aucune décision enregistrée ne correspond à ces filtres. Les combinaisons sans décision restent en attente.</p>}
    <Pagination page={Math.min(page, pageCount)} pages={pageCount} baseHref="/admin/verres/compatibilite" params={{ q: query, statut: status }} />
    </div>
  </>;
}
