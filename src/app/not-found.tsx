import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/site/Logo";
import { Icon } from "@/components/ui/Icon";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: false },
};

export default async function NotFound() {
  const settings = await getSettings();
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="border-b border-outline-variant bg-white">
        <div className="canvas flex h-20 items-center justify-between">
          <Logo compact logoUrl={settings["store.logo_url"]} brandName={settings["store.name"]} />
          <Link href="/catalogue" className="btn-quiet btn-sm">
            La collection
          </Link>
        </div>
      </header>

      <main
        id="contenu"
        className="canvas flex flex-1 items-center justify-center py-16"
      >
        <div className="max-w-xl border border-outline-variant bg-white px-6 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center border border-outline-variant bg-surface-dim">
            <Icon name="search" size={22} className="text-secondary" />
          </span>
          <p className="mt-4 text-[0.62rem] uppercase tracking-[0.2em] text-secondary">
            Erreur 404
          </p>
          <h1 className="mt-1 font-serif text-3xl text-primary">
            Cette page n&apos;existe pas
          </h1>
          <p className="mx-auto mt-3 max-w-md text-body-sm leading-relaxed text-on-surface-variant">
            Le lien est peut-être obsolète ou la pièce a été retirée de la
            collection. Explorez les montures disponibles ou revenez à
            l&apos;accueil.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Link href="/" className="btn-primary btn-sm">
              Retour à l&apos;accueil
            </Link>
            <Link href="/catalogue" className="btn-outline btn-sm">
              Voir le catalogue
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-outline-variant bg-white py-5">
        <p className="canvas text-center text-[0.68rem] text-on-surface-variant">
          {settings["store.name"]} — Paiement à la livraison
          uniquement.
        </p>
      </footer>
    </div>
  );
}
