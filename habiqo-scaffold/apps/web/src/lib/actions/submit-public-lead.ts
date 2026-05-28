"use server";
import { getAnonClient } from "@/lib/habita/supabase-anon";

export type SubmitLeadInput = {
  agencyId: string;
  propertyId: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  source?: string | null; // parametro UTM dal portale
};

export type SubmitLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

const ERROR_MESSAGES = {
  ERR_VALIDATION_NAME: "Il nome è obbligatorio (almeno 2 caratteri).",
  ERR_VALIDATION_NAME_LENGTH: "Il nome è troppo lungo.",
  ERR_VALIDATION_CONTACT: "Inserisci almeno una email o un telefono.",
  ERR_VALIDATION_MESSAGE: "Il messaggio è troppo lungo (max 4000 caratteri).",
  ERR_AGENCY_NOT_FOUND: "Agenzia non disponibile.",
  ERR_PROPERTY_NOT_FOUND: "Immobile non disponibile.",
};

/**
 * Mappa il parametro ?source= dell'URL ai valori del DB.
 * I portali inviano il traffico con questi parametri:
 *   ?source=immobiliare  → source='portal', detail='immobiliare.it'
 *   ?source=idealista    → source='idealista', detail='idealista.it'
 *   ?source=casa         → source='portal', detail='casa.it'
 *   ?source=facebook     → source='facebook'
 *   ?source=whatsapp     → source='whatsapp'
 *   (nessuno)            → source='website', detail='habita'
 */
function mapSource(raw: string | null | undefined): {
  source: string;
  sourceDetail: string;
} {
  switch (raw?.toLowerCase()) {
    case "immobiliare":
      return { source: "portal", sourceDetail: "immobiliare.it" };
    case "idealista":
      return { source: "idealista", sourceDetail: "idealista.it" };
    case "casa":
      return { source: "portal", sourceDetail: "casa.it" };
    case "facebook":
      return { source: "facebook", sourceDetail: "facebook" };
    case "whatsapp":
      return { source: "whatsapp", sourceDetail: "whatsapp" };
    case "referral":
      return { source: "referral", sourceDetail: "referral" };
    default:
      return { source: "website", sourceDetail: "habita" };
  }
}

export async function submitPublicLead(
  input: SubmitLeadInput
): Promise<SubmitLeadResult> {
  if (!input.fullName || input.fullName.trim().length < 2)
    return { ok: false, error: ERROR_MESSAGES.ERR_VALIDATION_NAME };
  if (input.fullName.length > 200)
    return { ok: false, error: ERROR_MESSAGES.ERR_VALIDATION_NAME_LENGTH };
  if (!input.email?.trim() && !input.phone?.trim())
    return { ok: false, error: ERROR_MESSAGES.ERR_VALIDATION_CONTACT };
  if (input.message && input.message.length > 4000)
    return { ok: false, error: ERROR_MESSAGES.ERR_VALIDATION_MESSAGE };

  const { source, sourceDetail } = mapSource(input.source);

  const supabase = getAnonClient();
  const { data, error } = await supabase.rpc("submit_public_lead", {
    p_agency_id: input.agencyId,
    p_property_id: input.propertyId,
    p_full_name: input.fullName.trim(),
    p_email: input.email?.trim() || null,
    p_phone: input.phone?.trim() || null,
    p_message: input.message?.trim() || null,
    p_source: source,
    p_source_detail: sourceDetail,
  });

  if (error) {
    console.error("[habita/submit-public-lead] RPC error:", error);
    const errorString = error.message || "";
    for (const [errCode, msg] of Object.entries(ERROR_MESSAGES)) {
      if (errorString.includes(errCode)) return { ok: false, error: msg };
    }
    return { ok: false, error: "Si è verificato un errore. Riprova più tardi." };
  }

  return { ok: true, leadId: data as string };
}
