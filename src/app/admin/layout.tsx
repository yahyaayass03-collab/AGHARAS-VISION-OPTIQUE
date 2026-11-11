import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSessionUser, accessSubject } from "@/lib/auth/session";
import { hasPermission } from "@/lib/permissions";
import { logoutAction } from "@/app/actions/auth";
import { Icon } from "@/components/ui/Icon";
import { AdminNav, type AdminNavItem } from "@/components/admin/AdminNav";
import { initials } from "@/lib/utils";
import { isOwner } from "@/lib/auth/owner";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: {
    default: "Administration",
    template: "%s | Administration AGHARAS VISION",
  },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/connexion?suivant=%2Fadmin");

  const subject = accessSubject(user);
  const admin = isOwner(user);

  if (!admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-dim px-5 py-16">
        <div className="max-w-md border border-outline-variant bg-white p-8 text-center">
          <Icon name="lock" size={28} className="mx-auto text-outline" />
          <h1 className="mt-3 font-serif text-2xl text-primary">Accès refusé</h1>
          <p className="mt-2 text-body-sm leading-relaxed text-on-surface-variant">
            Votre compte ne dispose d&apos;aucune permission d&apos;administration.
            Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur, contactez le
            responsable de la boutique.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link href="/" className="btn-primary btn-sm">
              Retour à la boutique
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const can = (permission: string) => hasPermission(subject, permission);
  const settings = await getSettings();

  const [pendingOrders, pendingPrescriptions, lowStock, newMessages] =
    await Promise.all([
      can("orders.view")
        ? db.order.count({ where: { status: "PENDING" } })
        : Promise.resolve(0),
      can("prescriptions.view")
        ? db.prescription.count({ where: { status: "PENDING" } })
        : Promise.resolve(0),
      can("inventory.view")
        ? db.inventoryItem.count({
            where: { quantity: { lte: 3 } },
          })
        : Promise.resolve(0),
      can("content.manage")
        ? db.contactMessage.count({ where: { status: "NEW" } })
        : Promise.resolve(0),
    ]);

  const navCandidates: (AdminNavItem | false)[] = [
    can("dashboard.view") && {
      href: "/admin",
      label: "Tableau de bord",
      icon: "dashboard" as const,
    },
    can("orders.view") && {
      href: "/admin/commandes",
      label: "Commandes",
      icon: "bag" as const,
      badge: pendingOrders,
    },
    can("products.view") && {
      href: "/admin/produits",
      label: "Produits",
      icon: "glasses" as const,
    },
    can("products.view") && {
      href: "/admin/categories",
      label: "Catégories",
      icon: "list" as const,
    },
    can("products.view") && {
      href: "/admin/marques",
      label: "Marques",
      icon: "tag" as const,
    },
    can("inventory.view") && {
      href: "/admin/stock",
      label: "Stock",
      icon: "box" as const,
      badge: lowStock,
    },
    can("products.view") && {
      href: "/admin/verres",
      label: "Verres et corrections",
      icon: "eye" as const,
    },
    can("prescriptions.view") && {
      href: "/admin/ordonnances",
      label: "Ordonnances",
      icon: "file" as const,
      badge: pendingPrescriptions,
    },
    can("promotions.manage") && {
      href: "/admin/promotions",
      label: "Promotions",
      icon: "tag" as const,
    },
    can("content.manage") && {
      href: "/admin/apparence",
      label: "Apparence de l'accueil",
      icon: "edit" as const,
    },
    can("content.manage") && {
      href: "/admin/contenu",
      label: "Pages et contenu",
      icon: "edit" as const,
    },
    can("content.manage") && {
      href: "/admin/messages",
      label: "Messages",
      icon: "mail" as const,
      badge: newMessages,
    },
    can("settings.manage") && {
      href: "/admin/parametres",
      label: "Paramètres",
      icon: "settings" as const,
    },
    can("settings.manage") && {
      href: "/admin/salons",
      label: "Adresse du magasin",
      icon: "store" as const,
    },
    can("users.manage") && {
      href: "/admin/journal",
      label: "Journal d'audit",
      icon: "list" as const,
    },
  ];

  const navItems = navCandidates.filter(
    (item): item is AdminNavItem => Boolean(item),
  );

  return (
    <div className="min-h-screen bg-surface-dim lg:flex">
      <aside className="flex flex-col bg-primary text-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <Link href="/admin" className="leading-none">
            <span className="flex items-center gap-2">
              <Image src={settings["store.logo_url"] || "/images/brand/agharass-vision-logo-header.webp"} alt="" aria-hidden="true" width={44} height={48} className="h-9 w-9 object-contain" />
              <span className="font-serif text-base tracking-tight">{settings["store.name"] || "AGHARAS VISION"}</span>
            </span>
            <span className="mt-1 block text-[0.55rem] uppercase tracking-[0.24em] text-gold">
              Administration
            </span>
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="text-white/50 transition-colors hover:text-gold"
            aria-label="Voir la boutique"
          >
            <Icon name="external" size={16} />
          </Link>
        </div>

        <div className="hidden flex-1 overflow-y-auto py-3 lg:block">
          <AdminNav items={navItems} />
        </div>

        <details className="group border-t border-white/10 lg:hidden">
          <summary className="flex items-center justify-between px-5 py-3 text-[0.7rem] uppercase tracking-[0.14em] text-white/70">
            Menu administration
            <Icon
              name="chevron-down"
              size={15}
              className="text-gold transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="max-h-[70vh] overflow-y-auto pb-3">
            <AdminNav items={navItems} />
          </div>
        </details>

        <div className="border-t border-white/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/20 bg-white/10 text-[0.65rem] font-medium text-gold">
              {initials(user.firstName, user.lastName)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.78rem] text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="truncate text-[0.62rem] text-white/50">
                {user.role.name}
              </p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="text-white/50 transition-colors hover:text-gold"
                aria-label="Se déconnecter"
                title="Se déconnecter"
              >
                <Icon name="logout" size={16} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <main id="contenu" className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
