import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/site/Logo";
import { Icon } from "@/components/ui/Icon";
import { getSettings } from "@/lib/settings";

export async function AuthShell({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  children,
  footer,
  wide = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  image: string;
  imageAlt: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  const settings = await getSettings();
  return (
    <div className="flex min-h-screen flex-col bg-surface-dim">
      <div className="flex items-center justify-between border-b border-outline-variant bg-white px-5 py-4 md:px-8">
        <Logo compact logoUrl={settings["store.logo_url"]} brandName={settings["store.name"]} />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[0.65rem] uppercase tracking-[0.12em] text-on-surface-variant transition-colors hover:text-primary"
        >
          <Icon name="arrow-left" size={14} />
          Retour à la boutique
        </Link>
      </div>

      <main className="flex flex-1 items-center justify-center px-4 py-8 md:px-6 md:py-12">
        <div
          className={`w-full border border-outline-variant bg-white ${wide ? "max-w-2xl" : "max-w-lg"}`}
        >
          <div className="flex flex-col items-center px-5 pt-8 text-center md:px-10">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="h-px w-6 bg-outline-variant" />
              <p className="text-[0.6rem] uppercase tracking-[0.25em] text-secondary">
                {eyebrow ?? "Maison d'Optique · Maroc"}
              </p>
              <span aria-hidden="true" className="h-px w-6 bg-outline-variant" />
            </div>
            <h1 className="mt-3 font-serif text-[1.75rem] leading-tight text-primary md:text-[2rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-md text-body-sm leading-relaxed text-on-surface-variant">
                {description}
              </p>
            )}
          </div>

          <div className="relative mx-5 mt-6 aspect-[21/9] overflow-hidden bg-surface-container md:mx-10">
            <Image
              src={image}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 768px) 90vw, 512px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t/srgb from-black/25 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between gap-2">
              <span className="bg-white/90 px-2 py-0.5 text-[0.55rem] uppercase tracking-[0.18em] text-primary">
                Haute Lunetterie
              </span>
              <span className="text-[0.55rem] uppercase tracking-[0.18em] text-white/90">
                {settings["store.city"]} · Maroc
              </span>
            </div>
          </div>

          <div className="px-5 py-7 md:px-10 md:py-8">{children}</div>

          {footer && (
            <div className="border-t border-outline-variant bg-surface-dim px-5 py-5 md:px-10">
              {footer}
            </div>
          )}

          <div className="border-t border-outline-variant px-5 py-4 md:px-10">
            <div className="flex items-start gap-2.5">
              <Icon name="lock" size={16} className="mt-0.5 shrink-0 text-secondary" />
              <p className="text-[0.7rem] leading-relaxed text-on-surface-variant">
                <strong className="font-medium text-primary">Confidentialité :</strong>{" "}
                vos données optiques et vos ordonnances sont conservées dans un
                espace privé. Aucun mot de passe n&apos;est stocké en clair.
              </p>
            </div>
          </div>
        </div>
      </main>

      <p className="px-4 pb-6 text-center text-[0.65rem] uppercase tracking-[0.14em] text-outline">
        {settings["store.name"]} — Espace sécurisé
      </p>
    </div>
  );
}
