/**
 * Habita · public properties query helpers.
 *
 * Reads public properties via the anon Supabase client.
 * Relies on RLS policy `properties_public_anon_select` to scope
 * results to is_public=true rows of public agencies.
 *
 * Snake_case from the DB is mapped to camelCase here so the
 * rest of the Habita code stays clean of DB naming conventions.
 */
import { cache } from "react";
import { getAnonClient } from "./supabase-anon";

export type ListingType = "sale" | "rent";

export type PublicProperty = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  listingType: ListingType;
  city: string | null;
  region: string | null;
  address: string | null;
  priceEur: number | null;
  rooms: number | null;
  bathrooms: number | null;
  sqm: number | null;
  floor: number | null;
  energyClass: string | null;
  hasElevator: boolean | null;
  hasGarage: boolean | null;
  publishedAt: string | null;
  photos: string[];
};

type PropertyRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  listing_type: string;
  city: string | null;
  region: string | null;
  address: string | null;
  price_eur: number | string | null;
  rooms: number | null;
  bathrooms: number | null;
  sqm: number | null;
  floor: number | null;
  energy_class: string | null;
  has_elevator: boolean | null;
  has_garage: boolean | null;
  published_at: string | null;
  photos: string[] | null;
};

const COLUMNS = [
  "id",
  "slug",
  "title",
  "description",
  "listing_type",
  "city",
  "region",
  "address",
  "price_eur",
  "rooms",
  "bathrooms",
  "sqm",
  "floor",
  "energy_class",
  "has_elevator",
  "has_garage",
  "published_at",
  "photos",
].join(", ");

function mapRow(row: PropertyRow): PublicProperty {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    listingType: (row.listing_type === "rent" ? "rent" : "sale") as ListingType,
    city: row.city,
    region: row.region,
    address: row.address,
    priceEur: row.price_eur != null ? Number(row.price_eur) : null,
    rooms: row.rooms,
    bathrooms: row.bathrooms,
    sqm: row.sqm,
    floor: row.floor,
    energyClass: row.energy_class,
    hasElevator: row.has_elevator,
    hasGarage: row.has_garage,
    publishedAt: row.published_at,
    photos: row.photos ?? [],
  };
}

export const listPublicProperties = cache(
  async (agencyId: string, limit = 50): Promise<PublicProperty[]> => {
    if (!agencyId) return [];

    const supabase = getAnonClient();

    const { data, error } = await supabase
      .from("properties")
      .select(COLUMNS)
      .eq("agency_id", agencyId)
      .eq("is_public", true)
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("[habita/properties] listPublicProperties error:", error);
      return [];
    }

    if (!data) return [];

    return (data as unknown as PropertyRow[]).map(mapRow);
  }
);

export const getPublicPropertyBySlug = cache(
  async (
    agencyId: string,
    propertySlug: string
  ): Promise<PublicProperty | null> => {
    if (!agencyId || !propertySlug || propertySlug.length > 60) return null;

    const supabase = getAnonClient();

    const { data, error } = await supabase
      .from("properties")
      .select(COLUMNS)
      .eq("agency_id", agencyId)
      .eq("slug", propertySlug)
      .eq("is_public", true)
      .maybeSingle();

    if (error) {
      console.error(
        "[habita/properties] getPublicPropertyBySlug error:",
        error
      );
      return null;
    }

    if (!data) return null;

    return mapRow(data as unknown as PropertyRow);
  }
);
