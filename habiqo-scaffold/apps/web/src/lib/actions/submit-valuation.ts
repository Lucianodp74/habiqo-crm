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

  const { error } = await supabase.rpc("submit_valuation_request", {
    p_agency_id:     input.agencyId,
    p_property_type: input.propertyType,
    p_city:          input.city.trim(),
    p_area:          input.area?.trim() || null,
    p_sqm:           input.sqm || null,
    p_rooms:         input.rooms || null,
    p_bathrooms:     input.bathrooms || null,
    p_floor:         input.floor ?? null,
    p_condition:     input.condition || null,
    p_full_name:     input.fullName.trim(),
    p_phone:         input.phone.trim(),
    p_email:         input.email?.trim() || null,
  });

  if (error) {
    console.error("[submit-valuation] RPC error:", error);
    return { ok: false, error: "Errore nell'invio. Riprova." };
  }

  return { ok: true };
}
