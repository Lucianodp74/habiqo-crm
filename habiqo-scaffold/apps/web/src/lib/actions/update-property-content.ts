"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Contenuto incompleto o non valido.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per modificare questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  UPDATE_FAILED: "Errore nel salvataggio del contenuto. Riprova.",
} as const;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export type UpdatePropertyContentInput = {
  propertyId: string;
  title: string;
  description: string;
  amenities: string[];
  seoTitle: string;
  socialCaption: string;
};

type UpdateResult = ActionResult<{ propertyId: string }>;

/**
 * Updates a property's narrative content (title, description, amenities,
 * SEO, social caption) from the AI generation step.
 *
 * Sets ai_generated_at to track when the content was generated/edited.
 * The user can have edited the AI output before submitting — this action
 * doesn't know or care; it persists whatever it receives.
 */
export async function updatePropertyContent(
  input: UpdatePropertyContentInput,
): Promise<UpdateResult> {
  // 1) Validate
  if (
    !input.propertyId ||
    !input.title?.trim() ||
    !input.description?.trim() ||
    !Array.isArray(input.amenities) ||
    !input.seoTitle?.trim() ||
    !input.socialCaption?.trim()
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

  // 4) Update
  const cleanedAmenities = input.amenities
    .map((a) => a.trim())
    .filter((a) => a.length > 0);

  const { error: updateError } = await supabase
    .from("properties")
    .update({
      title: input.title.trim(),
      description: input.description.trim(),
      amenities: cleanedAmenities,
      seo_title: input.seoTitle.trim(),
      social_caption: input.socialCaption.trim(),
      ai_generated_at: new Date().toISOString(),
    })
    .eq("id", property.id);

  if (updateError) {
    console.error("updatePropertyContent: update failed", updateError);
    return {
      ok: false,
      error: { code: "unknown", message: MSG.UPDATE_FAILED },
    };
  }

  // 5) Revalidate admin and (if applicable) public pages
  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${property.id}`);

  if (property.slug) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("slug")
      .eq("id", property.agency_id)
      .maybeSingle();
    if (agency?.slug) {
      revalidatePath(`/${agency.slug}/immobili/${property.slug}`);
    }
  }

  return { ok: true, data: { propertyId: property.id } };
}
