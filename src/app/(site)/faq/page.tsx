import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { Icon } from "@/components/ui/Icon";
import { WHATSAPP_MESSAGES, whatsappHref } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Foire aux questions",
  description:
    "Réponses aux questions sur les montures, les verres correcteurs, les ordonnances, la livraison et les retours chez AGHARAS VISION.",
  alternates: { canonical: "/faq" },
};

export default async function FaqPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; categorie?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const category = (params.categorie ?? "").trim();

  const [allFaqs, settings] = await Promise.all([
    db.faqItem.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { question: "asc" }],
    }),
    getSettings(),
  ]);

  const categories = Array.from(new Set(allFaqs.map((faq) => faq.category)));
  const faqs = allFaqs.filter((faq) => {
    const matchesCategory = !category || faq.category === category;
    const haystack = `${faq.question} ${faq.answer}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const whatsapp = whatsappHref(
    settings["store.whatsapp"],
    WHATSAPP_MESSAGES.faq,
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.slice(0, 12).map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div className="bg-surface">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

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
            <span className="text-primary">Foire aux questions</span>
          </nav>
        </div>
      </div>

      <div className="canvas py-8 lg:py-12">
        <header className="mx-auto max-w-3xl text-center">
          <p className="eyebrow">Conseils & informations</p>
          <h1 className="mt-1 font-serif text-[2.2rem] leading-tight text-primary md:text-[2.9rem]">
            Foire aux questions
          </h1>
          <p className="mt-3 text-body-md leading-relaxed text-on-surface-variant">
            Montures, verres correcteurs, ordonnances, livraison et mutuelles :
            retrouvez les réponses de la maison. Pour un conseil personnalisé,
            notre conciergerie reste à votre écoute.
          </p>
        </header>

        <div className="mx-auto mt-7 max-w-3xl">
          <form method="get" action="/faq" role="search" className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <label htmlFor="faq-search" className="sr-only">
                Rechercher dans la foire aux questions
              </label>
              <input
                id="faq-search"
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Rechercher une question…"
                className="field pl-10"
              />
              <Icon
                name="search"
                size={17}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              />
            </div>
            <select
              name="categorie"
              defaultValue={category}
              aria-label="Filtrer par catégorie"
              className="field sm:w-56"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary px-5">
              Rechercher
            </button>
          </form>

          {(query || category) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[0.7rem] text-on-surface-variant">
              <span>{faqs.length} résultat(s)</span>
              {query && <span className="badge">« {query} »</span>}
              {category && <span className="badge">{category}</span>}
              <Link href="/faq" className="link-underline text-primary">
                Réinitialiser
              </Link>
            </div>
          )}
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl items-start gap-8 lg:grid-cols-12">
          <section className="lg:col-span-8">
            {faqs.length === 0 ? (
              <div className="border border-outline-variant bg-white p-8 text-center">
                <Icon name="search" size={30} className="mx-auto text-outline" />
                <h2 className="mt-3 font-serif text-xl text-primary">
                  Aucune réponse trouvée
                </h2>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  Reformulez votre recherche ou contactez directement notre
                  conciergerie.
                </p>
                <Link href="/contact" className="btn-primary mt-4">
                  Poser ma question
                </Link>
              </div>
            ) : (
              <div className="border border-outline-variant bg-white">
                {faqs.map((faq, index) => (
                  <details
                    key={faq.id}
                    className="group border-b border-outline-variant last:border-b-0"
                    open={index === 0}
                  >
                    <summary className="flex items-start justify-between gap-4 px-5 py-4">
                      <span>
                        <span className="block text-[0.55rem] uppercase tracking-[0.12em] text-secondary">
                          {faq.category}
                        </span>
                        <span className="mt-0.5 block font-serif text-lg leading-snug text-primary">
                          {faq.question}
                        </span>
                      </span>
                      <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center border border-outline-variant text-on-surface-variant transition-transform group-open:rotate-180">
                        <Icon name="chevron-down" size={14} />
                      </span>
                    </summary>
                    <div className="px-5 pb-5">
                      <p className="whitespace-pre-line text-body-sm leading-relaxed text-on-surface-variant">
                        {faq.answer}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:col-span-4">
            <div className="border border-outline-variant bg-white p-5">
              <h2 className="font-serif text-xl text-primary">
                Une question particulière ?
              </h2>
              <p className="mt-1 text-[0.78rem] leading-relaxed text-on-surface-variant">
                Un opticien diplômé peut vous répondre directement. Pour les
                ordonnances, privilégiez l&apos;espace privé de configuration.
              </p>
              <div className="mt-3 space-y-2">
                <Link href="/contact" className="btn-primary btn-sm w-full">
                  Contacter la conciergerie
                </Link>
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-quiet btn-sm w-full gap-1.5"
                  aria-label="Contacter sur WhatsApp"
                >
                  <Icon name="whatsapp" size={14} />
                  WhatsApp
                </a>
              </div>
            </div>

            <div className="border border-outline-variant bg-surface-dim p-5">
              <h2 className="font-serif text-lg text-primary">Liens utiles</h2>
              <ul className="mt-2 space-y-2 text-[0.78rem]">
                {[
                  { label: "Livraison & expédition", href: "/livraison" },
                  { label: "Retours & garanties", href: "/retours" },
                  { label: "Prendre rendez-vous en salon", href: "/boutiques" },
                  { label: "Conditions générales de vente", href: "/cgv" },
                  { label: "Politique de confidentialité", href: "/confidentialite" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1.5 text-on-surface-variant transition-colors hover:text-primary"
                    >
                      <Icon name="chevron-right" size={12} />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-outline-variant bg-primary p-5 text-white">
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-gold">
                Atelier
              </p>
              <p className="mt-1 font-serif text-lg">
                Montage &amp; contrôle de précision
              </p>
              <p className="mt-1 text-[0.75rem] leading-relaxed text-white/75">
                Chaque paire est contrôlée au banc optique avant expédition. Les
                mesures sont vérifiées par un opticien.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
