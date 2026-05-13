"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  PROPERTY_PHOTOS_BUCKET,
  PROPERTY_PHOTO_ALLOWED_MIMES,
  PROPERTY_PHOTO_MAX_BYTES,
  buildPropertyPhotoPath,
  mimeToExtension,
  type PropertyPhotoMime,
} from "@/lib/storage/property-photos";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per modificare le foto di questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  FILE_MISSING: "File mancante.",
  FILE_TOO_LARGE: "Il file supera i 5 MB consentiti.",
  FILE_TYPE_NOT_ALLOWED:
    "Formato non supportato. Accettati: JPG, PNG, WEBP, AVIF.",
  UPLOAD_FAILED: "Caricamento fallito. Riprova.",
  UPDATE_FAILED: "Foto caricata ma DB non aggiornato. Riprova.",
} as const;

type UploadResult = ActionResult<{ path: string; photos: string[] }>;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export async function uploadPropertyPhoto(
  formData: FormData,
): Promise<UploadResult> {
  // 1) Pull and validate inputs from FormData
  const propertyId = formData.get("propertyId");
  const file = formData.get("file");

  if (typeof propertyId !== "string" || !propertyId) {
    return {
      ok: false,
      error: { code: "validation_error", message: MSG.VALIDATION },
    };
  }
  if (!(file instanceof File)) {
    return {
      ok: false,
      error: { code: "validation_error", message: MSG.FILE_MISSING },
    };
  }
  if (file.size > PROPERTY_PHOTO_MAX_BYTES) {
    return {
      ok: false,
      error: { code: "validation_error", message: MSG.FILE_TOO_LARGE },
    };
  }
  if (!PROPERTY_PHOTO_ALLOWED_MIMES.includes(file.type as PropertyPhotoMime)) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: MSG.FILE_TYPE_NOT_ALLOWED,
      },
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

  // 3) Fetch property + verify membership
  const { data: property } = await supabase
    .from("properties")
    .select("id, agency_id, slug, photos")
    .eq("id", propertyId)
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

  // 4) Upload to Storage
  const ext = mimeToExtension(file.type);
  const path = buildPropertyPhotoPath(property.agency_id, property.id, ext);

  const { error: uploadError } = await supabase.storage
    .from(PROPERTY_PHOTOS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000", // 1 year (paths are UUID-immutable)
      upsert: false,
    });

  if (uploadError) {
    return {
      ok: false,
      error: { code: "unknown", message: MSG.UPLOAD_FAILED },
    };
  }

  // 5) Append path to photos array
  const currentPhotos = property.photos ?? [];
  const newPhotos = [...currentPhotos, path];

  const { error: updateError } = await supabase
    .from("properties")
    .update({ photos: newPhotos })
    .eq("id", property.id);

  if (updateError) {
    // Best-effort rollback: remove the just-uploaded file from Storage.
    await supabase.storage.from(PROPERTY_PHOTOS_BUCKET).remove([path]);
    return {
      ok: false,
      error: { code: "unknown", message: MSG.UPDATE_FAILED },
    };
  }

  // 6) Revalidate admin and public pages
  await revalidateAfterPhotoChange(supabase, property.agency_id, property.slug, property.id);

  return { ok: true, data: { path, photos: newPhotos } };
}

/**
 * Shared revalidation helper. Invalidates the admin pages and, if the
 * property has been published, the public Habita pages too.
 */
async function revalidateAfterPhotoChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agencyId: string,
  propertySlug: string | null,
  propertyId: string,
): Promise<void> {
  revalidatePath(`/admin/properties/${propertyId}/photos`);
  revalidatePath("/admin/properties");

  if (!propertySlug) return;

  const { data: agencyRow } = await supabase
    .from("agencies")
    .select("slug")
    .eq("id", agencyId)
    .maybeSingle();

  if (agencyRow?.slug) {
    revalidatePath(`/${agencyRow.slug}/immobili`);
    revalidatePath(`/${agencyRow.slug}/immobili/${propertySlug}`);
  }
}
