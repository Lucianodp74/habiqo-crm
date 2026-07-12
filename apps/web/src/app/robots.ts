import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/crm",
        "/deals",
        "/properties",
        "/analytics",
        "/ai-assistant",
        "/renovation-test",
        "/dashboard",
        "/onboarding",
        "/accept-invite",
        "/recupero-password",
        "/register",
        "/registrazione",
        "/login",
        "/api",
      ],
    },
    sitemap: "https://www.habiquo.it/sitemap.xml",
  };
}
