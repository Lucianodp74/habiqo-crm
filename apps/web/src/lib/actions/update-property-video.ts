"use server";

import { createClient } from "@/lib/supabase/server";
import { parseVideoEmbed } from "@/lib/video/embed";
import type { ActionResult } from "@habiquo/types";
import { revalidatePath } from "next/cache";

const MSG = {
  INVALID_LINK: "Link non valido. Incolla un link YouTube o Vimeo.",
  UNAUTHENTICATED: "Sessione scaduta.",
  FORBIDDEN: "Non hai i permessi per modificare questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  UPDATE_FAILED: "Impossibile salvare il video. Riprova.",
} as const;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export async function updatePropertyVideo(input: {
  propertyId: string;
  videoUrl: string;
}): Promise<ActionResult<{ videoUrl: string | null }>> {
  const trimmed = input.videoUrl.trim();

  // Campo vuoto = rimuovi il video. Altrimenti deve essere YouTube o Vimeo.
  if (trimmed && !parseVideoEmbed(trimmed)) {
    return { ok: false, error: { code: "validation_error", message: MSG.INVALID_LINK } };
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

  if (!membership || !WRITE_ROLES.includes(membership.role as (typeof WRITE_ROLES)[number])) {
    return { ok: false, error: { code: "forbidden", message: MSG.FORBIDDEN } };
  }

  const valueToSave = trimmed || null;

  const { error: updateError } = await supabase
    .from("properties")
    .update({ video_url: valueToSave })
    .eq("id", property.id);

  if (updateError) {
    console.error("updatePropertyVideo: update failed", updateError);
    return { ok: false, error: { code: "unknown", message: MSG.UPDATE_FAILED } };
  }

  revalidatePath(`/admin/properties/${property.id}/photos`);

  if (property.slug) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("slug")
      .eq("id", property.agency_id)
      .maybeSingle();
    if (agency?.slug) revalidatePath(`/${agency.slug}/immobili/${property.slug}`);
  }

  return { ok: true, data: { videoUrl: valueToSave } };
}
