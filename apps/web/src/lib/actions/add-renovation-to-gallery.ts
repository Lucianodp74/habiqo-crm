"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  PROPERTY_PHOTOS_BUCKET,
  buildPropertyPhotoPath,
} from "@/lib/storage/property-photos";
import type { ActionResult } from "@habiquo/types";

/**
 * Aggiunge l'immagine "after" di un render AI completato all'array `photos`
 * dell'immobile. Azione manuale e deliberata: l'agente decide se il render
 * è abbastanza buono da mostrare nella galleria pubblica, non avviene mai
 * in automatico al completamento del render.
 *
 * Il render vive nel bucket `property-renovations` con la sua convenzione
 * di path. La galleria immobile (`properties.photos`) si aspetta invece
 * path relativi al bucket `property-photos` (vedi getPropertyPhotoUrl).
 * Per questo non basta salvare l'URL del render nell'array: bisogna
 * scaricarlo e ricaricarlo nel bucket giusto, con la stessa convenzione
 * di path delle altre foto (agencies/{agencyId}/properties/{propertyId}/{uuid}.{ext}).
 */

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta.",
  FORBIDDEN: "Non hai i permessi per modificare le foto di questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  FETCH_FAILED: "Impossibile recuperare l'immagine del render.",
  UPLOAD_FAILED: "Impossibile copiare il render nella galleria foto.",
  UPDATE_FAILED: "Impossibile aggiungere il render alla galleria.",
} as const;

type AddToGalleryResult = ActionResult<{ photos: string[] }>;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export async function addRenovationToGallery(input: {
  propertyId: string;
  afterImageUrl: string;
}): Promise<AddToGalleryResult> {
  if (!input.propertyId || !input.afterImageUrl) {
    return {
      ok: false,
      error: { code: "validation_error", message: MSG.VALIDATION },
    };
  }

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

  // Scarica il render dal suo bucket di origine (property-renovations).
  let imageBuffer: ArrayBuffer;
  try {
    const imageRes = await fetch(input.afterImageUrl);
    if (!imageRes.ok) throw new Error(`fetch failed: ${imageRes.status}`);
    imageBuffer = await imageRes.arrayBuffer();
  } catch {
    return {
      ok: false,
      error: { code: "unknown", message: MSG.FETCH_FAILED },
    };
  }

  // Ricarica nel bucket property-photos, con la stessa convenzione di path
  // usata da uploadPropertyPhoto, così getPropertyPhotoUrl funziona invariato.
  const newPath = buildPropertyPhotoPath(property.agency_id, property.id, "webp");

  const { error: uploadError } = await supabase.storage
    .from(PROPERTY_PHOTOS_BUCKET)
    .upload(newPath, imageBuffer, { contentType: "image/webp", upsert: false });

  if (uploadError) {
    return {
      ok: false,
      error: { code: "unknown", message: MSG.UPLOAD_FAILED },
    };
  }

  const currentPhotos: string[] = property.photos ?? [];
  const newPhotos = [...currentPhotos, newPath];

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
