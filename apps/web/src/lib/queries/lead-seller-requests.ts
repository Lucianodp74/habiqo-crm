import { createClient } from "@/lib/supabase/server";

export type LeadSellerRequest = {
  id: string;
  propertyType: string;
  city: string;
  area: string | null;
  sqm: number | null;
  rooms: number | null;
  bathrooms: number | null;
  floor: number | null;
  condition: string | null;
  notes: string | null;
  consentMarketing: boolean;
  createdAt: string;
};

/**
 * Richieste di vendita/valutazione arrivate dal sito pubblico e
 * collegate a questo lead (tabella valuation_requests). RLS limita la
 * lettura ai membri dell'agenzia.
 */
export async function listSellerRequestsForLead(leadId: string): Promise<LeadSellerRequest[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("valuation_requests")
    .select(
      "id, property_type, city, area, sqm, rooms, bathrooms, floor, condition, notes, consent_marketing, created_at",
    )
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listSellerRequestsForLead:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    propertyType: r.property_type,
    city: r.city,
    area: r.area,
    sqm: r.sqm,
    rooms: r.rooms,
    bathrooms: r.bathrooms,
    floor: r.floor,
    condition: r.condition,
    notes: r.notes,
    consentMarketing: Boolean((r as { consent_marketing?: boolean }).consent_marketing),
    createdAt: r.created_at,
  }));
}
