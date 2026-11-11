import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/compte",
          "/panier",
          "/commande",
          "/favoris",
          "/connexion",
          "/inscription",
          "/mot-de-passe-oublie",
          "/reinitialiser-mot-de-passe",
        ],
      },
    ],
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
    host: new URL(SITE.url).host,
  };
}
