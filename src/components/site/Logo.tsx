import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/constants";

export function Logo({
  className,
  compact = false,
  inverted = false,
  logoUrl = "/images/brand/agharass-vision-logo-header.webp",
  brandName = SITE.name,
}: {
  className?: string;
  compact?: boolean;
  inverted?: boolean;
  logoUrl?: string;
  brandName?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("group flex items-center gap-3", className)}
      aria-label={`${brandName} — Accueil`}
    >
      <Image
        src={logoUrl || "/images/brand/agharass-vision-logo-header.webp"}
        alt=""
        aria-hidden="true"
        width={48}
        height={48}
        sizes="48px"
        className="h-10 w-10 shrink-0 object-contain sm:h-11 sm:w-11"
      />
      <span className="flex flex-col">
        <span
          className={cn(
            "font-serif text-[1.05rem] font-semibold leading-none tracking-wider sm:text-[1.15rem]",
            inverted ? "text-white" : "text-primary",
          )}
        >
          {brandName}
        </span>
        {!compact && (
          <span
            className={cn(
              "mt-1 text-[0.6rem] uppercase tracking-[0.25em]",
              inverted ? "text-gold" : "text-secondary",
            )}
          >
            Haute Lunetterie
          </span>
        )}
      </span>
    </Link>
  );
}
