import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Logo } from "@/components/site/Logo";
import { MobileMenu } from "@/components/site/MobileMenu";
import { getCartView } from "@/lib/cart";
import { getWishlistProductIds } from "@/lib/wishlist";
import { NAV_LINKS } from "@/lib/constants";
import { getSettings } from "@/lib/settings";
import { googleMapsAddressHref } from "@/lib/maps";
import {
  WHATSAPP_MESSAGES,
  whatsappDisplay,
  whatsappHref,
} from "@/lib/whatsapp";

export async function SiteHeader() {
  const [cart, wishlist, settings] = await Promise.all([
    getCartView(),
    getWishlistProductIds(),
    getSettings(),
  ]);

  return (
    <>
      {settings["home.announcement_visible"] !== "false" && <div className="bg-primary text-white">
        <div className="canvas flex min-h-[34px] items-center justify-center gap-2 py-2 text-center text-[0.625rem] uppercase tracking-[0.14em]">
          <span className="hidden h-1.5 w-1.5 rounded-full bg-gold sm:inline-block" />
          <span>
            {settings["site.announcement"]}
          </span>
          <span className="hidden h-1.5 w-1.5 rounded-full bg-gold sm:inline-block" />
        </div>
      </div>}

      <header className="sticky top-0 z-50 border-b border-outline-variant/70 bg-white">
        <div className="canvas flex h-[72px] items-center justify-between gap-4 lg:h-20 lg:gap-8">
          <div className="flex items-center gap-2">
            <MobileMenu
              cartCount={cart.itemCount}
              wishlistCount={wishlist.size}
              logoUrl={settings["store.logo_url"]}
              brandName={settings["store.name"]}
            />
            <Logo compact logoUrl={settings["store.logo_url"]} brandName={settings["store.name"]} className="lg:hidden" />
            <Logo logoUrl={settings["store.logo_url"]} brandName={settings["store.name"]} className="hidden lg:flex" />
          </div>

          <div className="mx-2 hidden max-w-xl flex-1 md:block">
            <form action="/catalogue" method="get" role="search" className="relative">
              <label htmlFor="header-search" className="sr-only">
                Rechercher une monture, une forme, une marque
              </label>
              <input
                id="header-search"
                name="q"
                type="search"
                placeholder="Rechercher une monture, une forme, une marque…"
                className="field bg-surface-dim py-2.5 pl-10 pr-4 text-body-sm"
              />
              <Icon
                name="search"
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              />
            </form>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4 lg:gap-5">
            <a
              href={whatsappHref(
                settings["store.whatsapp"],
                WHATSAPP_MESSAGES.general,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center gap-2 px-1 text-primary transition-colors hover:text-secondary"
              aria-label="Contacter sur WhatsApp"
            >
              <Icon name="whatsapp" size={20} />
              <span className="hidden text-label uppercase tracking-[0.1em] xl:inline">
                WhatsApp
              </span>
            </a>

            <Link
              href="/favoris"
              className="group flex min-h-11 items-center gap-2 px-1 text-primary transition-colors hover:text-secondary"
              aria-label={`Favoris (${wishlist.size})`}
            >
              <span className="relative">
                <Icon name="heart" size={21} />
                {wishlist.size > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-secondary px-1 text-[0.6rem] font-bold leading-none text-white">
                    {wishlist.size}
                  </span>
                )}
              </span>
              <span className="hidden text-label uppercase tracking-[0.1em] xl:inline">
                Favoris
              </span>
            </Link>

            <Link
              href="/panier"
              className="flex min-h-11 items-center gap-2 border border-outline-variant bg-surface-dim px-3 py-2 text-primary transition-colors hover:border-primary"
              aria-label={`Panier, ${cart.itemCount} article(s)`}
            >
              <Icon name="bag" size={19} />
              <span className="text-[0.625rem] uppercase tracking-[0.1em] sm:hidden">
                {cart.itemCount}
              </span>
              <span className="hidden text-label uppercase tracking-[0.1em] sm:inline">
                Panier ({cart.itemCount})
              </span>
            </Link>
          </div>
        </div>

        <div className="border-t border-outline-variant/60 md:hidden">
          <form action="/catalogue" method="get" role="search" className="canvas py-2">
            <label htmlFor="header-search-mobile" className="sr-only">
              Rechercher une monture
            </label>
            <div className="relative">
              <input
                id="header-search-mobile"
                name="q"
                type="search"
                placeholder="Rechercher une monture…"
                className="field bg-surface-dim py-2 pl-9 text-body-sm"
              />
              <Icon
                name="search"
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
              />
            </div>
          </form>
        </div>

        <nav aria-label="Navigation principale" className="hidden border-t border-outline-variant/60 md:block">
          <ul className="canvas no-scrollbar flex h-12 items-center justify-center gap-7 overflow-x-auto lg:gap-11">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block whitespace-nowrap py-3 text-[0.7rem] uppercase tracking-[0.16em] text-on-surface transition-colors hover:text-secondary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/boutiques"
                className="block whitespace-nowrap py-3 text-[0.7rem] uppercase tracking-[0.16em] text-on-surface transition-colors hover:text-secondary"
              >
                Notre adresse
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="block whitespace-nowrap py-3 text-[0.7rem] uppercase tracking-[0.16em] text-on-surface transition-colors hover:text-secondary"
              >
                Contact
              </Link>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
}

export async function SiteFooter() {
  const settings = await getSettings();
  const whatsapp = whatsappDisplay(settings["store.whatsapp"]);
  const email = settings["store.email"] ?? "";

  return (
    <footer className="border-t border-outline-variant bg-white">
      <div className="canvas grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-12 lg:pb-12">
        <div className="lg:col-span-4">
          <Logo logoUrl={settings["store.logo_url"]} brandName={settings["store.name"]} />
          <p className="mt-5 max-w-sm text-body-sm leading-relaxed text-on-surface-variant">
            {settings["site.footer_text"]}
          </p>
          <div className="mt-5 flex items-center gap-2">
            {[
              { label: "Instagram", key: "social.instagram", icon: "sparkle" as const },
              { label: "Facebook", key: "social.facebook", icon: "store" as const },
              { label: "Pinterest", key: "social.pinterest", icon: "pin" as const },
              { label: "LinkedIn", key: "social.linkedin", icon: "external" as const },
            ].filter((social) => settings[social.key]).map((social) => (
              <a
                key={social.label}
                href={settings[social.key]}
                aria-label={social.label}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center border border-outline-variant text-primary transition-colors hover:border-primary hover:text-secondary"
              >
                <Icon name={social.icon} size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          <h2 className="mb-4 text-label uppercase tracking-[0.14em] text-primary">
            Adresse &amp; contact
          </h2>
          <ul className="space-y-2.5 text-body-sm text-on-surface-variant">
            {settings["store.address"] && <li><a href={googleMapsAddressHref(settings["store.address"], settings["store.city"])} target="_blank" rel="noopener noreferrer" className="link-underline">{settings["store.address"]}</a></li>}
            {settings["store.hours"] && <li>{settings["store.hours"]}</li>}
            {whatsapp && <li>
              WhatsApp :{" "}
              <a
                href={whatsappHref(
                  settings["store.whatsapp"],
                  WHATSAPP_MESSAGES.general,
                )}
                className="link-underline"
                rel="noopener noreferrer"
                target="_blank"
                aria-label="Contacter sur WhatsApp"
              >
                {whatsapp}
              </a>
            </li>}
            {email && <li>
              E-mail :{" "}
              <a href={`mailto:${email}`} className="link-underline">
                {email}
              </a>
            </li>}
            <li className="pt-2">
              <Link href="/boutiques" className="font-medium text-secondary hover:underline">
                Voir l&apos;adresse et l&apos;itinéraire →
              </Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h2 className="mb-4 text-label uppercase tracking-[0.14em] text-primary">
            Garanties &amp; engagements
          </h2>
          <ul className="space-y-2.5 text-body-sm text-on-surface-variant">
            <li><Link href="/livraison" className="transition-colors hover:text-primary">Livraison &amp; retours</Link></li>
            <li><Link href="/retours" className="transition-colors hover:text-primary">Conditions de garantie</Link></li>
            <li><Link href="/faq" className="transition-colors hover:text-primary">Questions sur les remboursements</Link></li>
            <li><Link href="/mentions-legales" className="transition-colors hover:text-primary">Informations légales &amp; CGV</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-2">
          <h2 className="mb-4 text-label uppercase tracking-[0.14em] text-primary">
            Collections
          </h2>
          <ul className="space-y-2.5 text-body-sm text-on-surface-variant">
            <li><Link href="/catalogue/femme" className="transition-colors hover:text-primary">Femme</Link></li>
            <li><Link href="/catalogue/homme" className="transition-colors hover:text-primary">Homme</Link></li>
            <li><Link href="/catalogue/solaires" className="transition-colors hover:text-primary">Solaires</Link></li>
            <li><Link href="/catalogue" className="transition-colors hover:text-primary">Verres &amp; devis</Link></li>
            <li><Link href="/catalogue/lentilles" className="transition-colors hover:text-primary">Lentilles</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-outline-variant">
        <div className="canvas flex flex-col items-center justify-between gap-4 py-6 text-[0.75rem] text-on-surface-variant md:flex-row">
          <p>
            © {new Date().getFullYear()} {settings["store.name"]}. Tous droits réservés.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {["Paiement à la livraison"].map((label) => (
              <span
                key={label}
                className="border border-outline-variant bg-surface px-2 py-1 text-[0.65rem] uppercase tracking-wider"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
