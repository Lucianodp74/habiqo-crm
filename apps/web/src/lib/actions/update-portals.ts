"use server";

import { createClient } from "@/lib/supabase/server";

const VALID_PORTALS = ["website", "immobiliare", "idealista", "casa_it"] as const;
type PortalId = (typeof VALID_PORTALS)[number];

function sanitizePortals(portals: string[]): PortalId[] {
  const valid = portals.filter((p): p is PortalId =>
    VALID_PORTALS.includes(p as PortalId)
  );
  // website è sempre incluso
  if (!valid.includes("website")) valid.unshift("website");
  return valid;
}

export async function updatePropertyPortals(
  propertyId: string,
  portals: string[]
): Promise<{ ok: boolean; error?: string }> {
  if (!propertyId) return { ok: false, error: "Property ID mancante." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Non autenticato." };

  // Verifica che la proprietà appartenga all'agenzia dell'utente
  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership?.agency_id)
    return { ok: false, error: "Agenzia non trovata." };

  const { error } = await supabase
    .from("properties")
    .update({ published_to: sanitizePortals(portals) })
    .eq("id", propertyId)
    .eq("agency_id", membership.agency_id);

  if (error) {
    console.error("[update-portals]", error);
    return { ok: false, error: "Errore nel salvataggio." };
  }

  return { ok: true };
}
