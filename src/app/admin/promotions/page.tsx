import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { centsToInput, formatDH } from "@/lib/money";
import { formatDateFr } from "@/lib/utils";
import { AdminEmpty, AdminNotice, AdminPageHeader } from "@/components/admin/AdminUI";
import { ConfirmButton } from "@/components/admin/FormBits";
import { CouponForm, type CouponValues } from "@/components/admin/CouponForm";
import {
  deleteCouponAction,
  toggleCouponAction,
} from "@/app/actions/admin/commerce";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Promotions" };
export const dynamic = "force-dynamic";

function couponState(coupon: {
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
}): { label: string; className: string } {
  const now = new Date();
  if (!coupon.isActive) return { label: "Inactif", className: "badge" };
  if (coupon.endsAt && coupon.endsAt < now)
    return { label: "Expiré", className: "badge-error" };
  if (coupon.startsAt && coupon.startsAt > now)
    return { label: "Programmé", className: "badge" };
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit)
    return { label: "Épuisé", className: "badge-error" };
  return { label: "Actif", className: "badge-success" };
}

export default async function AdminPromotionsPage({
  searchParams,
}: {
  searchParams: Promise<{ modifier?: string; nouveau?: string }>;
}) {
  await requirePermission("promotions.manage");
  const params = await searchParams;

  const [coupons, editing] = await Promise.all([
    db.coupon.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: { _count: { select: { redemptions: true } } },
    }),
    params.modifier
      ? db.coupon.findUnique({ where: { id: params.modifier } })
      : Promise.resolve(null),
  ]);

  const editingValues: CouponValues | undefined = editing
    ? {
        id: editing.id,
        code: editing.code,
        description: editing.description ?? "",
        type: editing.type,
        value:
          editing.type === "FIXED" ? centsToInput(editing.value) : String(editing.value),
        minSubtotal:
          editing.minSubtotalCents > 0
            ? centsToInput(editing.minSubtotalCents)
            : "",
        startsAt: editing.startsAt
          ? editing.startsAt.toISOString().slice(0, 10)
          : "",
        endsAt: editing.endsAt ? editing.endsAt.toISOString().slice(0, 10) : "",
        usageLimit: editing.usageLimit ? String(editing.usageLimit) : "",
        isActive: editing.isActive,
      }
    : undefined;

  const showForm = Boolean(params.nouveau) || Boolean(editingValues);

  return (
    <>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Promotions"
        description="Codes de remise appliqués au panier. Les remises sont stockées en centimes et figées dans l'instantané de commande."
        actions={
          !showForm ? (
            <Link href="/admin/promotions?nouveau=1" className="btn-primary btn-sm">
              <Icon name="plus" size={14} /> Nouveau code
            </Link>
          ) : (
            <Link href="/admin/promotions" className="btn-quiet btn-sm">
              Retour à la liste
            </Link>
          )
        }
      />

      <AdminNotice tone="info">
        Les codes promo ne se cumulent pas. Une remise fixe ne peut pas dépasser
        le sous-total du panier. Le code <strong>CERCLE10</strong> est fourni en
        démonstration.
      </AdminNotice>

      {showForm && (
        <section className="mt-4 border border-outline-variant bg-white">
          <div className="border-b border-outline-variant px-4 py-3">
            <h2 className="font-serif text-lg text-primary">
              {editingValues ? `Modifier ${editingValues.code}` : "Nouveau code promo"}
            </h2>
            <p className="mt-0.5 text-[0.72rem] text-on-surface-variant">
              Pour une remise fixe, saisissez le montant en dirhams. Pour un
              pourcentage, saisissez un entier entre 1 et 100.
            </p>
          </div>
          <div className="p-4">
            <CouponForm
              coupon={editingValues}
              onDone={editingValues ? "/admin/promotions" : undefined}
            />
          </div>
        </section>
      )}

      <div className="mt-5">
        {coupons.length === 0 ? (
          <AdminEmpty
            title="Aucun code promo"
            description="Créez un code pour offrir une remise de bienvenue ou animer une opération commerciale."
            action={
              <Link href="/admin/promotions?nouveau=1" className="btn-primary btn-sm">
                Créer un code
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto border border-outline-variant bg-white">
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Remise</th>
                  <th>Conditions</th>
                  <th>Validité</th>
                  <th>Utilisation</th>
                  <th>État</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => {
                  const state = couponState(coupon);
                  return (
                    <tr key={coupon.id}>
                      <td>
                        <span className="font-mono text-[0.78rem] font-medium text-primary">
                          {coupon.code}
                        </span>
                        {coupon.description && (
                          <span className="mt-0.5 block max-w-[16rem] text-[0.66rem] leading-snug text-on-surface-variant">
                            {coupon.description}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap text-[0.78rem]">
                        {coupon.type === "PERCENT"
                          ? `${coupon.value} %`
                          : formatDH(coupon.value)}
                      </td>
                      <td className="text-[0.7rem] text-on-surface-variant">
                        {coupon.minSubtotalCents > 0
                          ? `Dès ${formatDH(coupon.minSubtotalCents)}`
                          : "Sans minimum"}
                      </td>
                      <td className="whitespace-nowrap text-[0.68rem] text-on-surface-variant">
                        {coupon.startsAt ? formatDateFr(coupon.startsAt) : "—"}
                        <span className="mx-1 text-outline">→</span>
                        {coupon.endsAt ? formatDateFr(coupon.endsAt) : "sans fin"}
                      </td>
                      <td className="whitespace-nowrap text-[0.72rem]">
                        {coupon.usageCount}
                        {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / ∞"}
                        {coupon._count.redemptions !== coupon.usageCount && (
                          <span className="block text-[0.62rem] text-outline">
                            {coupon._count.redemptions} rachat(s)
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={state.className}>{state.label}</span>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/admin/promotions?modifier=${coupon.id}`}
                            className="text-[0.7rem] text-primary underline underline-offset-2 hover:no-underline"
                          >
                            Modifier
                          </Link>
                          <form action={toggleCouponAction}>
                            <input type="hidden" name="id" value={coupon.id} />
                            <button
                              type="submit"
                              className="text-[0.7rem] text-on-surface-variant underline underline-offset-2 hover:text-primary hover:no-underline"
                            >
                              {coupon.isActive ? "Désactiver" : "Activer"}
                            </button>
                          </form>
                          {coupon.usageCount === 0 && (
                            <form action={deleteCouponAction}>
                              <input type="hidden" name="id" value={coupon.id} />
                              <ConfirmButton
                                label="Supprimer"
                                message={`Supprimer définitivement le code « ${coupon.code} » ?`}
                              />
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-[0.68rem] leading-relaxed text-outline">
        Un code déjà utilisé ne peut pas être supprimé : désactivez-le pour
        préserver l&apos;historique comptable des remises.
      </p>
    </>
  );
}
