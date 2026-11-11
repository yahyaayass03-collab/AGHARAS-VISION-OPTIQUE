import type { NextConfig } from "next";
import { validatePublicSiteOrigin } from "./src/lib/runtime-config";

if (process.env.APP_ENVIRONMENT === "staging" || process.env.APP_ENVIRONMENT === "production") {
  const errors = validatePublicSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL);
  if (errors.length) throw new Error(`Build origin configuration invalid: ${errors.join(" ")}`);
}

const nextConfig: NextConfig = {
  // Permit isolated local dev/production artifacts for reliable profiling.
  // The default remains Next.js' standard `.next` directory.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    // Keep build workers bounded for Hostinger Business' shared process budget.
    cpus: 1,
    serverActions: {
      bodySizeLimit: "42mb",
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 768, 1024, 1280, 1440, 1920],
  },
  async redirects() {
    return [
      // Les comptes clients ne font plus partie du parcours public.
      { source: "/inscription", destination: "/", permanent: false },
      { source: "/compte", destination: "/", permanent: false },
      { source: "/compte/:path*", destination: "/", permanent: false },
      { source: "/mot-de-passe-oublie", destination: "/connexion", permanent: false },
      {
        source: "/reinitialiser-mot-de-passe/:path*",
        destination: "/connexion",
        permanent: false,
      },
      // Point d'entrée pratique pour le propriétaire.
      {
        source: "/admin/connexion",
        destination: "/connexion?suivant=%2Fadmin",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...(process.env.APP_ENVIRONMENT === "staging"
            ? [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }]
            : []),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
