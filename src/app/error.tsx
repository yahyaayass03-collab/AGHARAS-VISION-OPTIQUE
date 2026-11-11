"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Journalisation côté navigateur uniquement : aucun détail sensible n'est
    // affiché à l'utilisateur, le diagnostic complet reste dans les logs serveur.
    console.error("Erreur d'interface", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-5 py-16">
      <div className="w-full max-w-xl border border-outline-variant bg-white px-6 py-12 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center border border-error/30 bg-error-container">
          <Icon name="alert" size={22} className="text-error" />
        </span>
        <p className="mt-4 text-[0.62rem] uppercase tracking-[0.2em] text-secondary">
          Incident technique
        </p>
        <h1 className="mt-1 font-serif text-3xl text-primary">
          Une erreur est survenue
        </h1>
        <p className="mx-auto mt-3 max-w-md text-body-sm leading-relaxed text-on-surface-variant">
          Nous n&apos;avons pas pu afficher cette page. Vos données et votre panier
          ne sont pas affectés. Réessayez ou revenez à l&apos;accueil.
        </p>
        {error.digest && (
          <p className="mt-3 text-[0.66rem] text-outline">
            Référence technique : {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          <button type="button" onClick={reset} className="btn-primary btn-sm">
            Réessayer
          </button>
          <Link href="/" className="btn-outline btn-sm">
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
