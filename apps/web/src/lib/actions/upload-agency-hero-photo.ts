"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  PROPERTY_PHOTOS_BUCKET,
  getPropertyPhotoUrl,
} from "@/lib/storage/property-photos";
import {
  AGENCY_HERO_PHOTO_ALLOWED_MIMES,
  AGENCY_HERO_PHOTO_MAX_BYTES,
  buildAgencyHeroPhotoPath,
  mimeToExtension,
  type AgencyHeroPhotoMime,
} from "@/lib/storage/agency-photos";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Solo owner e admin possono modificare la foto Hero del sito.",
  AGENCY_NOT_FOUND: "Agenzia non trovata.",
  FILE_MISSING: "File mancante.",
  FILE_TOO_LARGE: "Il file supera i 5 MB consentiti.",
  FILE_TYPE_NOT_ALLOWED: "Formato non supportato. Accettati: JPG, PNG, WEBP.",
  UPLOAD_FAILED: "Caricamento fallito. Riprova.",
  UPDATE_FAILED: "Foto caricata ma non salvata. Riprova.",
} as const;

type UploadResult = ActionResult<{ path: string; url: string }>;

/**
 * Shared auth + role check. Only owner/admin can edit public site settings
 * (mirrors the same restriction already enforced in updateAgencyPublic).
 */
async function requireAgencyAdmin(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agencyId: string,
): Promise<
  | { ok: true; currentCoverPath: string | null }
  | { ok: false; result: ActionResult<never> }
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      result: { ok: false, error: { code: "unauthenticated", message: MSG.UNAUTHENTICATED } },
    };
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("id, cover_image_path")
    .eq("id", agencyId)
    .maybeSingle();

  if (!agency) {
    return {
      ok: false,
      result: { ok: false, error: { code: "not_found", message: MSG.AGENCY_NOT_FOUND } },
    };
  }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", agencyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || (membership.role !== "owner" && membership.role !== "admin")) {
    return {
      ok: false,
      result: { ok: false, error: { code: "forbidden", message: MSG.FORBIDDEN } },
    };
  }

  return { ok: true, currentCoverPath: agency.cover_image_path };
}

async function revalidateAgencyPaths(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agencyId: string,
): Promise<void> {
  revalidatePath("/admin/agency");
  const { data: agencyRow } = await supabase
    .from("agencies")
    .select("slug")
    .eq("id", agencyId)
    .maybeSingle();
  if (agencyRow?.slug) {
    revalidatePath(`/${agencyRow.slug}`);
  }
}

export async function uploadAgencyHeroPhoto(formData: FormData): Promise<UploadResult> {
  const agencyId = formData.get("agencyId");
  const file = formData.get("file");

  if (typeof agencyId !== "string" || !agencyId) {
    return { ok: false, error: { code: "validation_error", message: MSG.VALIDATION } };
  }
  if (!(file instanceof File)) {
    return { ok: false, error: { code: "validation_error", message: MSG.FILE_MISSING } };
  }
  if (file.size > AGENCY_HERO_PHOTO_MAX_BYTES) {
    return { ok: false, error: { code: "validation_error", message: MSG.FILE_TOO_LARGE } };
  }
  if (!AGENCY_HERO_PHOTO_ALLOWED_MIMES.includes(file.type as AgencyHeroPhotoMime)) {
    return { ok: false, error: { code: "validation_error", message: MSG.FILE_TYPE_NOT_ALLOWED } };
  }

  const supabase = await createClient();
  const auth = await requireAgencyAdmin(supabase, agencyId);
  if (!auth.ok) return auth.result;

  const ext = mimeToExtension(file.type);
  const path = buildAgencyHeroPhotoPath(agencyId, ext);

  const { error: uploadError } = await supabase.storage
    .from(PROPERTY_PHOTOS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    return { ok: false, error: { code: "unknown", message: MSG.UPLOAD_FAILED } };
  }

  const { error: updateError } = await supabase
    .from("agencies")
    .update({ cover_image_path: path })
    .eq("id", agencyId);

  if (updateError) {
    // Best-effort rollback: remove the just-uploaded file from Storage.
    await supabase.storage.from(PROPERTY_PHOTOS_BUCKET).remove([path]);
    return { ok: false, error: { code: "unknown", message: MSG.UPDATE_FAILED } };
  }

  // Best-effort cleanup of the previous cover photo, if one existed, to
  // avoid orphaned files accumulating in Storage over time.
  if (auth.currentCoverPath) {
    await supabase.storage.from(PROPERTY_PHOTOS_BUCKET).remove([auth.currentCoverPath]);
  }

  await revalidateAgencyPaths(supabase, agencyId);

  return { ok: true, data: { path, url: getPropertyPhotoUrl(path) } };
}

export async function removeAgencyHeroPhoto(
  agencyId: string,
): Promise<ActionResult<{ removed: true }>> {
  if (!agencyId) {
    return { ok: false, error: { code: "validation_error", message: MSG.VALIDATION } };
  }

  const supabase = await createClient();
  const auth = await requireAgencyAdmin(supabase, agencyId);
  if (!auth.ok) return auth.result;

  const { error: updateError } = await supabase
    .from("agencies")
    .update({ cover_image_path: null })
    .eq("id", agencyId);

  if (updateError) {
    return { ok: false, error: { code: "unknown", message: MSG.UPDATE_FAILED } };
  }

  if (auth.currentCoverPath) {
    await supabase.storage.from(PROPERTY_PHOTOS_BUCKET).remove([auth.currentCoverPath]);
  }

  await revalidateAgencyPaths(supabase, agencyId);

  return { ok: true, data: { removed: true } };
}
