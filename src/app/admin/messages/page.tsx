import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth/guards";
import { formatDateTimeFr } from "@/lib/utils";
import { AdminEmpty, AdminPageHeader, Pagination } from "@/components/admin/AdminUI";
import { ConfirmButton } from "@/components/admin/FormBits";
import {
  deleteNewsletterSubscriberAction,
  toggleNewsletterSubscriberAction,
  updateContactStatusAction,
} from "@/app/actions/admin/system";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const STATUSES = ["NEW", "IN_PROGRESS", "CLOSED"] as const;

const STATUS_LABELS: Record<string, string> = {
  NEW: "Nouveau",
  IN_PROGRESS: "En cours",
  CLOSED: "Traité",
};

type Tab = "messages" | "newsletter";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ onglet?: string; statut?: string; page?: string }>;
}) {
  await requirePermission("content.manage");
  const params = await searchParams;
  const tab: Tab = params.onglet === "newsletter" ? "newsletter" : "messages";
  const status = STATUSES.includes(params.statut as (typeof STATUSES)[number])
    ? (params.statut as string)
    : "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = status ? { status: status as (typeof STATUSES)[number] } : {};

  const [messages, total, newCount, subscribers, subscriberCount, activeCount] =
    await Promise.all([
      tab === "messages"
        ? db.contactMessage.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip: (page - 1) * PAGE_SIZE,
            take: PAGE_SIZE,
          })
        : Promise.resolve([]),
      tab === "messages" ? db.contactMessage.count({ where }) : Promise.resolve(0),
      db.contactMessage.count({ where: { status: "NEW" } }),
      tab === "newsletter"
        ? db.newsletterSubscriber.findMany({ orderBy: { createdAt: "desc" } })
        : Promise.resolve([]),
      tab === "newsletter"
        ? db.newsletterSubscriber.count()
        : Promise.resolve(0),
      tab === "newsletter"
        ? db.newsletterSubscriber.count({ where: { isActive: true } })
        : Promise.resolve(0),
    ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AdminPageHeader
        eyebrow="Relation client"
        title="Messages"
        description="Demandes reçues via le formulaire de contact et inscriptions à la lettre d'information. Aucun e-mail n'est envoyé automatiquement depuis cette page."
        actions={
          <span className="badge">
            {newCount} nouveau{newCount > 1 ? "x" : ""} message{newCount > 1 ? "s" : ""}
          </span>
        }
      />

      <nav
        aria-label="Sections des messages"
        className="mb-4 flex flex-wrap gap-1 border-b border-outline-variant"
      >
        {[
          { id: "messages" as Tab, label: "Formulaire de contact", icon: "mail" as const },
          { id: "newsletter" as Tab, label: "Lettre d'information", icon: "users" as const },
        ].map((entry) => {
          const active = entry.id === tab;
          return (
            <Link
              key={entry.id}
              href={`/admin/messages?onglet=${entry.id}`}
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

      {tab === "messages" ? (
        <>
          <form
            method="get"
            className="mb-4 flex flex-wrap items-end gap-2 border border-outline-variant bg-white p-3"
          >
            <input type="hidden" name="onglet" value="messages" />
            <div className="sm:w-52">
              <label htmlFor="message-status" className="field-label">
                État du message
              </label>
              <select
                id="message-status"
                name="statut"
                defaultValue={status}
                className="admin-input"
              >
                <option value="">Tous</option>
                <option value="NEW">Nouveaux</option>
                <option value="IN_PROGRESS">En cours</option>
                <option value="CLOSED">Traités</option>
              </select>
            </div>
            <button type="submit" className="btn-primary btn-sm">
              Filtrer
            </button>
            {status && (
              <Link href="/admin/messages" className="btn-quiet btn-sm">
                Réinitialiser
              </Link>
            )}
          </form>

          {messages.length === 0 ? (
            <AdminEmpty
              title="Aucun message"
              description="Les demandes envoyées depuis la page contact apparaîtront ici."
            />
          ) : (
            <div className="space-y-3">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className="border border-outline-variant bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-outline-variant px-4 py-3">
                    <div>
                      <p className="font-medium text-primary">
                        {message.subject}
                      </p>
                      <p className="mt-0.5 text-[0.7rem] text-on-surface-variant">
                        {message.name} ·{" "}
                        <a
                          href={`mailto:${message.email}`}
                          className="text-primary underline underline-offset-2 hover:no-underline"
                        >
                          {message.email}
                        </a>
                        {message.phone ? ` · ${message.phone}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[0.66rem] text-outline">
                        {formatDateTimeFr(message.createdAt)}
                      </span>
                      <span
                        className={
                          message.status === "CLOSED"
                            ? "badge-success"
                            : message.status === "NEW"
                              ? "badge-error"
                              : "badge"
                        }
                      >
                        {STATUS_LABELS[message.status] ?? message.status}
                      </span>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <p className="whitespace-pre-line text-[0.8rem] leading-relaxed text-on-surface-variant">
                      {message.message}
                    </p>
                    <form
                      action={updateContactStatusAction}
                      className="mt-3 flex flex-wrap items-end gap-2 border-t border-outline-variant pt-3"
                    >
                      <input type="hidden" name="id" value={message.id} />
                      <div className="w-44">
                        <label
                          htmlFor={`status-${message.id}`}
                          className="field-label"
                        >
                          Traitement
                        </label>
                        <select
                          id={`status-${message.id}`}
                          name="status"
                          defaultValue={message.status}
                          className="admin-input"
                        >
                          <option value="NEW">Nouveau</option>
                          <option value="IN_PROGRESS">En cours</option>
                          <option value="CLOSED">Traité</option>
                        </select>
                      </div>
                      <button type="submit" className="btn-outline btn-sm">
                        Mettre à jour
                      </button>
                      <a
                        href={`mailto:${message.email}?subject=${encodeURIComponent(
                          `Re: ${message.subject}`,
                        )}`}
                        className="btn-quiet btn-sm"
                      >
                        Répondre par e-mail
                      </a>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}

          <Pagination
            page={page}
            pages={pages}
            baseHref="/admin/messages"
            params={{ onglet: "messages", statut: status }}
          />
        </>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3 border border-outline-variant bg-surface-dim px-4 py-3 text-[0.75rem] text-on-surface-variant">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="users" size={13} className="text-secondary" />
              {subscriberCount} inscription(s)
            </span>
            <span className="text-outline">·</span>
            <span>{activeCount} active(s)</span>
            <span className="text-outline">·</span>
            <span>
              Les inscriptions proviennent du formulaire du pied de page. Aucun
              envoi de campagne n&apos;est configuré.
            </span>
          </div>

          {subscribers.length === 0 ? (
            <AdminEmpty
              title="Aucun abonné"
              description="Les inscriptions à la lettre d'information apparaîtront ici."
            />
          ) : (
            <div className="overflow-x-auto border border-outline-variant bg-white">
              <table className="table-admin">
                <thead>
                  <tr>
                    <th>Adresse e-mail</th>
                    <th>Inscription</th>
                    <th>État</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber) => (
                    <tr key={subscriber.id}>
                      <td className="text-[0.78rem] text-primary">
                        {subscriber.email}
                      </td>
                      <td className="whitespace-nowrap text-[0.7rem] text-on-surface-variant">
                        {formatDateTimeFr(subscriber.createdAt)}
                      </td>
                      <td>
                        <span className={subscriber.isActive ? "badge-success" : "badge"}>
                          {subscriber.isActive ? "Active" : "Désinscrite"}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-3">
                          <form action={toggleNewsletterSubscriberAction}>
                            <input type="hidden" name="id" value={subscriber.id} />
                            <button
                              type="submit"
                              className="text-[0.7rem] text-on-surface-variant underline underline-offset-2 hover:text-primary hover:no-underline"
                            >
                              {subscriber.isActive ? "Désinscrire" : "Réactiver"}
                            </button>
                          </form>
                          <form action={deleteNewsletterSubscriberAction}>
                            <input type="hidden" name="id" value={subscriber.id} />
                            <ConfirmButton
                              label="Supprimer"
                              message={`Supprimer définitivement l'inscription « ${subscriber.email} » ?`}
                            />
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
