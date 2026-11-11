import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Accès refusé",
  robots: { index: false, follow: false },
};

export default function AdminForbiddenPage() {
  return (
    <div className="mx-auto max-w-xl border border-outline-variant bg-white px-6 py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center border border-outline-variant bg-surface-dim">
        <Icon name="lock" size={22} className="text-secondary" />
      </span>
      <h1 className="mt-4 font-serif text-2xl text-primary">Accès refusé</h1>
      <p className="mx-auto mt-2 max-w-md text-[0.82rem] leading-relaxed text-on-surface-variant">
        Votre rôle ne dispose pas de la permission nécessaire pour consulter
        cette section. Si vous pensez qu&apos;il s&apos;agit d&apos;une erreur,
        contactez un super-administrateur.
      </p>
      <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
        <Link href="/admin" className="btn-primary btn-sm">
          Tableau de bord
        </Link>
        <Link href="/" className="btn-quiet btn-sm">
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
}
