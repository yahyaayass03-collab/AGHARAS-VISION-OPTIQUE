import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { hasPlaceholders, parseContent, splitEmphasis } from "@/lib/content";
import type { ContentBlock } from "@/lib/content";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { WHATSAPP_MESSAGES, whatsappHref } from "@/lib/whatsapp";

const PAGE_META: Record<string, { eyebrow: string; icon: IconName }> = {
  livraison: { eyebrow: "Logistique & expédition", icon: "truck" },
  retours: { eyebrow: "Retours & garanties", icon: "shield" },
  confidentialite: { eyebrow: "Données personnelles & santé", icon: "lock" },
  cgv: { eyebrow: "Cadre contractuel", icon: "file" },
  "mentions-legales": { eyebrow: "Éditeur & conformité", icon: "info" },
  "a-propos": { eyebrow: "La maison", icon: "sparkle" },
};

const SIBLING_ORDER = [
  "livraison",
  "retours",
  "confidentialite",
  "cgv",
  "mentions-legales",
  "a-propos",
];

function Inline({ text }: { text: string }) {
  const parts = splitEmphasis(text);
  return (
    <>
      {parts.map((part, index) =>
        part.bold ? (
          <strong key={index} className="font-medium text-primary">
            {part.value}
          </strong>
        ) : (
          <span key={index}>{part.value}</span>
        ),
      )}
    </>
  );
}

