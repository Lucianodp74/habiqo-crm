"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

/**
 * Reorder = replace the whole photos array with a new order chosen by the
 * user via drag & drop. The convention enforced everywhere in the app is
 * `photos[0]` is the cover image displayed on cards and as the hero of
 * the gallery — moving any photo to index 0 makes it the new cover.
 */

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta.",
  FORBIDDEN: "Non hai i permessi per modificare le foto di questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  MISMATCH: "L'elenco foto non corrisponde a quello salvato. Ricarica la pagina.",
  UPDATE_FAILED: "Impossibile aggiornare l'ordine delle foto.",
} as const;

type ReorderResult = ActionResult<{ photos: string[] }>;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export async function reorderPropertyPhotos(input: {
  propertyId: string;
  orderedPaths: string[];
}): Promise<ReorderResult> {
  if (!input.propertyId || !Array.isArray(input.orderedPaths) || input.orderedPaths.length === 0) {
    return {
      ok: false,
      error: { code: "validation_error", message: MSG.VALIDATION },
    };
  }

  const supabase = await createClient();

  // Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: { code: "unauthenticated", message: MSG.UNAUTHENTICATED },
    };
  }

  // Fetch property + verify membership
  const { data: property } = await supabase
    .from("properties")
    .select("id, agency_id, slug, photos")
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

  const currentPhotos: string[] = property.photos ?? [];

  // Defense in depth: the new order must contain exactly the same set of
  // paths as what's currently saved — no additions, no removals, no typos
  // from a stale client. This prevents a race (e.g. someone deleted a photo
  // in another tab) from silently dropping it from the array.
  const currentSet = new Set(currentPhotos);
  const newSet = new Set(input.orderedPaths);
  const sameSize = currentSet.size === newSet.size;
  const sameMembers = sameSize && [...currentSet].every((p) => newSet.has(p));

  if (!sameMembers) {
    return {
      ok: false,
      error: { code: "validation_error", message: MSG.MISMATCH },
    };
  }

  const { error: updateError } = await supabase
    .from("properties")
    .update({ photos: input.orderedPaths })
    .eq("id", property.id);

  if (updateError) {
    return {
      ok: false,
      error: { code: "unknown", message: MSG.UPDATE_FAILED },
    };
  }

  // Revalidate
  revalidatePath(`/admin/properties/${property.id}/photos`);
  revalidatePath("/admin/properties");

  if (property.slug) {
    const { data: agencyRow } = await supabase
      .from("agencies")
      .select("slug")
      .eq("id", property.agency_id)
      .maybeSingle();

    if (agencyRow?.slug) {
      revalidatePath(`/${agencyRow.slug}/immobili`);
      revalidatePath(`/${agencyRow.slug}/immobili/${property.slug}`);
    }
  }

  return { ok: true, data: { photos: input.orderedPaths } };
}
