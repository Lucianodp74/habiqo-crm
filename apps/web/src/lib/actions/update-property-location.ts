"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per modificare questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  LOCATION_NOT_FOUND: "Sede non valida per questa agenzia.",
  UPDATE_FAILED: "Impossibile salvare la sede. Riprova.",
} as const;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

type UpdateLocationResult = ActionResult<{ agencyLocationId: string | null }>;

/**
 * Cambia la Sede di un immobile gia' esistente. Azione indipendente dal
 * resto della modifica immobile (non esiste ancora una pagina di modifica
 * generale) — stesso pattern gia' usato per il codice interno immobile.
 *
 * agencyLocationId puo' essere null per "rimuovere" l'assegnazione sede.
 */
export async function updatePropertyLocation(input: {
  propertyId: string;
  agencyLocationId: string | null;
}): Promise<UpdateLocationResult> {
  if (!input.propertyId) {
    return { ok: false, error: { code: "validation_error", message: MSG.VALIDATION } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "unauthenticated", message: MSG.UNAUTHENTICATED } };
  }

  const { data: property } = await supabase
    .from("properties")
    .select("id, agency_id, slug")
    .eq("id", input.propertyId)
    .maybeSingle();

  if (!property) {
    return { ok: false, error: { code: "not_found", message: MSG.PROPERTY_NOT_FOUND } };
  }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", property.agency_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !membership ||
    !WRITE_ROLES.includes(membership.role as (typeof WRITE_ROLES)[number])
  ) {
    return { ok: false, error: { code: "forbidden", message: MSG.FORBIDDEN } };
  }

  // Se viene passato un ID, verifica esplicitamente che la sede appartenga
  // alla stessa agenzia dell'immobile. Nessuna deduzione automatica.
  if (input.agencyLocationId) {
    const { data: location } = await supabase
      .from("agency_locations")
      .select("id")
      .eq("id", input.agencyLocationId)
      .eq("agency_id", property.agency_id)
      .maybeSingle();

    if (!location) {
      return { ok: false, error: { code: "validation_error", message: MSG.LOCATION_NOT_FOUND } };
    }
  }

  const { error: updateError } = await supabase
    .from("properties")
    .update({ agency_location_id: input.agencyLocationId })
    .eq("id", property.id);

  if (updateError) {
    console.error("updatePropertyLocation: update failed", updateError);
    return { ok: false, error: { code: "unknown", message: MSG.UPDATE_FAILED } };
  }

  revalidatePath(`/admin/properties/${property.id}/photos`);
  revalidatePath("/admin/properties");

  return { ok: true, data: { agencyLocationId: input.agencyLocationId } };
}
