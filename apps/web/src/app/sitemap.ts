import type { MetadataRoute } from "next";
import { getAnonClient } from "@/lib/habita/supabase-anon";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.habiquo.it";

  // Pagine statiche
  const staticPages: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/registrazione`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/richiedi-demo`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cookie`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  // Pagine pubbliche agenzie (Habita)
  let agencyPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = getAnonClient();
    const { data: agencies } = await supabase
      .from("agencies")
      .select("id, slug, updated_at")
      .not("slug", "is", null);

    if (agencies) {
      for (const agency of agencies) {
        agencyPages.push({
          url: `${base}/${agency.slug}`,
          lastModified: agency.updated_at ? new Date(agency.updated_at) : new Date(),
          changeFrequency: "weekly",
          priority: 0.9,
        });

        // Immobili pubblici e attivi dell'agenzia
        const { data: properties } = await supabase
          .from("properties")
          .select("slug, updated_at")
          .eq("agency_id", agency.id)
          .eq("status", "active")
          .eq("is_public", true)
          .not("slug", "is", null);

        if (properties) {
          for (const property of properties) {
            agencyPages.push({
              url: `${base}/${agency.slug}/immobili/${property.slug}`,
              lastModified: property.updated_at ? new Date(property.updated_at) : new Date(),
              changeFrequency: "weekly",
              priority: 0.8,
            });
          }
        }
      }
    }
  } catch (e) {
    console.error("[sitemap] error fetching agencies:", e);
  }

  return [...staticPages, ...agencyPages];
}
