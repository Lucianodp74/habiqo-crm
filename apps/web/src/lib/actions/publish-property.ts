"use server";
import { sendMatchNotificationForProperty } from "@/lib/email/send-match-notification";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per pubblicare questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  PUBLISH_FAILED: "Errore nella pubblicazione. Riprova.",
} as const;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export type PublishPropertyInput = {
  propertyId: string;
  /** Optional Step 4 advanced fields — applied if provided */
  address?: string;
  postalCode?: string;
  region?: string;
  floor?: number | null;
  hasElevator?: boolean | null;
  hasGarage?: boolean | null;
  energyClass?: string;
};

type PublishResult = ActionResult<{
  propertyId: string;
  propertySlug: string;
  agencySlug: string;
}>;

// ──────────────────────────────────────────────────────────────────────
// Slug generator
// ──────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 60);
}

function generateUniqueSlug(title: string): string {
  const base = slugify(title) || "immobile";
  const suffix = Math.random().toString(36).substring(2, 7);
  return `${base}-${suffix}`;
}

// ──────────────────────────────────────────────────────────────────────
// Server action
// ──────────────────────────────────────────────────────────────────────

/**
 * Publishes a draft property:
 *   - sets status = 'active'    (property_status enum: draft|active|reserved|sold|archived)
 *   - sets is_public = true
 *   - sets published_at = now()
 *   - generates a unique slug from the title
 *   - applies any optional Step 4 advanced fields
 *
 * Returns the property slug + the agency slug so the client can link
 * to the live public listing.
 */
export async function publishProperty(
  input: PublishPropertyInput,
): Promise<PublishResult> {
  if (!input.propertyId) {
    return {
      ok: false,
      error: { code: "validation_error", message: MSG.VALIDATION },
    };
  }

  const supabase = await createClient();

  // 1) Auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: { code: "unauthenticated", message: MSG.UNAUTHENTICATED },
    };
  }

  // 2) Fetch property + verify write membership
  const { data: property } = await supabase
    .from("properties")
    .select("id, agency_id, title, slug")
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

  // 3) Build update payload
  const propertySlug = property.slug || generateUniqueSlug(property.title);

  type UpdatePayload = {
    status: "active";
    is_public: true;
    published_at: string;
    slug: string;
    address?: string;
    postal_code?: string;
    region?: string;
    floor?: number | null;
    has_elevator?: boolean | null;
    has_garage?: boolean | null;
    energy_class?: string;
  };

  const payload: UpdatePayload = {
    status: "active",
    is_public: true,
    published_at: new Date().toISOString(),
    slug: propertySlug,
  };

  if (input.address?.trim()) payload.address = input.address.trim();
  if (input.postalCode?.trim()) payload.postal_code = input.postalCode.trim();
  if (input.region?.trim()) payload.region = input.region.trim();
  if (typeof input.floor === "number") payload.floor = input.floor;
  if (input.hasElevator !== undefined && input.hasElevator !== null) {
    payload.has_elevator = input.hasElevator;
  }
  if (input.hasGarage !== undefined && input.hasGarage !== null) {
    payload.has_garage = input.hasGarage;
  }
  if (input.energyClass?.trim()) payload.energy_class = input.energyClass.trim();

  // 4) Update
  const { error: updateError } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", property.id);

  if (updateError) {
    console.error("publishProperty: update failed", updateError);
    return {
      ok: false,
      error: { code: "unknown", message: MSG.PUBLISH_FAILED },
    };
  }

  // 4b) Notify matching leads (fire and forget)
  void sendMatchNotificationForProperty(
    property.id,
    property.agency_id,
    process.env.NEXT_PUBLIC_APP_URL ?? "https://habiquo.it",
  )

  // 5) Fetch agency slug for return value + revalidation
  const { data: agency } = await supabase
    .from("agencies")
    .select("slug")
    .eq("id", property.agency_id)
    .maybeSingle();

  const agencySlug = agency?.slug ?? "";

  // 6) Revalidate admin + public paths
  revalidatePath("/admin/properties");
  revalidatePath(`/admin/properties/${property.id}`);
  if (agencySlug) {
    revalidatePath(`/${agencySlug}`);
    revalidatePath(`/${agencySlug}/immobili`);
    revalidatePath(`/${agencySlug}/immobili/${propertySlug}`);
  }

  return {
    ok: true,
    data: {
      propertyId: property.id,
      propertySlug,
      agencySlug,
    },
  };
}

