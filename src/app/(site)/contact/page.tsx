import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/site/ContactForm";
import { Icon } from "@/components/ui/Icon";
import {
  WHATSAPP_MESSAGES,
  whatsappDisplay,
  whatsappHref,
} from "@/lib/whatsapp";
import { googleMapsAddressHref } from "@/lib/maps";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact & conciergerie",
  description:
    "Contactez AGHARAS VISION pour toute question sur une monture, une commande ou l’adresse du magasin à Agadir.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ sujet?: string }>;
}) {
  const [settings, stores, params] = await Promise.all([
    getSettings(),
    db.store.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    searchParams,
  ]);

  const whatsapp = whatsappDisplay(settings["store.whatsapp"]);
  const phone = settings["store.phone"] ?? "";
  const email = settings["store.email"] ?? "";

  return (
    <div className="bg-surface">
      <div className="border-b border-outline-variant bg-surface-dim">
        <div className="canvas py-4">
          <nav
            aria-label="Fil d'Ariane"
            className="flex flex-wrap items-center gap-2 text-[0.68rem] uppercase tracking-[0.12em] text-on-surface-variant"
          >
            <Link href="/" className="hover:text-primary">
              Accueil
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-primary">Contact &amp; conciergerie</span>
          </nav>
        </div>
      </div>

      <div className="canvas py-8 lg:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <p className="eyebrow">Conciergerie privée</p>
            <h1 className="mt-1 font-serif text-[2.2rem] leading-tight text-primary md:text-[2.9rem]">
              Un opticien vous répond
            </h1>
            <p className="mt-3 max-w-2xl text-body-md leading-relaxed text-on-surface-variant">
              Une question sur une monture, une ordonnance ou votre commande ?
              Notre équipe vous accompagne par téléphone, WhatsApp ou en salon.
              Les demandes reçoivent une réponse sous 24 heures ouvrées.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              {[
                {
                  icon: "whatsapp" as const,
                  label: "WhatsApp",
                  value: whatsapp,
                  href: whatsappHref(
                    settings["store.whatsapp"],
                    WHATSAPP_MESSAGES.general,
                  ),
                },
                {
                  icon: "phone" as const,
                  label: "Téléphone",
                  value: phone,
                  href: phone ? `tel:${phone.replace(/\s/g, "")}` : undefined,
                },
                {
                  icon: "mail" as const,
                  label: "E-mail",
                  value: email,
                  href: email ? `mailto:${email}` : undefined,
                },
              ].map((entry) => (
                <div key={entry.label} className="border border-outline-variant bg-white p-4">
                  <Icon name={entry.icon} size={18} className="text-secondary" />
                  <p className="mt-2 text-[0.55rem] uppercase tracking-[0.12em] text-outline">
                    {entry.label}
                  </p>
                  {entry.href ? (
                    <a
                      href={entry.href}
                      target={entry.icon === "whatsapp" ? "_blank" : undefined}
                      rel={entry.icon === "whatsapp" ? "noopener noreferrer" : undefined}
                      className="mt-0.5 block break-words text-[0.75rem] text-primary hover:text-secondary"
                    >
                      {entry.value}
                    </a>
                  ) : (
                    <p className="mt-0.5 text-[0.75rem] text-primary">{entry.value}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 border border-outline-variant bg-white p-5 md:p-6">
              <h2 className="font-serif text-xl text-primary">
                Écrire à la conciergerie
              </h2>
              <p className="mt-1 text-[0.75rem] text-on-surface-variant">
                Les champs marqués sont requis. Pour une ordonnance, utilisez
                plutôt l&apos;espace privé de configuration.
              </p>
              <div className="mt-4">
                <ContactForm defaultSubject={params.sujet} />
              </div>
            </div>

            <p className="mt-3 text-[0.68rem] leading-relaxed text-outline">
              Les coordonnées affichées sont celles renseignées dans l’espace propriétaire.
            </p>
          </section>

          <aside className="space-y-5 lg:col-span-5">
            <div className="relative aspect-[4/3] overflow-hidden bg-surface-dim">
              <Image
                src="/images/stitch/nos_boutiques_salons_priv_s-02.jpg"
                alt="Salon d'optique privé, ambiance éditoriale"
                fill
                sizes="(max-width: 1024px) 100vw, 420px"
                className="object-cover"
              />
            </div>

            <div className="border border-outline-variant bg-white p-5">
              <h2 className="flex items-center gap-2 font-serif text-xl text-primary">
                <Icon name="clock" size={18} className="text-secondary" />
                Horaires
              </h2>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                {settings["store.hours"]}
              </p>
              <p className="mt-2 text-[0.72rem] leading-relaxed text-outline">
                Les demandes envoyées en dehors des horaires sont traitées le
                jour ouvré suivant.
              </p>
            </div>

            <div className="border border-outline-variant bg-primary p-5 text-white">
              <p className="text-[0.6rem] uppercase tracking-[0.16em] text-gold">
                Rendez-vous en salon
              </p>
              <p className="mt-1 font-serif text-xl">
                Un espace privé pour votre essayage
              </p>
              <p className="mt-1 text-[0.78rem] leading-relaxed text-white/75">
                Relevé optométrique, essayage de collections et ajustement de
                votre monture, sur rendez-vous.
              </p>
              <a
                href={whatsappHref(
                  settings["store.whatsapp"],
                  WHATSAPP_MESSAGES.appointment,
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 border border-white/30 px-3 py-2 text-[0.62rem] uppercase tracking-[0.1em] transition-colors hover:border-gold hover:text-gold"
              >
                <Icon name="calendar" size={13} />
                Demander un rendez-vous
              </a>
            </div>

            <div className="border border-outline-variant bg-surface-dim p-5">
              <h2 className="font-serif text-lg text-primary">Notre adresse</h2>
              <ul className="mt-2 space-y-3">
                {stores.map((store) => (
                  <li key={store.id} className="text-[0.75rem] leading-relaxed">
                    <p className="font-medium text-primary">{store.name}</p>
                    <a href={googleMapsAddressHref(store.address, store.city)} target="_blank" rel="noopener noreferrer" className="text-on-surface-variant underline underline-offset-2">{store.address} · Itinéraire</a>
                    <p className="text-on-surface-variant">
                      {store.city} · {store.phone}
                    </p>
                  </li>
                ))}
              </ul>
              <Link
                href="/boutiques"
                className="mt-3 inline-flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.1em] text-primary hover:text-secondary"
              >
                Voir l’adresse et l’itinéraire
                <Icon name="arrow-right" size={12} />
              </Link>
            </div>

            <div className="border border-outline-variant bg-white p-5">
              <h2 className="flex items-center gap-2 font-serif text-lg text-primary">
                <Icon name="shield" size={17} className="text-secondary" />
                Urgence optique
              </h2>
              <p className="mt-1 text-[0.75rem] leading-relaxed text-on-surface-variant">
                En cas de gêne visuelle aiguë, de douleur ou de traumatisme,
                consultez un professionnel de santé sans attendre. Notre maison
                ne réalise pas de diagnostic médical à distance.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
