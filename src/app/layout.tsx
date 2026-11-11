import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { SITE } from "@/lib/constants";
import { getSettings } from "@/lib/settings";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-bodoni",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hanken",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const name = settings["store.name"] || SITE.name;
  const title = settings["seo.default_title"] || `${name} | Optique au Maroc`;
  const description = settings["seo.default_description"] || SITE.description;
  const logo = settings["store.logo_url"] || "/images/brand/agharass-vision-logo-header.webp";
  return {
    metadataBase: new URL(SITE.url),
    title: { default: title, template: `%s | ${name}` },
    description,
    applicationName: name,
    keywords: ["lunettes de vue Maroc", "optique Agadir", "montures", "verres correcteurs", "lunettes de soleil"],
    openGraph: {
      type: "website",
      locale: "fr_MA",
      siteName: name,
      title,
      description,
      images: [{ url: logo, alt: `Logo ${name}` }],
    },
    twitter: { card: "summary", title, description, images: [logo] },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    formatDetection: { telephone: true, email: true },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#182c2d",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${bodoni.variable} ${hanken.variable}`}>
      <body>
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-primary focus:px-4 focus:py-2 focus:text-white"
        >
          Aller au contenu principal
        </a>
        {children}
      </body>
    </html>
  );
}
