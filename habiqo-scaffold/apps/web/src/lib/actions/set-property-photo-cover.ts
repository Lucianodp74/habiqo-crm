"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

/**
 * "Set as cover" = move the chosen path to index 0 of the photos array.
 * The convention enforced everywhere in the app is `photos[0]` is the
 * cover image displayed on cards and as the hero of the gallery.
 */

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta.",
  FORBIDDEN: "Non hai i permessi per modificare le foto di questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  PATH_NOT_FOUND: "Foto non trovata nell'elenco.",
  UPDATE_FAILED: "Impossibile aggiornare l'ordine delle foto.",
} as const;

type SetCoverResult = ActionResult<{ photos: string[] }>;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export async function setPropertyPhotoCover(input: {
  propertyId: string;
  path: string;
}): Promise<SetCoverResult> {
  if (!input.propertyId || !input.path) {
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

  const photos: string[] = property.photos ?? [];
  if (!photos.includes(input.path)) {
    return {
      ok: false,
      error: { code: "not_found", message: MSG.PATH_NOT_FOUND },
    };
  }

  // If already cover, no-op (still revalidate to be safe).
  if (photos[0] === input.path) {
    return { ok: true, data: { photos } };
  }

  // Move the chosen path to index 0, preserving order of the rest.
  const otherPhotos = photos.filter((p) => p !== input.path);
  const newPhotos = [input.path, ...otherPhotos];

  const { error: updateError } = await supabase
    .from("properties")
    .update({ photos: newPhotos })
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

  return { ok: true, data: { photos: newPhotos } };
}
