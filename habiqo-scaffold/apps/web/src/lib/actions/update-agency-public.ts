"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

/**
 * Slug format mirror of the CHECK constraint in migration 0012:
 * 1-60 chars, lowercase alphanumeric and dashes,
 * no leading/trailing dashes.
 */
const SLUG_REGEX = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])?$/;

/**
 * Slugs reserved for app routes. Static routes in Next.js win over the
 * dynamic [agencySlug] catch-all, so setting one of these as an agency slug
 * would mean the public site is unreachable at /<slug>. We block it at the
 * application layer to give a clear error message rather than silent failure.
 */
const RESERVED_SLUGS = new Set([
  "_next",
  "accept-invite",
  "admin",
  "api",
  "app",
  "auth",
  "blog",
  "contact",
  "crm",
  "dashboard",
  "docs",
  "error",
  "favicon",
  "features",
  "habiqo",
  "habiquo",
  "habita",
  "help",
  "login",
  "logout",
  "not-found",
  "pricing",
  "privacy",
  "profile",
  "public",
  "recupero-password",
  "register",
  "registrazione",
  "settings",
  "signin",
  "signup",
  "static",
  "support",
  "terms",
]);

/**
 * Schema mirrors what the form sends. Empty strings are normalized to null
 * so the DB stores either a meaningful value or NULL (no `""` rows).
 */
const updateAgencyPublicSchema = z.object({
  agencyId: z.string().uuid(),
  isPublic: z.boolean(),
  slug: z
    .string()
    .max(60)
    .nullish()
    .transform((v) => {
      const t = v?.trim().toLowerCase();
      return t && t.length > 0 ? t : null;
    }),
  tagline: z
    .string()
    .max(200)
    .nullish()
    .transform((v) => {
      const t = v?.trim();
      return t && t.length > 0 ? t : null;
    }),
  description: z
    .string()
    .max(2000)
    .nullish()
    .transform((v) => {
      const t = v?.trim();
      return t && t.length > 0 ? t : null;
    }),
  city: z
    .string()
    .max(100)
    .nullish()
    .transform((v) => {
      const t = v?.trim();
      return t && t.length > 0 ? t : null;
    }),
  region: z
    .string()
    .max(100)
    .nullish()
    .transform((v) => {
      const t = v?.trim();
      return t && t.length > 0 ? t : null;
    }),
  phone: z
    .string()
    .max(50)
    .nullish()
    .transform((v) => {
      const t = v?.trim();
      return t && t.length > 0 ? t : null;
    }),
});

export type UpdateAgencyPublicInput = z.input<typeof updateAgencyPublicSchema>;
export type UpdateAgencyPublicData = z.output<typeof updateAgencyPublicSchema>;

const MSG = {
  VALIDATION: "Dati non validi. Controlla i campi e riprova.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN:
    "Solo owner e admin possono modificare le impostazioni pubbliche dell'agenzia.",
  SLUG_FORMAT:
    "Lo slug può contenere solo lettere minuscole, numeri e trattini (1-60 caratteri, no trattini iniziali o finali).",
  SLUG_RESERVED:
    "Questo slug è riservato dal sistema e non può essere usato.",
  SLUG_TAKEN:
    "Questo slug è già in uso da un'altra agenzia. Scegline un altro.",
  PUBLIC_REQUIRES_SLUG:
    "Per rendere pubblico il sito devi prima impostare uno slug valido.",
  UNKNOWN: "Si è verificato un errore imprevisto. Riprova.",
} as const;

export async function updateAgencyPublic(
  input: UpdateAgencyPublicInput,
): Promise<
  ActionResult<{ id: string; slug: string | null; isPublic: boolean }>
> {
  // 1) Schema validation
  const parsed = updateAgencyPublicSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: MSG.VALIDATION,
        fields: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const data = parsed.data;

  // 2) Slug-specific validation (format + reserved). Empty/null slugs skip.
  if (data.slug !== null) {
    if (!SLUG_REGEX.test(data.slug)) {
      return {
        ok: false,
        error: {
          code: "validation_error",
          message: MSG.SLUG_FORMAT,
          fields: { slug: [MSG.SLUG_FORMAT] },
        },
      };
    }
    if (RESERVED_SLUGS.has(data.slug)) {
      return {
        ok: false,
        error: {
          code: "validation_error",
          message: MSG.SLUG_RESERVED,
          fields: { slug: [MSG.SLUG_RESERVED] },
        },
      };
    }
  }

  // 3) Consistency: public requires slug. Mirror of DB check constraint.
  if (data.isPublic && data.slug === null) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: MSG.PUBLIC_REQUIRES_SLUG,
        fields: { slug: [MSG.PUBLIC_REQUIRES_SLUG] },
      },
    };
  }

  // 4) Auth
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

  // 5) Role check: only owner/admin can edit public settings.
  // RLS additionally enforces membership, but we check role explicitly
  // here so the error message tells the user *why* they can't update.
  const { data: membership, error: membershipError } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", data.agencyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      ok: false,
      error: { code: "forbidden", message: MSG.FORBIDDEN },
    };
  }
  if (membership.role !== "owner" && membership.role !== "admin") {
    return {
      ok: false,
      error: { code: "forbidden", message: MSG.FORBIDDEN },
    };
  }

  // 6) Update. RLS enforces the user is a member of this agency.
  const { error: updateError } = await supabase
    .from("agencies")
    .update({
      slug: data.slug,
      is_public: data.isPublic,
      tagline: data.tagline,
      description: data.description,
      city: data.city,
      region: data.region,
      phone: data.phone,
    })
    .eq("id", data.agencyId);

  if (updateError) {
    // 23505 = Postgres unique constraint violation (slug collision).
    if (updateError.code === "23505") {
      return {
        ok: false,
        error: {
          code: "validation_error",
          message: MSG.SLUG_TAKEN,
          fields: { slug: [MSG.SLUG_TAKEN] },
        },
      };
    }
    return {
      ok: false,
      error: { code: "unknown", message: MSG.UNKNOWN },
    };
  }

  // 7) Revalidate the relevant paths so the admin page re-reads and the
  // public site picks up the change immediately.
  revalidatePath("/admin/agency");
  if (data.slug) {
    revalidatePath(`/${data.slug}`);
    revalidatePath(`/${data.slug}/immobili`);
  }

  return {
    ok: true,
    data: {
      id: data.agencyId,
      slug: data.slug,
      isPublic: data.isPublic,
    },
  };
}
