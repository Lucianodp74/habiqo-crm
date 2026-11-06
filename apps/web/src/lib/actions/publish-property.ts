"use server";
import { sendMatchNotificationForProperty } from "@/lib/email/send-match-notification";

import { revalidatePath } from "next/cache";

import { generateUniqueSlug } from "@/lib/properties/property-slug";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per pubblicare questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  PUBLISH_FAILED: "Errore nella pubblicazione. Riprova.",
  // 23514 check_violation: some field breaks a database rule.
  INVALID_DATA:
    "Alcuni dati dell'immobile non rispettano i requisiti per la pubblicazione. Controlla titolo e dati principali, poi riprova.",
  // 23505 unique_violation: the generated web address is already used.
  SLUG_TAKEN:
    "L'indirizzo web dell'annuncio è già usato da un altro immobile. Riprova: ne verrà generato uno nuovo.",
} as const;

/**
 * Postgres error codes we turn into a clear message. The SQL details stay
 * in the server log only.
 */
const PG_CHECK_VIOLATION = "23514";
const PG_UNIQUE_VIOLATION = "23505";

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
    .select("id, agency_id, title, slug, is_public, city, price_eur, rooms, sqm, listing_type")
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

  // 2b) Already published: nothing to do. Avoids a second publication
  // (published_at reset, lead notifications sent again) on a double click
  // or a stale page.
  if (property.is_public && property.slug) {
    const { data: publishedAgency } = await supabase
      .from("agencies")
      .select("slug")
      .eq("id", property.agency_id)
      .maybeSingle();
    return {
      ok: true,
      data: {
        propertyId: property.id,
        propertySlug: property.slug,
        agencySlug: publishedAgency?.slug ?? "",
      },
    };
  }

  // 3) Build update payload. The slug comes from the title but never
  // changes it; generateUniqueSlug keeps it within the 60-char DB limit.
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

  // 4) Update only while the row is still a draft. PostgreSQL re-checks
  // `is_public = false` after a concurrent update commits, so when two
  // requests publish at the same time exactly one of them gets the row
  // back; the other updates nothing (no second slug, no second notification).
  const { data: updatedRows, error: updateError } = await supabase
    .from("properties")
    .update(payload)
    .eq("id", property.id)
    .eq("is_public", false)
    .select("slug");

  if (updateError) {
    // Technical details for the server log only, never for the user.
    console.error("publishProperty: update failed", {
      propertyId: property.id,
      code: updateError.code,
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
    });
    if (updateError.code === PG_CHECK_VIOLATION) {
      return {
        ok: false,
        error: { code: "validation_error", message: MSG.INVALID_DATA },
      };
    }
    if (updateError.code === PG_UNIQUE_VIOLATION) {
      return {
        ok: false,
        error: { code: "conflict", message: MSG.SLUG_TAKEN },
      };
    }
    return {
      ok: false,
      error: { code: "unknown", message: MSG.PUBLISH_FAILED },
    };
  }

  const published = (updatedRows as Array<{ slug: string | null }> | null)?.[0];
  if (!published?.slug) {
    // Published meanwhile by another request: answer with what is stored,
    // without notifying again.
    const { data: current } = await supabase
      .from("properties")
      .select("slug, is_public")
      .eq("id", property.id)
      .maybeSingle();
    if (current?.is_public && current.slug) {
      const { data: publishedAgency } = await supabase
        .from("agencies")
        .select("slug")
        .eq("id", property.agency_id)
        .maybeSingle();
      return {
        ok: true,
        data: {
          propertyId: property.id,
          propertySlug: current.slug,
          agencySlug: publishedAgency?.slug ?? "",
        },
      };
    }
    console.error("publishProperty: no row updated", { propertyId: property.id });
    return {
      ok: false,
      error: { code: "unknown", message: MSG.PUBLISH_FAILED },
    };
  }
  const publishedSlug = published.slug;

  // 4b) Notify matching leads (fire and forget)
  void sendMatchNotificationForProperty(
    {
      id:           property.id,
      title:        property.title,
      city:         (property as Record<string,unknown>).city as string | null ?? null,
      price_eur:    (property as Record<string,unknown>).price_eur as number | null ?? null,
      rooms:        (property as Record<string,unknown>).rooms as number | null ?? null,
      sqm:          (property as Record<string,unknown>).sqm as number | null ?? null,
      listing_type: (property as Record<string,unknown>).listing_type as string ?? "sale",
    },
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
    revalidatePath(`/${agencySlug}/immobili/${publishedSlug}`);
  }

  return {
    ok: true,
    data: {
      propertyId: property.id,
      propertySlug: publishedSlug,
      agencySlug,
    },
  };
}



