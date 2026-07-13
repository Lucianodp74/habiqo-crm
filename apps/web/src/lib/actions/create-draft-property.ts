"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Dati immobile incompleti o non validi.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per creare immobili in nessuna agenzia.",
  LOCATION_NOT_FOUND: "Sede non valida per questa agenzia.",
  INSERT_FAILED: "Errore nella creazione dell'immobile bozza. Riprova.",
} as const;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export type CreateDraftPropertyInput = {
  /**
   * Maps to properties.listing_type (enum: property_listing_type).
   * Valid values: "sale" | "rent".
   */
  contractType: "sale" | "rent";
  /** Used in placeholder title until AI generation rewrites it */
  propertyType: string;
  city: string;
  /** EUR, total for sale, monthly for rent */
  price: number;
  sqm: number;
  /** Maps to properties.rooms */
  bedrooms: number;
  bathrooms: number;
  /**
   * Sede che gestisce l'immobile — indipendente dal Comune (city).
   * Obbligatorio solo se l'agenzia ha gia' almeno una sede configurata
   * (validato lato client); vuoto altrimenti, per non bloccare le
   * agenzie che non hanno ancora sedi impostate.
   */
  agencyLocationId: string;
};

type CreateResult = ActionResult<{ propertyId: string }>;

/**
 * Creates a draft property record from Step 1 of the AI publishing flow.
 *
 * The property is inserted with:
 *   - status = 'draft' (schema default)
 *   - is_public = false (schema default)
 *   - photos = [] (schema default)
 *   - placeholder title and address (NOT NULL, filled later by AI/manual edit)
 *   - agency_location_id se fornito e verificato appartenente all'agenzia
 *
 * Returns the new property's id so the client can pass it to the photo
 * upload step.
 */
export async function createDraftProperty(
  input: CreateDraftPropertyInput,
): Promise<CreateResult> {
  // 1) Validate inputs
  if (
    !input.contractType ||
    !input.propertyType?.trim() ||
    !input.city?.trim() ||
    !Number.isFinite(input.price) ||
    input.price <= 0 ||
    !Number.isFinite(input.sqm) ||
    input.sqm <= 0
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

  // 3) Resolve user's agency (first one with write role).
  // Note: assumes single-agency-per-user (current product state). If
  // multi-agency selection is added later, accept agencyId in input.
  const { data: memberships } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id);

  const writeMembership = memberships?.find((m) =>
    WRITE_ROLES.includes(m.role as (typeof WRITE_ROLES)[number]),
  );

  if (!writeMembership) {
    return {
      ok: false,
      error: { code: "forbidden", message: MSG.FORBIDDEN },
    };
  }

  // 3b) Se e' stata passata una sede, verifica esplicitamente che
  // appartenga alla stessa agenzia — nessuna deduzione automatica.
  // Se agencyLocationId e' vuoto (agenzia senza sedi configurate),
  // semplicemente non lo impostiamo: nessun blocco.
  let agencyLocationId: string | null = null;
  if (input.agencyLocationId?.trim()) {
    const { data: location } = await supabase
      .from("agency_locations")
      .select("id")
      .eq("id", input.agencyLocationId)
      .eq("agency_id", writeMembership.agency_id)
      .maybeSingle();

    if (!location) {
      return {
        ok: false,
        error: { code: "validation_error", message: MSG.LOCATION_NOT_FOUND },
      };
    }
    agencyLocationId = location.id;
  }

  // 4) Build draft payload.
  // title and address are NOT NULL in schema: we use placeholders until
  // the AI step (Step 3) rewrites the title and the user fills the
  // address in advanced (Step 4) or via the admin edit page.
  const placeholderTitle = `${input.propertyType} · ${input.city} (Bozza)`;
  const placeholderAddress = `Indirizzo da definire`;

  const { data: inserted, error: insertError } = await supabase
    .from("properties")
    .insert({
      agency_id: writeMembership.agency_id,
      listing_type: input.contractType,
      title: placeholderTitle,
      address: placeholderAddress,
      city: input.city.trim(),
      price_eur: Math.round(input.price),
      sqm: Math.round(input.sqm),
      rooms: input.bedrooms,
      bathrooms: input.bathrooms,
      agency_location_id: agencyLocationId,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("createDraftProperty: insert failed", insertError);
    return {
      ok: false,
      error: { code: "unknown", message: MSG.INSERT_FAILED },
    };
  }

  // 5) Revalidate admin pages so the draft appears in property lists
  revalidatePath("/admin/properties");

  return { ok: true, data: { propertyId: inserted.id } };
}