function Block({ block }: { block: ContentBlock }) {
  if (block.kind === "heading") {
    if (block.level === 3) {
      return (
        <h3 id={block.id} className="mt-6 scroll-mt-28 font-serif text-lg text-primary">
          {block.text}
        </h3>
      );
    }
    return (
      <h4 id={block.id} className="mt-4 scroll-mt-28 font-serif text-base text-primary">
        {block.text}
      </h4>
    );
  }

  if (block.kind === "list") {
    return (
      <ul className="space-y-2">
        {block.items.map((item, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <span
              aria-hidden="true"
              className="mt-[0.55rem] h-1 w-1 shrink-0 rounded-full bg-secondary"
            />
            <span>
              <Inline text={item} />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.kind === "note") {
    return (
      <aside className="border-l-2 border-gold bg-surface-dim px-4 py-3 text-body-sm leading-relaxed text-on-surface-variant">
        <span className="mb-1 flex items-center gap-1.5 text-[0.6rem] uppercase tracking-[0.14em] text-secondary">
          <Icon name="info" size={12} />
          À noter
        </span>
        <Inline text={block.text} />
      </aside>
    );
  }

  return (
    <p>
      <Inline text={block.text} />
    </p>
  );
}

export async function ContentArticle({ slug }: { slug: string }) {
  const page = await db.contentPage.findFirst({
    where: { slug, isPublished: true },
  });

  if (!page) {
    return (
      <div className="canvas py-16 text-center">
        <p className="eyebrow">Document</p>
        <h1 className="mt-2 font-serif text-3xl text-primary">
          Cette page n&apos;est pas disponible
        </h1>
        <p className="mx-auto mt-2 max-w-md text-body-sm leading-relaxed text-on-surface-variant">
          Le contenu demandé n&apos;a pas été publié. Notre conciergerie peut vous
          transmettre l&apos;information par un autre canal.
        </p>
        <Link href="/contact" className="btn-primary mt-5">
          Contacter la maison
        </Link>
      </div>
    );
  }

  const [settings, siblings, aboutVisual] = await Promise.all([
    getSettings(),
    db.contentPage.findMany({
      where: { isPublished: true },
      select: { slug: true, title: true },
    }),
    slug === "a-propos"
      ? db.banner.findFirst({ where: { key: "about-univers", position: "about", isActive: true } })
      : Promise.resolve(null),
  ]);

  const meta = PAGE_META[slug] ?? { eyebrow: "Informations", icon: "file" as IconName };
  const parsed = parseContent(page.body);
  const updated = page.updatedAt.toLocaleDateString("fr-MA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const whatsapp = whatsappHref(
    settings["store.whatsapp"],
    WHATSAPP_MESSAGES.content,
  );
  const email = settings["store.email"] ?? "";
  const phone = settings["store.phone"] ?? "";
  const showPlaceholders = hasPlaceholders(page.body);

  const orderedSiblings = [...siblings].sort(
    (a, b) => SIBLING_ORDER.indexOf(a.slug) - SIBLING_ORDER.indexOf(b.slug),
  );

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
            <span className="text-primary">{page.title}</span>
          </nav>
        </div>
      </div>

      <section className="border-b border-outline-variant bg-white">
        <div className="canvas py-10 lg:py-14">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="eyebrow flex items-center gap-2">
                <Icon name={meta.icon} size={14} />
                {meta.eyebrow}
              </p>
              <h1 className="mt-2 font-serif text-[2.1rem] leading-[1.1] text-primary md:text-[3rem]">
                {page.title}
              </h1>
              {page.intro && (
                <p className="mt-3 max-w-xl text-body-md leading-relaxed text-on-surface-variant">
                  {page.intro}
                </p>
              )}
            </div>

            <dl className="w-full shrink-0 border border-outline-variant bg-surface-dim p-4 text-[0.66rem] uppercase tracking-[0.1em] text-on-surface-variant md:w-64">
              <div className="flex items-center justify-between gap-3 border-b border-outline-variant pb-2">
                <dt>Dernière révision</dt>
                <dd className="text-right font-medium text-primary">{updated}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-outline-variant py-2">
                <dt>Paiement</dt>
                <dd className="text-right font-medium text-primary">
                  À la livraison
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 pt-2">
                <dt>Ordonnances</dt>
                <dd className="text-right font-medium text-primary">
                  Stockage privé
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {aboutVisual?.imageUrl && (
        <section className="border-b border-outline-variant bg-white">
          <div className="canvas py-8 lg:py-10">
            <figure className="overflow-hidden border border-outline-variant bg-surface-dim">
              <div className="relative aspect-[16/9] overflow-hidden bg-surface-container">
                <Image
                  src={aboutVisual.imageUrl}
                  alt="Illustration conceptuelle d’un espace d’optique aux tons vert profond et dorés; elle ne représente pas nécessairement un point de vente réel"
                  fill
                  sizes="(max-width: 768px) 100vw, 1200px"
                  className="object-cover"
                />
              </div>
              <figcaption className="flex flex-col gap-1 p-4 md:flex-row md:items-baseline md:justify-between md:px-6">
                <span className="font-serif text-lg text-primary">{aboutVisual.title}</span>
                {aboutVisual.subtitle && <span className="text-body-sm text-on-surface-variant">{aboutVisual.subtitle}</span>}
              </figcaption>
            </figure>
          </div>
        </section>
      )}

      <div className="border-b border-outline-variant bg-primary text-white">
        <div className="canvas grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: "truck" as const, label: "Livraison", value: "Options à la commande" },
            { icon: "shield" as const, label: "Garanties", value: "Voir les conditions" },
            { icon: "lock" as const, label: "Confidentialité", value: "Ordonnances privées" },
            { icon: "bag" as const, label: "Règlement", value: "À la réception" },
          ].map((entry) => (
            <div key={entry.label} className="flex items-center gap-3">
              <Icon name={entry.icon} size={22} className="shrink-0 text-gold" />
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-white/55">
                  {entry.label}
                </p>
                <p className="text-[0.8rem] font-medium text-white">{entry.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="canvas py-10 lg:py-14">
        <div className="grid items-start gap-8 lg:grid-cols-12">
          <aside className="lg:col-span-4 lg:sticky lg:top-28">
            <div className="border border-outline-variant bg-white">
              <div className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
                <span className="text-[0.6rem] uppercase tracking-[0.16em] text-on-surface-variant">
                  Sommaire
                </span>
                <span className="text-[0.55rem] uppercase tracking-[0.12em] text-outline">
                  {String(parsed.toc.length).padStart(2, "0")} chapitre
                  {parsed.toc.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Mobile : sommaire repliable */}
              <details className="group lg:hidden">
                <summary className="flex items-center justify-between px-4 py-3 text-body-sm text-primary">
                  Afficher les chapitres
                  <Icon
                    name="chevron-down"
                    size={14}
                    className="text-outline transition-transform group-open:rotate-180"
                  />
                </summary>
                <ol className="border-t border-outline-variant px-2 py-2">
                  {parsed.toc.map((entry, index) => (
                    <li key={entry.id}>
                      <a
                        href={`#${entry.id}`}
                        className="flex items-center gap-2 px-2 py-2 text-body-sm text-on-surface-variant hover:text-primary"
                      >
                        <span className="text-[0.6rem] tracking-[0.1em] text-outline">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {entry.title}
                      </a>
                    </li>
                  ))}
                </ol>
              </details>

              <nav aria-label="Sommaire du document" className="hidden p-2 lg:block">
                <ol>
                  {parsed.toc.map((entry, index) => (
                    <li key={entry.id}>
                      <a
                        href={`#${entry.id}`}
                        className="group flex items-start gap-2.5 px-2 py-2 text-body-sm leading-snug text-on-surface-variant transition-colors hover:bg-surface-dim hover:text-primary"
                      >
                        <span className="mt-0.5 text-[0.6rem] tracking-[0.1em] text-outline group-hover:text-secondary">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1">{entry.title}</span>
                        <Icon
                          name="arrow-right"
                          size={12}
                          className="mt-1 shrink-0 text-outline opacity-0 transition-opacity group-hover:opacity-100"
                        />
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            <div className="mt-4 border border-outline-variant bg-surface-dim p-4">
              <p className="text-[0.58rem] font-medium uppercase tracking-[0.14em] text-secondary">
                Besoin d&apos;une précision ?
              </p>
              <p className="mt-1 text-[0.76rem] leading-relaxed text-on-surface-variant">
                Notre conciergerie répond aux questions administratives,
                optiques et logistiques.
              </p>
              <div className="mt-3 space-y-1.5 text-[0.76rem]">
                {phone && (
                  <a
                    href={`tel:${phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-2 text-primary hover:text-secondary"
                  >
                    <Icon name="phone" size={13} className="text-secondary" />
                    {phone}
                  </a>
                )}
                {email && (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center gap-2 break-all text-primary hover:text-secondary"
                  >
                    <Icon name="mail" size={13} className="text-secondary" />
                    {email}
                  </a>
                )}
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-primary hover:text-secondary"
                >
                  <Icon name="edit" size={13} className="text-secondary" />
                  Formulaire de contact
                </Link>
              </div>
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-quiet btn-sm mt-3 w-full gap-1.5"
                aria-label="Contacter sur WhatsApp"
              >
                <Icon name="whatsapp" size={13} />
                Écrire à la conciergerie
              </a>
            </div>

            <div className="mt-4 border border-outline-variant bg-primary p-4 text-white">
              <p className="text-[0.55rem] uppercase tracking-[0.18em] text-gold">
                Atelier
              </p>
              <p className="mt-1 font-serif text-lg leading-snug">
                Montage &amp; contrôle de précision
              </p>
              <p className="mt-1.5 text-[0.74rem] leading-relaxed text-white/70">
                Chaque paire est contrôlée au banc optique avant expédition, avec
                une facture conforme pour votre mutuelle.
              </p>
            </div>
          </aside>

          <div className="lg:col-span-8">
            <article className="space-y-6">
              {parsed.intro.length > 0 && (
                <div className="space-y-4 border border-outline-variant bg-white p-5 text-body-md leading-relaxed text-on-surface-variant md:p-7">
                  {parsed.intro.map((block, index) => (
                    <Block key={index} block={block} />
                  ))}
                </div>
              )}

              {parsed.sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 border border-outline-variant bg-white p-5 md:p-7"
                >
                  <div className="mb-4 flex items-start justify-between gap-4 border-b border-outline-variant pb-3">
                    <div>
                      <p className="text-[0.58rem] uppercase tracking-[0.16em] text-secondary">
                        Section {String(index + 1).padStart(2, "0")}
                      </p>
                      <h2 className="mt-1 font-serif text-2xl leading-tight text-primary">
                        {section.title}
                      </h2>
                    </div>
                    <span aria-hidden="true" className="text-outline">
                      <Icon name={meta.icon} size={18} />
                    </span>
                  </div>
                  <div className="space-y-3.5 text-body-md leading-relaxed text-on-surface-variant">
                    {section.blocks.map((block, blockIndex) => (
                      <Block key={blockIndex} block={block} />
                    ))}
                  </div>
                </section>
              ))}

              {showPlaceholders && (
                <div className="border border-gold/60 bg-gold/10 p-5">
                  <p className="flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.14em] text-secondary">
                    <Icon name="alert" size={13} />
                    Document de démonstration
                  </p>
                  <p className="mt-1.5 text-body-sm leading-relaxed text-on-surface-variant">
                    Certaines mentions réglementaires de cette page (identifiants
                    d&apos;entreprise, autorisation CNDP, coordonnées) sont des
                    espaces réservés. Le propriétaire doit les compléter et les
                    faire vérifier avant toute exploitation commerciale.
                  </p>
                </div>
              )}

              <div className="flex flex-col items-start justify-between gap-4 border border-outline-variant bg-surface-dim p-5 md:flex-row md:items-center">
                <div>
                  <p className="text-[0.58rem] uppercase tracking-[0.14em] text-secondary">
                    Une question sur ce document ?
                  </p>
                  <p className="mt-1 max-w-md text-body-sm leading-relaxed text-on-surface-variant">
                    Notre équipe peut préciser une clause, un délai ou une
                    procédure avant votre commande.
                  </p>
                </div>
                <Link href="/contact" className="btn-primary shrink-0">
                  Nous écrire
                </Link>
              </div>
            </article>

            {orderedSiblings.length > 1 && (
              <nav
                aria-label="Autres informations"
                className="mt-6 grid gap-2 sm:grid-cols-2"
              >
                {orderedSiblings
                  .filter((entry) => entry.slug !== slug)
                  .slice(0, 4)
                  .map((entry) => (
                    <Link
                      key={entry.slug}
                      href={`/${entry.slug}`}
                      className="group flex items-center justify-between gap-3 border border-outline-variant bg-white px-4 py-3 text-[0.78rem] text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
                    >
                      {entry.title}
                      <Icon
                        name="arrow-right"
                        size={13}
                        className="shrink-0 text-outline transition-transform group-hover:translate-x-0.5 group-hover:text-secondary"
                      />
                    </Link>
                  ))}
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
