"use server";

import { getAnonClient } from "@/lib/habita/supabase-anon";

export type RenovationInput = {
  agencyId: string;
  fullName: string;
  phone: string;
  email?: string;
  interest: string;
  notes?: string;
};

export type RenovationResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitRenovation(
  input: RenovationInput
): Promise<RenovationResult> {
  if (!input.fullName?.trim() || input.fullName.trim().length < 2)
    return { ok: false, error: "Inserisci il tuo nome." };
  if (!input.phone?.trim())
    return { ok: false, error: "Inserisci il tuo numero di telefono." };

  const supabase = getAnonClient();

  const { error } = await supabase.rpc("submit_renovation_lead", {
    p_agency_id: input.agencyId,
    p_full_name: input.fullName.trim(),
    p_phone:     input.phone.trim(),
    p_email:     input.email?.trim() || null,
    p_interest:  input.interest,
    p_notes:     input.notes || null,
  });

  if (error) {
    console.error("[submit-renovation]", error);
    return { ok: false, error: "Errore nell'invio. Riprova." };
  }

  return { ok: true };
}
