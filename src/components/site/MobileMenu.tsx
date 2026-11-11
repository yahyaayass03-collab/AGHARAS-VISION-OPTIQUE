"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { NAV_LINKS } from "@/lib/constants";
import { Logo } from "@/components/site/Logo";

export function MobileMenu({
  cartCount,
  wishlistCount,
  logoUrl,
  brandName,
}: {
  cartCount: number;
  wishlistCount: number;
  logoUrl?: string;
  brandName?: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", onKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 w-11 items-center justify-center text-primary lg:hidden"
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        aria-controls="menu-mobile"
      >
        <Icon name="menu" size={24} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] bg-primary/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        id="menu-mobile"
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        className={`fixed inset-y-0 left-0 z-[90] w-[86%] max-w-sm flex-col overflow-y-auto border-r border-outline-variant bg-white transition-transform duration-300 lg:hidden ${
          open ? "flex translate-x-0" : "hidden -translate-x-full"
        }`}
        hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
          <Logo compact logoUrl={logoUrl} brandName={brandName} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-11 w-11 items-center justify-center"
            aria-label="Fermer le menu"
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        <form action="/catalogue" method="get" role="search" className="border-b border-outline-variant p-5">
          <label htmlFor="mobile-search" className="sr-only">
            Rechercher une monture
          </label>
          <div className="relative">
            <input
              id="mobile-search"
              name="q"
              type="search"
              placeholder="Rechercher une monture…"
              className="field pr-10"
            />
            <button
              type="submit"
              className="absolute right-0 top-0 flex h-full w-10 items-center justify-center text-primary"
              aria-label="Lancer la recherche"
            >
              <Icon name="search" size={18} />
            </button>
          </div>
        </form>

        <nav aria-label="Collections" className="px-5 py-4">
          <p className="eyebrow mb-3">Collections</p>
          <ul className="space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block border-b border-outline-variant/60 py-3 font-serif text-lg text-primary"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="/boutiques"
                className="block border-b border-outline-variant/60 py-3 font-serif text-lg text-primary"
              >
                Notre adresse
              </a>
            </li>
            <li>
              <a
                href="/contact"
                className="block border-b border-outline-variant/60 py-3 font-serif text-lg text-primary"
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>

        <div className="mt-auto grid grid-cols-3 border-t border-outline-variant text-center text-label">
          <a href="/favoris" className="border-r border-outline-variant py-4">
            Favoris ({wishlistCount})
          </a>
          <a href="/boutiques" className="border-r border-outline-variant py-4">
            Adresse
          </a>
          <a href="/panier" className="py-4">
            Panier ({cartCount})
          </a>
        </div>
      </div>
    </>
  );
}
