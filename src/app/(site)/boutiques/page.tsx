import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { jsonStringList } from "@/lib/json-string-list";
import { getSettings } from "@/lib/settings";
import { Icon } from "@/components/ui/Icon";
import { SectionHeading } from "@/components/site/Price";
import { whatsappHref } from "@/lib/whatsapp";
import { googleMapsAddressHref } from "@/lib/maps";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notre adresse",
  description: "Retrouvez l’adresse du magasin AGHARAS VISION à Agadir et ouvrez l’itinéraire dans Google Maps.",
  alternates: { canonical: "/boutiques" },
};

export default async function StoresPage() {
  const [stores, settings] = await Promise.all([
    db.store.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    getSettings(),
  ]);

  const whatsapp = whatsappHref(settings["store.whatsapp"]);
  const primaryStore = stores[0];
  const mapsUrl = primaryStore ? googleMapsAddressHref(primaryStore.address, primaryStore.city) : googleMapsAddressHref(settings["store.address"] || "N° 13 Imm 08 , Lot 4 Al kheir,Cité Essalam,AGADIR", settings["store.city"] || "Agadir");
  const localBusiness = primaryStore ? {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: settings["store.name"],
    url: `${SITE.url}/boutiques`,
    image: `${SITE.url}${settings["store.logo_url"] || "/images/brand/agharass-vision-logo-header.webp"}`,
    logo: `${SITE.url}${settings["store.logo_url"] || "/images/brand/agharass-vision-logo-header.webp"}`,
    telephone: primaryStore.phone,
    email: primaryStore.email || settings["store.email"],
    address: {
      "@type": "PostalAddress",
      streetAddress: primaryStore.address,
      addressLocality: primaryStore.city,
      addressCountry: "MA",
    },
    hasMap: googleMapsAddressHref(primaryStore.address, primaryStore.city),
  } : null;
  const images = [
    "/images/stitch/nos_boutiques_salons_priv_s-01.jpg",
    "/images/stitch/nos_boutiques_salons_priv_s-02.jpg",
    "/images/stitch/nos_boutiques_salons_priv_s-03.jpg",
  ] as const;
  const heroImage = images[0];

  return (
    <div className="bg-surface">
      {localBusiness && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness).replace(/</g, "\\u003c") }} />}
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
            <span className="text-primary">Notre adresse</span>
          </nav>
        </div>
      </div>

      <section className="relative overflow-hidden bg-primary text-white">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Visuel d’ambiance de la boutique AGHARAS VISION"
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-35"
          />
        </div>
        <div className="canvas relative py-14 md:py-20">
          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-gold">
            {settings["store.name"]} · {settings["store.city"]}
          </p>
          <h1 className="mt-2 max-w-3xl font-serif text-[2.3rem] leading-tight md:text-[3.4rem]">
            Retrouvez-nous à {settings["store.city"]}
          </h1>
          <p className="mt-3 max-w-2xl text-body-md leading-relaxed text-white/75">
            Consultez notre adresse et contactez l’équipe pour préparer votre visite.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/contact?sujet=Rendez-vous%20en%20salon" className="btn-gold">
              <Icon name="calendar" size={15} />
              Prendre rendez-vous
            </Link>
            <Link
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-white/30 px-5 py-3 text-[0.65rem] uppercase tracking-[0.12em] text-white transition-colors hover:border-gold hover:text-gold"
            >
              Voir l’itinéraire
              <Icon name="pin" size={14} />
            </Link>
          </div>
        </div>
      </section>

      <div className="canvas py-10 lg:py-14">
        <SectionHeading
          eyebrow={stores.length === 1 ? "Une adresse" : `${stores.length} adresses`}
          title={`AGHARAS VISION à ${settings["store.city"]}`}
          description="Les coordonnées et itinéraires ci-dessous sont gérés dans l’espace propriétaire."
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {stores.map((store, index) => (
            <article
              key={store.id}
              className="flex flex-col border border-outline-variant bg-white"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-surface-dim">
                <Image
                  src={images[(index + 1) % images.length] ?? heroImage}
                  alt={`Visuel d’ambiance associé à ${store.name}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 560px"
                  className="object-cover"
                />
                <span className="absolute left-3 top-3 bg-primary px-2 py-1 text-[0.55rem] uppercase tracking-[0.14em] text-white">
                  {store.city}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5 md:p-6">
                <h2 className="font-serif text-2xl leading-tight text-primary">
                  {store.name}
                </h2>
                <p className="mt-1 text-[0.72rem] uppercase tracking-[0.08em] text-secondary">
                  {store.city} · Maroc
                </p>

                <dl className="mt-3 space-y-2 text-[0.78rem]">
                  <div className="flex items-start gap-2">
                    <dt className="mt-0.5 text-outline">
                      <Icon name="pin" size={14} />
                      <span className="sr-only">Adresse</span>
                    </dt>
                    <dd className="text-on-surface-variant">{store.address}</dd>
                  </div>
                  <div className="flex items-start gap-2">
                    <dt className="mt-0.5 text-outline">
                      <Icon name="clock" size={14} />
                      <span className="sr-only">Horaires</span>
                    </dt>
                    <dd className="text-on-surface-variant">{store.hours}</dd>
                  </div>
                  <div className="flex items-start gap-2">
                    <dt className="mt-0.5 text-outline">
                      <Icon name="phone" size={14} />
                      <span className="sr-only">Téléphone</span>
                    </dt>
                    <dd>
                      <a
                        href={`tel:${store.phone.replace(/\s/g, "")}`}
                        className="text-primary hover:text-secondary"
                      >
                        {store.phone}
                      </a>
                      {store.email && (
                        <>
                          {" · "}
                          <a
                            href={`mailto:${store.email}`}
                            className="break-all text-primary hover:text-secondary"
                          >
                            {store.email}
                          </a>
                        </>
                      )}
                    </dd>
                  </div>
                </dl>

                {jsonStringList(store.services).length > 0 && (
                  <ul className="mt-4 grid gap-1.5 border-t border-outline-variant pt-3 sm:grid-cols-2">
                    {jsonStringList(store.services).map((service) => (
                      <li
                        key={service}
                        className="flex items-start gap-1.5 text-[0.72rem] leading-relaxed text-on-surface-variant"
                      >
                        <Icon name="check" size={12} className="mt-0.5 shrink-0 text-secondary" />
                        {service}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 flex flex-col gap-2 border-t border-outline-variant pt-3 sm:flex-row">
                  <a href={googleMapsAddressHref(store.address, store.city)} target="_blank" rel="noopener noreferrer" className="btn-quiet btn-sm flex-1 gap-1.5">
                    <Icon name="pin" size={14} />
                    Voir l’itinéraire
                  </a>
                  <Link
                    href="/contact?sujet=Rendez-vous%20en%20salon"
                    className="btn-primary btn-sm flex-1"
                  >
                    Prendre rendez-vous
                  </Link>
                  {whatsapp && (
                    <a
                      href={whatsappHref(
                        settings["store.whatsapp"],
                        `Bonjour, je souhaite contacter ${settings["store.name"]}.`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-quiet btn-sm flex-1 gap-1.5"
                      aria-label="Contacter sur WhatsApp"
                    >
                      <Icon name="whatsapp" size={14} />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-3">
          {[
            {
              icon: "eye" as const,
              title: "Relevé optométrique",
              text: "Mesures réalisées en salon, dans le respect de votre ordonnance et de votre confort visuel.",
            },
            {
              icon: "settings" as const,
              title: "Atelier d'ajustement",
              text: "Montage, centrage et ajustements réalisés par nos opticiens, sur place.",
            },
            {
              icon: "truck" as const,
              title: "Essai à domicile",
              text: "Sur rendez-vous et selon disponibilité, dans certaines villes. Contactez la conciergerie.",
            },
          ].map((entry) => (
            <div key={entry.title} className="border border-outline-variant bg-white p-5">
              <Icon name={entry.icon} size={20} className="text-secondary" />
              <h2 className="mt-2 font-serif text-lg text-primary">{entry.title}</h2>
              <p className="mt-1 text-[0.75rem] leading-relaxed text-on-surface-variant">
                {entry.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border border-outline-variant bg-surface-dim p-5 md:flex-row md:items-center">
          <div>
            <p className="text-[0.6rem] uppercase tracking-[0.14em] text-secondary">
              Service conciergerie
            </p>
            <p className="mt-1 font-serif text-xl text-primary">
              Une question avant votre visite ?
            </p>
            <p className="mt-1 max-w-xl text-[0.78rem] leading-relaxed text-on-surface-variant">
              Notre équipe peut vérifier la disponibilité d&apos;une monture,
              préparer une sélection ou organiser un essayage privé.
            </p>
          </div>
          <Link href="/contact" className="btn-primary shrink-0">
            Contacter la maison
          </Link>
        </div>
      </div>
    </div>
  );
}
