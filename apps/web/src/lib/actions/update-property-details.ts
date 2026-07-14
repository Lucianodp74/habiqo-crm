"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Dati non validi. Controlla i campi e riprova.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per modificare questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  UPDATE_FAILED: "Errore nel salvataggio. Riprova.",
} as const;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

/**
 * Campi modificabili di un immobile già pubblicato. Il tipo di contratto
 * (vendita/affitto) è escluso deliberatamente: cambiarlo su un annuncio
 * già pubblicato non è una correzione ma una trasformazione concettuale
 * dell'annuncio, con possibili effetti collaterali su feed/matching che
 * meritano una decisione a parte, non un campo di modifica rapida.
 */
export type UpdatePropertyDetailsInput = {
  propertyId: string;
  price: number;
  sqm: number;
  rooms: number;
  bathrooms: number;
  city: string;
  address: string;
  postalCode?: string;
  region?: string;
  floor?: number | null;
  hasElevator: boolean;
  hasGarage: boolean;
  energyClass?: string;
};

type UpdateResult = ActionResult<{ propertyId: string }>;

export async function updatePropertyDetails(
  input: UpdatePropertyDetailsInput,
): Promise<UpdateResult> {
  // 1) Validazione — stessi vincoli già usati in create-draft-property.ts
  if (
    !input.propertyId ||
    !Number.isFinite(input.price) ||
    input.price <= 0 ||
    !Number.isFinite(input.sqm) ||
    input.sqm <= 0 ||
    !Number.isFinite(input.rooms) ||
    input.rooms < 0 ||
    !Number.isFinite(input.bathrooms) ||
    input.bathrooms < 1 ||
    !input.city?.trim() ||
    !input.address?.trim()
  ) {
    return {
      ok: false,
      error: { code: "validation_error", message: MSG.VALIDATION },
    };
  }

  // 2) Auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: { code: "unauthenticated", message: MSG.UNAUTHENTICATED },
    };
  }

  // 3) Fetch property + verify write membership
  const { data: property } = await supabase
    .from("properties")
    .select("id, agency_id, slug")
    .eq("id", input.propertyId)
    .maybeSingle();

  if (!property) {
    return {
      ok: false,
      error: { code: "not_found", message: MSG.PROPERTY_NOT_FOUND },
    };
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
    return {
      ok: false,
      error: { code: "forbidden", message: MSG.FORBIDDEN },
    };
  }

  // 4) Build update payload
  const payload: Record<string, unknown> = {
    price_eur: Math.round(input.price),
    sqm: Math.round(input.sqm),
    rooms: input.rooms,
    bathrooms: input.bathrooms,
    city: input.city.trim(),
    address: input.address.trim(),
    has_elevator: input.hasElevator,
    has_garage: input.hasGarage,
  };

  if (input.postalCode !== undefined) {
    payload.postal_code = input.postalCode.trim() || null;
  }
  if (input.region !== undefined) {
    payload.region = input.region.trim() || null;
  }
  if (input.floor !== undefined) {
    payload.floor = input.floor;
  }
  if (input.energyClass !== undefined) {
    payload.energy_class = input.energyClass.trim() || null;
  }

  // 5) Update
  const { error: updateError } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", property.id);

  if (updateError) {
    console.error("updatePropertyDetails: update failed", updateError);
    return {
      ok: false,
      error: { code: "unknown", message: MSG.UPDATE_FAILED },
    };
  }

  // 6) Revalidate admin AND public pages — un prezzo cambiato deve
  // riflettersi subito anche sul sito pubblico (stesso pattern già
  // usato in publish-property.ts).
  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${property.id}/photos`);

  if (property.slug) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("slug")
      .eq("id", property.agency_id)
      .maybeSingle();
    if (agency?.slug) {
      revalidatePath(`/${agency.slug}/immobili`);
      revalidatePath(`/${agency.slug}/immobili/${property.slug}`);
    }
  }

  return { ok: true, data: { propertyId: property.id } };
}
