"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per modificare questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  LIMIT_REACHED:
    "Hai già 6 immobili in evidenza. Rimuovine uno prima di aggiungerne un altro.",
  UPDATE_FAILED: "Impossibile salvare. Riprova.",
} as const;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

// Stesso numero di card mostrate nella sezione "Immobili in evidenza"
// della home pubblica — oltre non avrebbe effetto visibile e rischia di
// far credere all'agenzia che tutti i "preferiti" compaiano sempre.
const MAX_FEATURED = 6;

type ToggleFeaturedResult = ActionResult<{ isFeatured: boolean }>;

/**
 * Permette all'agenzia di scegliere manualmente quali immobili mettere in
 * evidenza sulla home pubblica (Hero + sezione "Immobili in evidenza"),
 * invece dell'ordinamento automatico per data di creazione.
 */
export async function togglePropertyFeatured(input: {
  propertyId: string;
  isFeatured: boolean;
}): Promise<ToggleFeaturedResult> {
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
    .select("id, agency_id")
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

  if (input.isFeatured) {
    const { count } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", property.agency_id)
      .eq("is_featured", true);

    if ((count ?? 0) >= MAX_FEATURED) {
      return { ok: false, error: { code: "validation_error", message: MSG.LIMIT_REACHED } };
    }
  }

  const { error: updateError } = await supabase
    .from("properties")
    .update({ is_featured: input.isFeatured })
    .eq("id", property.id);

  if (updateError) {
    console.error("togglePropertyFeatured: update failed", updateError);
    return { ok: false, error: { code: "unknown", message: MSG.UPDATE_FAILED } };
  }

  revalidatePath("/admin/properties");

  // Rende visibile subito il cambiamento anche sulla home pubblica
  // dell'agenzia (Hero + sezione Immobili in evidenza).
  const { data: agency } = await supabase
    .from("agencies")
    .select("slug")
    .eq("id", property.agency_id)
    .maybeSingle();
  if (agency?.slug) {
    revalidatePath(`/${agency.slug}`);
  }

  return { ok: true, data: { isFeatured: input.isFeatured } };
}
