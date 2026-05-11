"use server";

import { getAnonClient } from "@/lib/habita/supabase-anon";

export type SubmitLeadInput = {
  agencyId: string;
  propertyId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  message: string | null;
};

export type SubmitLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

const ERROR_MESSAGES: Record<string, string> = {
  ERR_VALIDATION_NAME: "Il nome è obbligatorio (almeno 2 caratteri).",
  ERR_VALIDATION_NAME_LENGTH: "Il nome è troppo lungo.",
  ERR_VALIDATION_CONTACT: "Inserisci almeno una email o un telefono.",
  ERR_VALIDATION_MESSAGE: "Il messaggio è troppo lungo (max 4000 caratteri).",
  ERR_AGENCY_NOT_FOUND: "Agenzia non disponibile.",
  ERR_PROPERTY_NOT_FOUND: "Immobile non disponibile.",
};

export async function submitPublicLead(
  input: SubmitLeadInput
): Promise<SubmitLeadResult> {
  // Server-side validation mirrors the RPC's checks but returns
  // friendlier Italian messages. The RPC is still the source of
  // truth (defense in depth).
  if (!input.fullName || input.fullName.trim().length < 2) {
    return { ok: false, error: ERROR_MESSAGES.ERR_VALIDATION_NAME };
  }
  if (input.fullName.length > 200) {
    return { ok: false, error: ERROR_MESSAGES.ERR_VALIDATION_NAME_LENGTH };
  }
  if (!input.email?.trim() && !input.phone?.trim()) {
    return { ok: false, error: ERROR_MESSAGES.ERR_VALIDATION_CONTACT };
  }
  if (input.message && input.message.length > 4000) {
    return { ok: false, error: ERROR_MESSAGES.ERR_VALIDATION_MESSAGE };
  }

  const supabase = getAnonClient();

  const { data, error } = await supabase.rpc("submit_public_lead", {
    p_agency_id: input.agencyId,
    p_property_id: input.propertyId,
    p_full_name: input.fullName.trim(),
    p_email: input.email?.trim() || null,
    p_phone: input.phone?.trim() || null,
    p_message: input.message?.trim() || null,
  });

  if (error) {
    console.error("[habita/submit-public-lead] RPC error:", error);
    // Translate known error codes to user-friendly messages
    const errorString = error.message || "";
    for (const [errCode, msg] of Object.entries(ERROR_MESSAGES)) {
      if (errorString.includes(errCode)) {
        return { ok: false, error: msg };
      }
    }
    return {
      ok: false,
      error: "Si è verificato un errore. Riprova più tardi.",
    };
  }

  return { ok: true, leadId: data as string };
}
