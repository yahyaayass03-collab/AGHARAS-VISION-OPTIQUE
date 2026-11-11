import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatDateTimeFr } from "@/lib/utils";
import { AdminEmpty, AdminNotice, AdminPageHeader } from "@/components/admin/AdminUI";
import { ConfirmButton } from "@/components/admin/FormBits";
import {
  BannerForm,
  ContentPageForm,
  FaqForm,
  type BannerValues,
  type ContentPageValues,
  type FaqValues,
} from "@/components/admin/ContentForms";
import {
  deleteBannerAction,
  deleteFaqAction,
} from "@/app/actions/admin/system";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Contenu" };
export const dynamic = "force-dynamic";

const SUPPORTED_PAGES = [
  { value: "livraison", label: "Livraison & expédition (/livraison)" },
  { value: "retours", label: "Retours & garanties (/retours)" },
  { value: "confidentialite", label: "Confidentialité (/confidentialite)" },
  { value: "cgv", label: "Conditions générales de vente (/cgv)" },
  { value: "mentions-legales", label: "Mentions légales (/mentions-legales)" },
  { value: "a-propos", label: "La Maison (/a-propos)" },
];

type Tab = "pages" | "faq" | "bannieres";

const TABS: Array<{ id: Tab; label: string; icon: "file" | "list" | "edit" }> = [
  { id: "pages", label: "Pages", icon: "file" },
  { id: "faq", label: "FAQ", icon: "list" },
  { id: "bannieres", label: "Bannières", icon: "edit" },
];

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{
    onglet?: string;
    modifier?: string;
    nouveau?: string;
  }>;
}) {
  await requirePermission("content.manage");
  const params = await searchParams;
  const tab: Tab =
    params.onglet === "faq"
      ? "faq"
      : params.onglet === "bannieres"
        ? "bannieres"
        : "pages";

  const [pages, faqItems, banners, editingPage, editingFaq, editingBanner] =
    await Promise.all([
      db.contentPage.findMany({ orderBy: { slug: "asc" } }),
      db.faqItem.findMany({ orderBy: [{ category: "asc" }, { sortOrder: "asc" }] }),
      db.banner.findMany({ orderBy: [{ position: "asc" }, { key: "asc" }] }),
      tab === "pages" && params.modifier
        ? db.contentPage.findUnique({ where: { id: params.modifier } })
        : Promise.resolve(null),
      tab === "faq" && params.modifier
        ? db.faqItem.findUnique({ where: { id: params.modifier } })
        : Promise.resolve(null),
      tab === "bannieres" && params.modifier
        ? db.banner.findUnique({ where: { id: params.modifier } })
        : Promise.resolve(null),
    ]);

  const pageValues: ContentPageValues | undefined = editingPage
    ? {
        id: editingPage.id,
        slug: editingPage.slug,
        title: editingPage.title,
        intro: editingPage.intro ?? "",
        body: editingPage.body,
        metaDescription: editingPage.metaDescription ?? "",
        isPublished: editingPage.isPublished,
      }
    : undefined;

  const faqValues: FaqValues | undefined = editingFaq
    ? {
        id: editingFaq.id,
        question: editingFaq.question,
        answer: editingFaq.answer,
        category: editingFaq.category,
        sortOrder: editingFaq.sortOrder,
        isActive: editingFaq.isActive,
      }
    : undefined;

  const bannerValues: BannerValues | undefined = editingBanner
        ? {
        id: editingBanner.id,
        key: editingBanner.key,
        position: editingBanner.position,
        eyebrow: editingBanner.eyebrow ?? "",
        title: editingBanner.title,
        subtitle: editingBanner.subtitle ?? "",
        imageUrl: editingBanner.imageUrl ?? "",
        ctaLabel: editingBanner.ctaLabel ?? "",
        ctaHref: editingBanner.ctaHref ?? "",
        sortOrder: editingBanner.sortOrder,
        isActive: editingBanner.isActive,
      }
    : undefined;

  const newPage = tab === "pages" && Boolean(params.nouveau);
  const newFaq = tab === "faq" && Boolean(params.nouveau);
  const newBanner = tab === "bannieres" && Boolean(params.nouveau);
  const showForm = Boolean(
    pageValues || faqValues || bannerValues || newPage || newFaq || newBanner,
  );

  const newHref = `/admin/contenu?onglet=${tab}&nouveau=1`;
  const tabHref = (next: Tab) => `/admin/contenu?onglet=${next}`;

  return (
    <>
      <AdminPageHeader
        eyebrow="Éditorial"
        title="Contenu"
        description="Pages institutionnelles, FAQ et visuels éditoriaux. Images, textes et liens restent modifiables depuis le CMS."
        actions={
          showForm ? (
            <Link href={tabHref(tab)} className="btn-quiet btn-sm">
              Retour à la liste
            </Link>
          ) : (
            <Link href={newHref} className="btn-primary btn-sm">
              <Icon name="plus" size={14} />
              {tab === "pages"
                ? "Modifier une page"
                : tab === "faq"
                  ? "Nouvelle question"
                  : "Nouvelle bannière"}
            </Link>
          )
        }
      />

      <nav
        aria-label="Sections de contenu"
        className="mb-4 flex flex-wrap gap-1 border-b border-outline-variant"
      >
        {TABS.map((entry) => {
          const active = entry.id === tab;
          return (
            <Link
              key={entry.id}
              href={tabHref(entry.id)}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-[0.75rem] transition-colors ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-primary"
              }`}
            >
              <Icon name={entry.icon} size={13} />
              {entry.label}
            </Link>
          );
        })}
      </nav>

      {showForm && (
        <section className="mb-5 border border-outline-variant bg-white">
          <div className="border-b border-outline-variant px-4 py-3">
            <h2 className="font-serif text-lg text-primary">
              {pageValues
                ? `Modifier « ${pageValues.title} »`
                : faqValues
                  ? "Modifier la question"
                  : bannerValues
                    ? `Modifier la bannière « ${bannerValues.key} »`
                    : tab === "pages"
                      ? "Modifier une page du site"
                      : tab === "faq"
                        ? "Nouvelle question"
                        : "Nouvelle bannière"}
            </h2>
          </div>
          <div className="p-4">
            {tab === "pages" && (
              <ContentPageForm page={pageValues} slugOptions={SUPPORTED_PAGES} />
            )}
            {tab === "faq" && (
              <FaqForm item={faqValues} onDone="/admin/contenu?onglet=faq" />
            )}
            {tab === "bannieres" && (
              <BannerForm
                banner={bannerValues}
                onDone="/admin/contenu?onglet=bannieres"
              />
            )}
          </div>
        </section>
      )}

      {tab === "pages" && !showForm && (
        <>
          <AdminNotice tone="warning">
            Six routes statiques sont servies par la boutique (livraison,
            retours, confidentialité, CGV, mentions légales, à propos). Le
            sélecteur de page limite la création à ces routes ; le contenu est
            saisi en texte structuré (## titres, - listes, &gt; encadrés, **gras**).
          </AdminNotice>
          <div className="mt-4 overflow-x-auto border border-outline-variant bg-white">
            <table className="table-admin">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Chemin</th>
                  <th>État</th>
                  <th>Dernière modification</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pages.map((page) => (
                  <tr key={page.id}>
                    <td>
                      <span className="font-medium text-primary">{page.title}</span>
                      {page.intro && (
                        <span className="mt-0.5 block max-w-md text-[0.66rem] leading-snug text-on-surface-variant">
                          {page.intro}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap font-mono text-[0.7rem] text-on-surface-variant">
                      /{page.slug}
                    </td>
                    <td>
                      <span className={page.isPublished ? "badge-success" : "badge"}>
                        {page.isPublished ? "Publiée" : "Brouillon"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-[0.7rem] text-on-surface-variant">
                      {formatDateTimeFr(page.updatedAt)}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          href={`/${page.slug}`}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 text-[0.7rem] text-on-surface-variant hover:text-primary"
                        >
                          <Icon name="external" size={11} /> Voir
                        </Link>
                        <Link
                          href={`/admin/contenu?onglet=pages&modifier=${page.id}`}
                          className="text-[0.7rem] text-primary underline underline-offset-2 hover:no-underline"
                        >
                          Modifier
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pages.length === 0 && (
              <div className="p-4">
                <AdminEmpty
                  title="Aucune page"
                  description="Les pages institutionnelles sont créées par le script de démonstration."
                />
              </div>
            )}
          </div>
        </>
      )}

      {tab === "faq" && !showForm && (
        <div className="overflow-x-auto border border-outline-variant bg-white">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Question</th>
                <th>Catégorie</th>
                <th>Ordre</th>
                <th>État</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {faqItems.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="font-medium text-primary">{item.question}</span>
                    <span className="mt-0.5 block max-w-xl text-[0.66rem] leading-snug text-on-surface-variant">
                      {item.answer.slice(0, 160)}
                      {item.answer.length > 160 ? "…" : ""}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-[0.72rem] text-on-surface-variant">
                    {item.category}
                  </td>
                  <td className="text-[0.72rem] text-on-surface-variant">
                    {item.sortOrder}
                  </td>
                  <td>
                    <span className={item.isActive ? "badge-success" : "badge"}>
                      {item.isActive ? "Visible" : "Masquée"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/contenu?onglet=faq&modifier=${item.id}`}
                        className="text-[0.7rem] text-primary underline underline-offset-2 hover:no-underline"
                      >
                        Modifier
                      </Link>
                      <form action={deleteFaqAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <ConfirmButton
                          label="Supprimer"
                          message="Supprimer définitivement cette question de la FAQ ?"
                        />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {faqItems.length === 0 && (
            <div className="p-4">
              <AdminEmpty
                title="Aucune question"
                description="Ajoutez les questions fréquentes de vos clients."
                action={
                  <Link
                    href="/admin/contenu?onglet=faq&nouveau=1"
                    className="btn-primary btn-sm"
                  >
                    Ajouter une question
                  </Link>
                }
              />
            </div>
          )}
        </div>
      )}

      {tab === "bannieres" && !showForm && (
        <div className="overflow-x-auto border border-outline-variant bg-white">
          <table className="table-admin">
            <thead>
              <tr>
                <th>Clé</th>
                <th>Emplacement</th>
                <th>Titre</th>
                <th>Appel à l&apos;action</th>
                <th>État</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((banner) => (
                <tr key={banner.id}>
                  <td className="whitespace-nowrap font-mono text-[0.72rem] text-on-surface-variant">
                    {banner.key}
                  </td>
                  <td className="whitespace-nowrap text-[0.7rem] text-on-surface-variant">
                    {banner.position === "about" ? "À propos" : "Accueil"}
                  </td>
                  <td>
                    <span className="font-medium text-primary">{banner.title}</span>
                    {banner.subtitle && (
                      <span className="mt-0.5 block max-w-md text-[0.66rem] leading-snug text-on-surface-variant">
                        {banner.subtitle}
                      </span>
                    )}
                  </td>
                  <td className="text-[0.7rem] text-on-surface-variant">
                    {banner.ctaLabel ?? "—"}
                    {banner.ctaHref && (
                      <span className="block font-mono text-[0.62rem] text-outline">
                        {banner.ctaHref}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={banner.isActive ? "badge-success" : "badge"}>
                      {banner.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/contenu?onglet=bannieres&modifier=${banner.id}`}
                        className="text-[0.7rem] text-primary underline underline-offset-2 hover:no-underline"
                      >
                        Modifier
                      </Link>
                      <form action={deleteBannerAction}>
                        <input type="hidden" name="id" value={banner.id} />
                        <ConfirmButton
                          label="Supprimer"
                          message="Supprimer définitivement cette bannière ?"
                        />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {banners.length === 0 && (
            <div className="p-4">
              <AdminEmpty
                title="Aucune bannière"
                description="Les bannières alimentent les blocs éditoriaux de la page d'accueil."
                action={
                  <Link
                    href="/admin/contenu?onglet=bannieres&nouveau=1"
                    className="btn-primary btn-sm"
                  >
                    Créer une bannière
                  </Link>
                }
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
