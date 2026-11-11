"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";

export type AdminNavItem = {
  href: string;
  label: string;
  icon: IconName;
  badge?: number;
};

export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Navigation administration" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`group flex items-center gap-2.5 border-l-2 px-3 py-2 text-[0.78rem] transition-colors ${
              active
                ? "border-gold bg-white/10 text-white"
                : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon
              name={item.icon}
              size={16}
              className={active ? "text-gold" : "text-white/40 group-hover:text-white/70"}
            />
            <span className="flex-1">{item.label}</span>
            {typeof item.badge === "number" && item.badge > 0 && (
              <span
                className={`min-w-[1.25rem] px-1 text-center text-[0.6rem] leading-5 ${
                  active ? "bg-gold text-primary" : "bg-white/10 text-white/80"
                }`}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
