"use server";

import { getAnonClient } from "@/lib/habita/supabase-anon";

export type ValuationInput = {
  agencyId: string;
  propertyType: string;
  city: string;
  area?: string;
  sqm?: number;
  rooms?: number;
  bathrooms?: number;
  floor?: number;
  condition?: string;
  fullName: string;
  phone: string;
  email?: string;
};

export type ValuationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitValuation(
  input: ValuationInput
): Promise<ValuationResult> {
  if (!input.fullName?.trim() || input.fullName.trim().length < 2)
    return { ok: false, error: "Inserisci il tuo nome." };
  if (!input.phone?.trim())
    return { ok: false, error: "Inserisci il tuo numero di telefono." };
  if (!input.city?.trim())
    return { ok: false, error: "Inserisci la città." };

  const supabase = getAnonClient();

  // Verify agency exists and is public
  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("id", input.agencyId)
    .eq("is_public", true)
    .maybeSingle();

  if (!agency) return { ok: false, error: "Agenzia non disponibile." };

  // Create lead in CRM pipeline
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      agency_id: input.agencyId,
      full_name: input.fullName.trim(),
      phone: input.phone.trim() || null,
      email: input.email?.trim() || null,
      status: "new",
      temperature: "warm", // seller leads are warm by default
      source: "valuation",
      source_detail: "valuta-casa",
      notes: [
        `Richiesta valutazione immobile`,
        `Tipo: ${input.propertyType}`,
        `Città: ${input.city}`,
        input.area ? `Zona: ${input.area}` : null,
        input.sqm ? `Superficie: ${input.sqm} m²` : null,
        input.rooms ? `Camere: ${input.rooms}` : null,
        input.bathrooms ? `Bagni: ${input.bathrooms}` : null,
        input.floor !== undefined ? `Piano: ${input.floor}` : null,
        input.condition ? `Condizioni: ${input.condition}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
    })
    .select("id")
    .single();

  if (leadError) {
    console.error("[submit-valuation] lead error:", leadError);
    return { ok: false, error: "Errore nell'invio. Riprova." };
  }

  // Save full valuation request with property details
  const { error: valError } = await supabase
    .from("valuation_requests")
    .insert({
      agency_id: input.agencyId,
      lead_id: lead.id,
      property_type: input.propertyType,
      city: input.city.trim(),
      area: input.area?.trim() || null,
      sqm: input.sqm || null,
      rooms: input.rooms || null,
      bathrooms: input.bathrooms || null,
      floor: input.floor ?? null,
      condition: input.condition || null,
      full_name: input.fullName.trim(),
      phone: input.phone.trim(),
      email: input.email?.trim() || null,
      status: "new",
    });

  if (valError) {
    console.error("[submit-valuation] valuation error:", valError);
    // Lead already created — not a blocking error
  }

  return { ok: true };
}
