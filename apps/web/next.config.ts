import type { NextConfig } from "next";
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    typedRoutes: true,
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  transpilePackages: [
    "@habiquo/ai",
    "@habiquo/auth",
    "@habiquo/database",
    "@habiquo/types",
    "@habiquo/ui",
    "@habiquo/utils",
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      // Supabase Storage
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      // Property listings hero photos (placeholder; replace with your CDN)
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // Card digitale Habitami (biglietto da visita QR): sito statico separato,
  // pubblicato come progetto Vercel indipendente. Questo rewrite lo espone
  // su habiquo.it/habitami senza toccare nessun'altra route del CRM.
  async rewrites() {
    return [
      {
        source: "/habitami",
        destination: "https://habitamicard.vercel.app/",
      },
      {
        source: "/habitami/:path*",
        destination: "https://habitamicard.vercel.app/:path*",
      },
    ];
  },
};
export default config;
