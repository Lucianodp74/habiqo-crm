/**
 * GET /feed/[agency_slug]/immobiliare.xml
 *
 * Public XML feed for Immobiliare.it.
 * The agency configures this URL once in their Immobiliare.it account
 * settings. From that point on, every property published on Habiquo
 * is automatically synced to the portal.
 *
 * Security: only returns is_public=true, status=active properties.
 * No auth required — feed is intentionally public.
 */

import { generateImmobiliareXml } from "@/lib/xml/immobiliare";
import type { NormalizedAgency, NormalizedProperty } from "@/lib/xml/types";
import { getAnonClient } from "@/lib/habita/supabase-anon";
import { NextResponse } from "next/server";

type Params = Promise<{ agency_slug: string }>;

export async function GET(_req: Request, { params }: { params: Params }) {
  const { agency_slug } = await params;

  const supabase = getAnonClient();

  // 1. Resolve agency
  const { data: agencyData, error: agencyError } = await supabase
    .from("agencies")
    .select("id, slug, name, phone, city, region, is_public")
    .eq("slug", agency_slug)
    .eq("is_public", true)
    .maybeSingle();

  if (agencyError || !agencyData) {
    return new NextResponse("Agenzia non trovata", { status: 404 });
  }

  const agency: NormalizedAgency = {
    id: agencyData.id,
    slug: agencyData.slug,
    name: agencyData.name,
    email: null, // agencies table may not have email yet
    phone: agencyData.phone,
    city: agencyData.city,
    region: agencyData.region,
  };

  // 2. Fetch active public properties
  const { data: propertiesData, error: propertiesError } = await supabase
    .from("properties")
    .select(
      `id, title, description, listing_type, property_type,
       price_eur, surface_sqm, bedrooms, bathrooms,
       address, city, postal_code, region, floor,
       has_elevator, has_garage, energy_class,
       photos, slug, created_at, updated_at`
    )
    .eq("agency_id", agencyData.id)
    .eq("status", "active")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (propertiesError) {
    console.error("[feed/immobiliare]", propertiesError);
    return new NextResponse("Errore interno", { status: 500 });
  }

  const properties: NormalizedProperty[] = (propertiesData ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    listingType: p.listing_type,
    propertyType: p.property_type,
    price: p.price_eur,
    surfaceSqm: p.surface_sqm,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    address: p.address,
    city: p.city,
    postalCode: p.postal_code,
    region: p.region,
    floor: p.floor,
    hasElevator: p.has_elevator ?? false,
    hasGarage: p.has_garage ?? false,
    energyClass: p.energy_class,
    photos: p.photos ?? [],
    slug: p.slug ?? p.id,
    createdAt: p.created_at,
    updatedAt: p.updated_at ?? p.created_at,
  }));

  const xml = generateImmobiliareXml(properties, agency);

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600", // cache 1 ora
    },
  });
}
