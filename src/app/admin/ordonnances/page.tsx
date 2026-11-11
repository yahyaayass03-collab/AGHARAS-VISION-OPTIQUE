import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { accessSubject } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { formatDateTimeFr } from "@/lib/utils";
import {
  PRESCRIPTION_METHOD_LABELS,
  PRESCRIPTION_STATUS_LABELS,
} from "@/lib/constants";
import {
  AdminEmpty,
  AdminNotice,
  AdminPageHeader,
  Pagination,
} from "@/components/admin/AdminUI";
import { PrescriptionReviewForm } from "@/components/admin/PrescriptionReviewForm";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Ordonnances" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;
const STATUSES = ["PENDING", "RECEIVED", "VERIFIED", "REJECTED"] as const;

function refraction(value: { toString(): string } | null): string {
  if (!value) return "—";
  const numeric = Number(value.toString());
  if (!Number.isFinite(numeric)) return "—";
  return numeric > 0 ? `+${numeric.toFixed(2)}` : numeric.toFixed(2);
}

export default async function AdminPrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; page?: string }>;
}) {
  const actor = await requirePermission("prescriptions.view");
  const canReview = hasPermission(accessSubject(actor), "prescriptions.review");
  const params = await searchParams;
  const status = STATUSES.includes(params.statut as (typeof STATUSES)[number])
    ? (params.statut as string)
    : "PENDING";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = status ? { status: status as (typeof STATUSES)[number] } : {};

  const [prescriptions, total, grouped] = await Promise.all([
    db.prescription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewedBy: { select: { firstName: true, lastName: true } },
        _count: { select: { orderItems: true, cartItems: true } },
      },
    }),
    db.prescription.count({ where }),
    db.prescription.groupBy({ by: ["status"], _count: true }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const counts = Object.fromEntries(grouped.map((row) => [row.status, row._count]));

  const hrefFor = (value: string) =>
    value === "PENDING"
      ? "/admin/ordonnances"
      : `/admin/ordonnances?statut=${value}`;

  return (
    <>
      <AdminPageHeader
        eyebrow="Contrôle optique"
        title="Ordonnances"
        description="Les ordonnances sont stockées hors du dossier public. Chaque consultation ou téléchargement est réservé aux rôles habilités et journalisé."
      />

      <div className="mb-4">
        <AdminNotice tone="warning">
          Données de santé : n&apos;ouvrez un fichier que dans le cadre du
          contrôle d&apos;une commande. Ne transmettez jamais une ordonnance par
          un canal non sécurisé. La conservation doit suivre la politique de
          rétention documentée.
        </AdminNotice>
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {STATUSES.map((value) => (
          <Link
            key={value}
            href={hrefFor(value)}
            className={`border px-2.5 py-1.5 text-[0.68rem] ${
              status === value
                ? "border-primary bg-primary text-white"
                : "border-outline-variant bg-white text-on-surface-variant hover:border-primary"
            }`}
          >
            {PRESCRIPTION_STATUS_LABELS[value]}
            <span className="ml-1.5 text-[0.6rem] opacity-70">
              {counts[value] ?? 0}
            </span>
          </Link>
        ))}
      </div>

      {prescriptions.length === 0 ? (
        <AdminEmpty
          title="Aucune ordonnance dans cette catégorie"
          description="Les ordonnances téléversées ou saisies par les clients apparaissent ici."
        />
      ) : (
        <div className="space-y-3">
          {prescriptions.map((prescription) => (
            <article
              key={prescription.id}
              className="border border-outline-variant bg-white"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-outline-variant px-4 py-3">
                <div>
                  <p className="text-[0.85rem] font-medium text-primary">
                    {prescription.user
                      ? `${prescription.user.firstName} ${prescription.user.lastName}`
                      : "Client invité"}
                  </p>
                  <p className="text-[0.7rem] text-on-surface-variant">
                    {prescription.user?.email ?? "Aucun compte associé"} ·{" "}
                    {PRESCRIPTION_METHOD_LABELS[prescription.method] ??
                      prescription.method}{" "}
                    · reçue le {formatDateTimeFr(prescription.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      prescription.status === "VERIFIED"
                        ? "badge-success"
                        : prescription.status === "REJECTED"
                          ? "badge-error"
                          : "badge"
                    }
                  >
                    {PRESCRIPTION_STATUS_LABELS[prescription.status] ??
                      prescription.status}
                  </span>
                  <span className="text-[0.62rem] text-outline">
                    {prescription._count.orderItems} commande(s) ·{" "}
                    {prescription._count.cartItems} panier(s)
                  </span>
                </div>
              </div>

              <div className="grid gap-4 px-4 py-3 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <h3 className="text-[0.62rem] uppercase tracking-[0.12em] text-secondary">
                    Mesures déclarées
                  </h3>
                  <div className="mt-1.5 overflow-x-auto">
                    <table className="w-full max-w-md border-collapse text-left text-[0.72rem]">
                      <thead>
                        <tr className="border-b border-outline-variant text-[0.6rem] uppercase tracking-[0.08em] text-on-surface-variant">
                          <th className="py-1 pr-3 font-normal">Œil</th>
                          <th className="py-1 pr-3 font-normal">Sphère</th>
                          <th className="py-1 pr-3 font-normal">Cylindre</th>
                          <th className="py-1 pr-3 font-normal">Axe</th>
                          <th className="py-1 font-normal">Addition</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-outline-variant/60">
                          <td className="py-1 pr-3 text-primary">OD</td>
                          <td className="pr-3">{refraction(prescription.rightSphere)}</td>
                          <td className="pr-3">{refraction(prescription.rightCylinder)}</td>
                          <td className="pr-3">{prescription.rightAxis ?? "—"}</td>
                          <td>{refraction(prescription.rightAdd)}</td>
                        </tr>
                        <tr>
                          <td className="py-1 pr-3 text-primary">OG</td>
                          <td className="pr-3">{refraction(prescription.leftSphere)}</td>
                          <td className="pr-3">{refraction(prescription.leftCylinder)}</td>
                          <td className="pr-3">{prescription.leftAxis ?? "—"}</td>
                          <td>{refraction(prescription.leftAdd)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-1.5 text-[0.66rem] text-outline">
                    Écart pupillaire :{" "}
                    {prescription.pupillaryDistance
                      ? `${prescription.pupillaryDistance.toString()} mm`
                      : "—"}
                  </p>

                  {prescription.filePath && (
                    <a
                      href={`/api/ordonnances/${prescription.id}`}
                      target="_blank"
                      rel="noopener"
                      className="mt-2 inline-flex items-center gap-1.5 border border-outline-variant bg-surface-dim px-2.5 py-1.5 text-[0.7rem] text-primary hover:border-primary"
                    >
                      <Icon name="download" size={12} />
                      Télécharger {prescription.originalFileName ?? "le fichier"}
                    </a>
                  )}

                  {prescription.customerNote && (
                    <p className="mt-2 border-l-2 border-gold bg-surface-dim px-3 py-2 text-[0.72rem] leading-relaxed text-on-surface-variant">
                      Note client : {prescription.customerNote}
                    </p>
                  )}
                </div>

                <div className="lg:col-span-5">
                  {prescription.reviewedBy && (
                    <p className="mb-2 text-[0.68rem] text-on-surface-variant">
                      Contrôlée par {prescription.reviewedBy.firstName}{" "}
                      {prescription.reviewedBy.lastName}
                      {prescription.reviewedAt
                        ? ` le ${formatDateTimeFr(prescription.reviewedAt)}`
                        : ""}
                      {prescription.reviewNote ? ` — ${prescription.reviewNote}` : ""}
                    </p>
                  )}
                  {canReview ? (
                    <PrescriptionReviewForm
                      prescriptionId={prescription.id}
                      status={prescription.status}
                    />
                  ) : (
                    <p className="text-[0.7rem] text-outline">
                      Votre rôle permet la consultation, pas la validation.
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        baseHref="/admin/ordonnances"
        params={{ statut: status === "PENDING" ? "" : status }}
      />
    </>
  );
}
