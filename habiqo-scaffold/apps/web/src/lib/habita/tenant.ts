/**
 * Habita · tenant resolution for /[agencySlug] routes.
 *
 * Resolves a public agency from its slug. Returns null if the agency
 * doesn't exist or has `is_public = false`. The result is memoized
 * per-request via `React.cache` so the same lookup inside layout +
 * page in one render does only one DB call.
 *
 * Snake_case from the database is mapped to camelCase here so the
 * rest of the Habita code stays clean of DB naming conventions.
 */
import { cache } from "react";
import { getAnonClient } from "./supabase-anon";

export type PublicAgency = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logoPath: string | null;
  coverImagePath: string | null;
  city: string | null;
  region: string | null;
  phone: string | null;
};

export const getAgencyBySlug = cache(
  async (slug: string): Promise<PublicAgency | null> => {
    // Defensive: bail on obviously-invalid input before touching the DB.
    if (!slug || slug.length > 60) return null;

    const supabase = getAnonClient();

    const { data, error } = await supabase
      .from("agencies")
      .select(
        "id, slug, name, tagline, description, logo_path, cover_image_path, city, region, phone"
      )
      .eq("slug", slug)
      .eq("is_public", true)
      .maybeSingle();

    if (error) {
      console.error("[habita/tenant] getAgencyBySlug error:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      slug: data.slug,
      name: data.name,
      tagline: data.tagline,
      description: data.description,
      logoPath: data.logo_path,
      coverImagePath: data.cover_image_path,
      city: data.city,
      region: data.region,
      phone: data.phone,
    };
  }
);
