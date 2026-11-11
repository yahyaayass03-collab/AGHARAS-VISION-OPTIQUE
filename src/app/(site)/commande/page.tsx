import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCartView } from "@/lib/cart";
import { getSettings } from "@/lib/settings";
import { CheckoutForm } from "@/components/site/CheckoutForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finaliser ma commande",
  description:
    "Commande sécurisée AGHARAS VISION : livraison au Maroc et paiement à la réception.",
  alternates: { canonical: "/commande" },
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const [cart, methods, settings] = await Promise.all([
    getCartView(),
    db.shippingMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getSettings(),
  ]);

  if (cart.items.length === 0) redirect("/panier");

  return (
    <div className="bg-surface">
      <div className="border-b border-outline-variant bg-white">
        <div className="canvas py-4">
          <ol className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { number: "01", eyebrow: "Vérifié", label: "Panier" },
              { number: "02", eyebrow: "En cours", label: "Coordonnées & livraison" },
              { number: "03", eyebrow: "Mode de paiement", label: "Règlement à réception" },
              { number: "04", eyebrow: "Finalisation", label: "Confirmation & suivi" },
            ].map((step, index) => {
              const active = index === 1;
              const done = index === 0;
              return (
                <li key={step.number} className="flex min-w-0 items-center gap-2">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center text-[0.62rem] font-semibold ${
                      active
                        ? "bg-primary text-white"
                        : done
                          ? "bg-primary text-white"
                          : "border border-outline-variant text-on-surface-variant"
                    }`}
                  >
                    {done ? "✓" : step.number}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-[0.55rem] uppercase tracking-[0.12em] ${
                        active ? "text-secondary" : "text-on-surface-variant"
                      }`}
                    >
                      {step.eyebrow}
                    </span>
                    <span
                      className={`block truncate text-[0.75rem] ${
                        index === 3 ? "text-outline" : "font-medium text-primary"
                      }`}
                    >
                      {step.label}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <div className="canvas py-8 lg:py-12">
        <div className="mb-6 border-b border-outline-variant pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[0.62rem] uppercase tracking-[0.12em] text-secondary">
              <span aria-hidden="true">✓</span>
              Processus sécurisé • Livraison Maroc
            </p>
            <span className="border border-outline-variant bg-surface-dim px-2 py-0.5 text-[0.58rem] uppercase tracking-[0.1em] text-on-surface-variant">
              Sans inscription préalable
            </span>
          </div>
          <h1 className="mt-1 font-serif text-[2.1rem] leading-tight text-primary md:text-[2.6rem]">
            Finaliser ma commande
          </h1>
          <p className="mt-1 max-w-2xl text-body-sm leading-relaxed text-on-surface-variant">
            Commande express sans création de compte obligatoire. Les modalités
            de préparation et de livraison sont confirmées par notre équipe.
          </p>
        </div>

        <CheckoutForm
          idempotencyKey={randomUUID()}
          items={cart.items}
          subtotalCents={cart.subtotalCents}
          discountCents={cart.discountCents}
          couponCode={cart.couponCode}
          couponLabel={cart.couponLabel}
          couponError={cart.couponError}
          shippingMethods={methods.map((method) => ({
            code: method.code,
            name: method.name,
            description: method.description,
            priceCents: method.priceCents,
            freeFromCents: method.freeFromCents,
            estimatedDays: method.estimatedDays,
          }))}
          whatsapp={settings["store.whatsapp"] ?? ""}
          onlineNotice={
            settings["payment.online_notice"] ??
            "Paiement en ligne indisponible : aucune passerelle CMI n'est configurée."
          }
          customer={null}
          address={null}
        />
      </div>
    </div>
  );
}
