import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 border-b border-outline-variant pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[0.6rem] uppercase tracking-[0.16em] text-secondary">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 font-serif text-[1.9rem] leading-tight text-primary">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-body-sm leading-relaxed text-on-surface-variant">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: IconName;
  href?: string;
  tone?: "default" | "gold" | "alert";
}) {
  const tones = {
    default: "border-outline-variant bg-white",
    gold: "border-gold/60 bg-gold/10",
    alert: "border-error/30 bg-error-container/40",
  };
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[0.6rem] uppercase tracking-[0.13em] text-on-surface-variant">
          {label}
        </p>
        {icon && (
          <Icon
            name={icon}
            size={16}
            className={tone === "alert" ? "text-error" : "text-secondary"}
          />
        )}
      </div>
      <p className="mt-2 font-serif text-2xl leading-none text-primary">{value}</p>
      {hint && (
        <p className="mt-1.5 text-[0.7rem] leading-snug text-on-surface-variant">
          {hint}
        </p>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`block border p-4 transition-colors hover:border-primary ${tones[tone]}`}
      >
        {body}
      </Link>
    );
  }
  return <div className={`border p-4 ${tones[tone]}`}>{body}</div>;
}

export function AdminEmpty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border border-dashed border-outline-variant bg-white px-6 py-10 text-center">
      <Icon name="file" size={24} className="mx-auto text-outline" />
      <p className="mt-2 font-serif text-lg text-primary">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-[0.78rem] leading-relaxed text-on-surface-variant">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function AdminNotice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "warning" | "success";
}) {
  const tones = {
    info: "border-outline-variant bg-surface-dim text-on-surface-variant",
    warning: "border-gold/60 bg-gold/10 text-on-surface-variant",
    success: "border-success/30 bg-success/10 text-success",
  };
  return (
    <div className={`border px-4 py-3 text-[0.78rem] leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  baseHref,
  params = {},
}: {
  page: number;
  pages: number;
  baseHref: string;
  params?: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;

  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    if (target > 1) search.set("page", String(target));
    const query = search.toString();
    return query ? `${baseHref}?${query}` : baseHref;
  };

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between border-t border-outline-variant pt-3 text-[0.75rem]"
    >
      <span className="text-on-surface-variant">
        Page {page} sur {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 && (
          <Link href={hrefFor(page - 1)} className="btn-quiet btn-sm">
            Précédent
          </Link>
        )}
        {page < pages && (
          <Link href={hrefFor(page + 1)} className="btn-quiet btn-sm">
            Suivant
          </Link>
        )}
      </div>
    </nav>
  );
}

export function Th({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={className}>{children}</th>;
}
