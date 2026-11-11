import Link from "next/link";
import { formatDH } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  cents,
  compareAt,
  className,
  size = "md",
}: {
  cents: number;
  compareAt?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  };
  return (
    <span className={cn("inline-flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("font-sans font-semibold text-primary", sizes[size])}>
        {formatDH(cents)}
      </span>
      {compareAt && compareAt > cents ? (
        <span className="text-body-sm text-outline line-through">
          {formatDH(compareAt)}
        </span>
      ) : null}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-outline-variant pb-5 md:flex-row md:items-end md:justify-between",
        align === "center" && "md:flex-col md:items-center md:text-center",
        className,
      )}
    >
      <div className={align === "center" ? "mx-auto max-w-2xl" : ""}>
        {eyebrow && <p className="eyebrow mb-2 block">{eyebrow}</p>}
        <h2 className="font-serif text-[1.8rem] leading-tight text-primary md:text-[2.2rem]">
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-xl text-body-sm leading-relaxed text-on-surface-variant">
            {description}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group inline-flex shrink-0 items-center gap-2 text-label uppercase tracking-[0.14em] text-primary hover:text-secondary"
        >
          {action.label}
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </Link>
      )}
    </div>
  );
}
