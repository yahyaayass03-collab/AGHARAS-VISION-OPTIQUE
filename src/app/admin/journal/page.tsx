import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatDateTimeFr } from "@/lib/utils";
import { AdminEmpty, AdminPageHeader, Pagination } from "@/components/admin/AdminUI";

export const metadata: Metadata = { title: "Journal d'audit" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const ENTITY_TYPES = [
  "Order",
  "User",
  "Role",
  "Coupon",
  "Prescription",
  "ContentPage",
  "FaqItem",
  "Banner",
  "Setting",
  "ContactMessage",
  "NewsletterSubscriber",
  "Product",
  "ProductVariant",
  "InventoryItem",
] as const;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; page?: string }>;
}) {
  await requirePermission("users.manage");
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const type = ENTITY_TYPES.includes(params.type as (typeof ENTITY_TYPES)[number])
    ? (params.type as string)
    : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = {
    ...(type ? { entityType: type } : {}),
    ...(query
      ? {
          OR: [
            { actorEmail: { contains: query } },
            { action: { contains: query } },
            { entityId: { contains: query } },
          ],
        }
      : {}),
  };

  const [entries, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader
        eyebrow="Traçabilité"
        title="Journal d'audit"
        description="Historique des actions sensibles : commandes, ordonnances, clients, contenus, rôles et réglages. Les entrées sont immuables depuis l'interface."
      />

      <form
        method="get"
        className="mb-4 flex flex-col gap-2 border border-outline-variant bg-white p-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="audit-search" className="field-label">
            Rechercher
          </label>
          <input
            id="audit-search"
            name="q"
            defaultValue={query}
            placeholder="E-mail, action (order.status) ou identifiant…"
            className="admin-input"
          />
        </div>
        <div className="sm:w-52">
          <label htmlFor="audit-type" className="field-label">
            Type d&apos;entité
          </label>
          <select
            id="audit-type"
            name="type"
            defaultValue={type}
            className="admin-input"
          >
            <option value="">Tous</option>
            {ENTITY_TYPES.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary btn-sm">
          Filtrer
        </button>
        {(query || type) && (
          <Link href="/admin/journal" className="btn-quiet btn-sm">
            Réinitialiser
          </Link>
        )}
      </form>

      {entries.length === 0 ? (
        <AdminEmpty
          title="Aucune entrée"
          description="Les actions réalisées depuis l'administration seront journalisées ici."
        />
      ) : (
        <div className="overflow-x-auto border border-outline-variant bg-white">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Date</th>
                <th>Acteur</th>
                <th>Action</th>
                <th>Entité</th>
                <th>Contexte</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap align-top text-[0.7rem] text-on-surface-variant">
                    {formatDateTimeFr(entry.createdAt)}
                  </td>
                  <td className="align-top text-[0.72rem]">
                    <span className="block text-primary">
                      {entry.user
                        ? `${entry.user.firstName} ${entry.user.lastName}`
                        : "Système"}
                    </span>
                    <span className="text-[0.64rem] text-on-surface-variant">
                      {entry.actorEmail ?? entry.user?.email ?? "—"}
                    </span>
                  </td>
                  <td className="align-top">
                    <code className="text-[0.68rem] text-primary">{entry.action}</code>
                  </td>
                  <td className="align-top text-[0.68rem] text-on-surface-variant">
                    <span className="block">{entry.entityType}</span>
                    {entry.entityId && (
                      <span className="block break-all text-[0.6rem] text-outline">
                        {entry.entityId}
                      </span>
                    )}
                  </td>
                  <td className="align-top">
                    {entry.metadata ? (
                      <details>
                        <summary className="cursor-pointer text-[0.66rem] text-secondary">
                          Détails
                        </summary>
                        <pre className="mt-1 max-w-md overflow-x-auto whitespace-pre-wrap break-all bg-surface-dim p-2 text-[0.6rem] leading-relaxed text-on-surface-variant">
                          {JSON.stringify(entry.metadata, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-[0.66rem] text-outline">—</span>
                    )}
                    {entry.ip && (
                      <span className="mt-1 block text-[0.58rem] text-outline">
                        IP {entry.ip}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        baseHref="/admin/journal"
        params={{ q: query, type }}
      />

      <p className="mt-4 text-[0.68rem] leading-relaxed text-outline">
        {total} entrée(s) conservée(s). Le journal ne contient aucune donnée
        médicale : les contrôles d&apos;ordonnances n&apos;enregistrent que la
        décision et, le cas échéant, le motif saisi par l&apos;opticien.
      </p>
    </>
  );
}
