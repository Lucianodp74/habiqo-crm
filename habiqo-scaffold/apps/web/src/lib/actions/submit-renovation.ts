"use server";

import { getAnonClient } from "@/lib/habita/supabase-anon";

export type RenovationInput = {
  agencyId: string;
  fullName: string;
  phone: string;
  email?: string;
  interest: string;   // "ristrutturazione" | "home-staging" | "render" | "valutazione"
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

  const { error } = await supabase.from("leads").insert({
    agency_id:    input.agencyId,
    full_name:    input.fullName.trim(),
    phone:        input.phone.trim() || null,
    email:        input.email?.trim() || null,
    status:       "new",
    temperature:  "warm",
    source:       "renovation",
    source_detail: input.interest,
    notes: [
      `Richiesta: ${input.interest}`,
      input.notes ? `Note: ${input.notes}` : null,
    ].filter(Boolean).join("\n"),
  });

  if (error) {
    console.error("[submit-renovation]", error);
    return { ok: false, error: "Errore nell'invio. Riprova." };
  }

  return { ok: true };
}
