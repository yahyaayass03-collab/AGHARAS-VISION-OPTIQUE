import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSessionUser } from "@/lib/auth/session";
import { isOwner } from "@/lib/auth/owner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Connexion administrateur",
  description:
    "Espace privé du propriétaire d’AGHARAS VISION : gestion du catalogue, des commandes et du contenu de la boutique.",
  alternates: { canonical: "/connexion" },
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ suivant?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();

  if (user && isOwner(user)) {
    redirect("/admin");
  }

  return (
    <AuthShell
      eyebrow="Maison d'Optique · Accès propriétaire"
      title="Administration de la boutique"
      description="Cet espace est réservé au propriétaire. Les clients achètent librement, sans créer de compte."
      image="/images/stitch/connexion_espace_client-01.jpg"
      imageAlt="Monture optique en titane doré posée sur un socle de travertin"
      footer={
        <div className="text-center">
          <p className="font-serif text-lg text-primary">Un problème d&apos;accès ?</p>
          <p className="mx-auto mt-1 max-w-sm text-[0.75rem] leading-relaxed text-on-surface-variant">
            Le compte propriétaire est créé par la personne qui installe la
            boutique. Aucune inscription publique n&apos;est possible. Pour
            réinitialiser l&apos;accès, utilisez la commande sécurisée
            <span className="mx-1 font-mono text-[0.7rem] text-primary">npm run owner:provision</span>
            sur le serveur.
          </p>
        </div>
      }
    >
      <LoginForm next={params.suivant} />
    </AuthShell>
  );
}
