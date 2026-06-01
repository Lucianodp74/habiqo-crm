"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Validation schemas ───────────────────────────────────────────

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Colore non valido (usa formato #RRGGBB)");

const upsertStageSchema = z.object({
  /** Present for updates, absent for creates. */
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(60),
  shortLabel: z.string().max(12).nullable().optional(),
  color: hexColor,
  sortOrder: z.number().int().min(0),
});

const reorderSchema = z.object({
  /** Ordered array of stage IDs representing the new sort order. */
  orderedIds: z.array(z.string().uuid()).min(1).max(50),
});

const deleteStageSchema = z.object({
  id: z.string().uuid(),
});

// ─── Helpers ─────────────────────────────────────────────────────

async function resolveAgencyId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"])
    .limit(1)
    .single();

  return data?.agency_id ?? null;
}

// ─── Actions ─────────────────────────────────────────────────────

/**
 * Create or update a pipeline stage.
 * - For system stages: only name, shortLabel, color and sortOrder may change.
 * - For custom stages: all fields are writable.
 * - Create: id absent → new custom stage.
 */
export async function upsertPipelineStage(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = upsertStageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: "Dati non validi",
        fields: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "unauthenticated", message: "Sessione scaduta" } };
  }

  const agencyId = await resolveAgencyId(supabase, user.id);
  if (!agencyId) {
    return { ok: false, error: { code: "forbidden", message: "Accesso negato" } };
  }

  const { id, name, shortLabel, color, sortOrder } = parsed.data;

  if (id) {
    // UPDATE — verify ownership and that we're not changing system fields
    const { data: existing, error: fetchErr } = await supabase
      .from("pipeline_stages")
      .select("id, is_system, agency_id")
      .eq("id", id)
      .eq("agency_id", agencyId)
      .single();

    if (fetchErr || !existing) {
      return { ok: false, error: { code: "not_found", message: "Stage non trovato" } };
    }

    const { error } = await supabase
      .from("pipeline_stages")
      .update({
        name,
        short_label: shortLabel ?? null,
        color,
        sort_order: sortOrder,
      })
      .eq("id", id)
      .eq("agency_id", agencyId);

    if (error) {
      console.error("[upsertPipelineStage update]", error);
      return { ok: false, error: { code: "db_error", message: "Aggiornamento non riuscito" } };
    }

    revalidatePath("/crm/leads");
    revalidatePath("/admin/pipeline");
    return { ok: true, data: { id } };
  }

  // CREATE — custom stage only
  const { data: inserted, error } = await supabase
    .from("pipeline_stages")
    .insert({
      agency_id: agencyId,
      name,
      short_label: shortLabel ?? null,
      color,
      sort_order: sortOrder,
      is_system: false,
      automation_enabled: false,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("[upsertPipelineStage insert]", error);
    return { ok: false, error: { code: "db_error", message: "Creazione non riuscita" } };
  }

  revalidatePath("/crm/leads");
  revalidatePath("/admin/pipeline");
  return { ok: true, data: { id: inserted.id } };
}

/**
 * Bulk-update sort_order for an agency's stages.
 * orderedIds: full ordered array of stage IDs (all stages, not just changed ones).
 */
export async function reorderPipelineStages(
  input: unknown,
): Promise<ActionResult<Record<string, never>>> {
  const parsed = reorderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: "Ordine non valido",
        fields: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "unauthenticated", message: "Sessione scaduta" } };
  }

  const agencyId = await resolveAgencyId(supabase, user.id);
  if (!agencyId) {
    return { ok: false, error: { code: "forbidden", message: "Accesso negato" } };
  }

  const { orderedIds } = parsed.data;

  // Update each stage's sort_order in parallel.
  // RLS ensures we can only touch our own agency's stages.
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("pipeline_stages")
      .update({ sort_order: index })
      .eq("id", id)
      .eq("agency_id", agencyId),
  );

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    console.error("[reorderPipelineStages]", failed.error);
    return { ok: false, error: { code: "db_error", message: "Riordino non riuscito" } };
  }

  revalidatePath("/crm/leads");
  revalidatePath("/admin/pipeline");
  return { ok: true, data: {} as Record<string, never> };
}

/**
 * Delete a custom stage. System stages cannot be deleted.
 * Application-layer guard (RLS also blocks is_system = true deletion).
 */
export async function deletePipelineStage(
  input: unknown,
): Promise<ActionResult<Record<string, never>>> {
  const parsed = deleteStageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "validation_error", message: "ID non valido" } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "unauthenticated", message: "Sessione scaduta" } };
  }

  const agencyId = await resolveAgencyId(supabase, user.id);
  if (!agencyId) {
    return { ok: false, error: { code: "forbidden", message: "Accesso negato" } };
  }

  const { id } = parsed.data;

  // Check it exists, belongs to agency, and is not a system stage.
  const { data: existing } = await supabase
    .from("pipeline_stages")
    .select("id, is_system")
    .eq("id", id)
    .eq("agency_id", agencyId)
    .single();

  if (!existing) {
    return { ok: false, error: { code: "not_found", message: "Stage non trovato" } };
  }
  if (existing.is_system) {
    return {
      ok: false,
      error: { code: "forbidden", message: "Gli stage di sistema non possono essere eliminati" },
    };
  }

  const { error } = await supabase
    .from("pipeline_stages")
    .delete()
    .eq("id", id)
    .eq("agency_id", agencyId)
    .eq("is_system", false); // double guard

  if (error) {
    console.error("[deletePipelineStage]", error);
    return { ok: false, error: { code: "db_error", message: "Eliminazione non riuscita" } };
  }

  revalidatePath("/crm/leads");
  revalidatePath("/admin/pipeline");
  return { ok: true, data: {} as Record<string, never> };
}
