"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Il codice non può superare 40 caratteri.",
  UNAUTHENTICATED: "Sessione scaduta.",
  FORBIDDEN: "Non hai i permessi per modificare questo immobile.",
  PROPERTY_NOT_FOUND: "Immobile non trovato.",
  UPDATE_FAILED: "Impossibile salvare il codice immobile.",
} as const;

type UpdateCodeResult = ActionResult<{ internalCode: string | null }>;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export async function updatePropertyInternalCode(input: {
  propertyId: string;
  internalCode: string;
}): Promise<UpdateCodeResult> {
  // Campo libero: trim e limite di lunghezza ragionevole, nessun altro vincolo
  // di formato — l'agenzia decide la propria convenzione (es. TA-001, SGI-12).
  const trimmed = input.internalCode.trim();

  if (trimmed.length > 40) {
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

  // Stringa vuota -> NULL, per non sporcare il DB con valori vuoti.
  const valueToSave = trimmed.length > 0 ? trimmed : null;

  const { error: updateError } = await supabase
    .from("properties")
    .update({ internal_code: valueToSave })
    .eq("id", property.id);

  if (updateError) {
    return {
      ok: false,
      error: { code: "unknown", message: MSG.UPDATE_FAILED },
    };
  }

  revalidatePath(`/admin/properties/${property.id}/photos`);
  revalidatePath("/admin/properties");

  return { ok: true, data: { internalCode: valueToSave } };
}
