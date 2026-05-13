"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { PROPERTY_PHOTOS_BUCKET } from "@/lib/storage/property-photos";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta.",
  FORBIDDEN: "Non hai i permessi per modificare le foto di questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  PATH_NOT_FOUND: "Foto non trovata nell'elenco.",
  DELETE_FAILED: "Eliminazione fallita.",
  UPDATE_FAILED: "Foto eliminata da storage ma DB non aggiornato.",
} as const;

type DeleteResult = ActionResult<{ photos: string[] }>;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export async function deletePropertyPhoto(input: {
  propertyId: string;
  path: string;
}): Promise<DeleteResult> {
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

  // Validate path belongs to this property
  const photos: string[] = property.photos ?? [];
  if (!photos.includes(input.path)) {
    return {
      ok: false,
      error: { code: "not_found", message: MSG.PATH_NOT_FOUND },
    };
  }

  // Remove from Storage first. If this fails, we don't touch the DB.
  const { error: deleteError } = await supabase.storage
    .from(PROPERTY_PHOTOS_BUCKET)
    .remove([input.path]);

  if (deleteError) {
    return {
      ok: false,
      error: { code: "unknown", message: MSG.DELETE_FAILED },
    };
  }

  // Update photos array
  const newPhotos = photos.filter((p) => p !== input.path);

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
