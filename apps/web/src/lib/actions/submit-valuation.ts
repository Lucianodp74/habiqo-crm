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
  notes?: string;
  /** Il visitatore ha spuntato il consenso a ricevere comunicazioni marketing. */
  consentMarketing?: boolean;
  /** Il visitatore ha accettato l'informativa privacy (obbligatorio). */
  consentPrivacy: boolean;
};

export type ValuationResult = { ok: true } | { ok: false; error: string };

const RPC_ERRORS: Record<string, string> = {
  ERR_VALIDATION_NAME: "Inserisci il tuo nome.",
  ERR_VALIDATION_PHONE: "Inserisci un numero di telefono valido.",
  ERR_VALIDATION_CITY: "Inserisci la città.",
  ERR_VALIDATION_NOTES: "Il messaggio è troppo lungo.",
  ERR_VALIDATION_PROPERTY_TYPE: "Seleziona il tipo di immobile.",
  ERR_AGENCY_NOT_FOUND: "Agenzia non trovata.",
};

export async function submitValuation(input: ValuationInput): Promise<ValuationResult> {
  if (!input.fullName?.trim() || input.fullName.trim().length < 2)
    return { ok: false, error: "Inserisci il tuo nome." };
  if (!input.phone?.trim()) return { ok: false, error: "Inserisci il tuo numero di telefono." };
  if (!input.city?.trim()) return { ok: false, error: "Inserisci la città." };
  if (!input.consentPrivacy)
    return { ok: false, error: "Per inviare la richiesta devi accettare l'informativa privacy." };

  const supabase = getAnonClient();

  const { error } = await supabase.rpc("submit_seller_inquiry", {
    p_agency_id: input.agencyId,
    p_property_type: input.propertyType,
    p_city: input.city.trim(),
    p_full_name: input.fullName.trim(),
    p_phone: input.phone.trim(),
    p_email: input.email?.trim() || null,
    p_area: input.area?.trim() || null,
    p_sqm: input.sqm || null,
    p_rooms: input.rooms || null,
    p_bathrooms: input.bathrooms || null,
    p_floor: input.floor ?? null,
    p_condition: input.condition || null,
    p_notes: input.notes?.trim() || null,
    p_consent_marketing: input.consentMarketing ?? false,
  });

  if (error) {
    console.error("[submit-valuation] RPC error:", error);
    const known = Object.entries(RPC_ERRORS).find(([code]) => error.message?.includes(code));
    return { ok: false, error: known?.[1] ?? "Errore nell'invio. Riprova." };
  }

  return { ok: true };
}
