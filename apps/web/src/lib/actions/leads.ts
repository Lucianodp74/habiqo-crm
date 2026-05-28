"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

const leadStatus = z.enum(["new", "qualified", "in_negotiation", "won", "lost"]);

const updateLeadSchema = z.object({
  id: z.string().uuid(),
  status: leadStatus.optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  preferredCity: z.string().max(100).nullable().optional(),
  preferredListingType: z.enum(["sale", "rent"]).nullable().optional(),
  preferredRoomsMin: z.number().int().min(1).max(20).nullable().optional(),
  preferredSqmMin: z.number().int().min(1).max(1000).nullable().optional(),
});

export async function updateLead(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = updateLeadSchema.safeParse(input);
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

  const { id, assignedTo, preferredCity, preferredListingType, preferredRoomsMin, preferredSqmMin, ...rest } = parsed.data;
  const updates: Record<string, unknown> = { ...rest };
  if (assignedTo !== undefined) updates.assigned_to = assignedTo;
  if (parsed.data.preferredCity !== undefined) updates.preferred_city = parsed.data.preferredCity;
  if (parsed.data.preferredListingType !== undefined) updates.preferred_listing_type = parsed.data.preferredListingType;
  if (parsed.data.preferredRoomsMin !== undefined) updates.preferred_rooms_min = parsed.data.preferredRoomsMin;
  if (parsed.data.preferredSqmMin !== undefined) updates.preferred_sqm_min = parsed.data.preferredSqmMin;

  // RLS enforces agency scope. We never set agency_id from the client.
  const { error } = await supabase.from("leads").update(updates).eq("id", id);

  if (error) {
    if (error.code === "PGRST116") {
      return { ok: false, error: { code: "not_found", message: "Lead non trovato" } };
    }
    return { ok: false, error: { code: "db_error", message: "Aggiornamento non riuscito" } };
  }

  revalidatePath(`/crm/leads/${id}`);
  revalidatePath("/crm");
  revalidateTag(`lead-${id}`, 'max');

  return { ok: true, data: { id } };
}

const createLeadSchema = z.object({
  fullName: z.string().min(2).max(200),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  source: z.enum(["valuation", "portal", "manual", "referral", "website", "whatsapp"]),
  budgetMinEur: z.number().int().min(0).nullable().optional(),
  budgetMaxEur: z.number().int().min(0).nullable().optional(),
  preferredZones: z.array(z.string().max(80)).max(20).optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export async function createLead(input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = createLeadSchema.safeParse(input);
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

  // The agency_id is filled in by a trigger / default policy that reads
  // from the JWT claim `active_agency_id`. We never set it from the client.
  const { data, error } = await supabase
    .from("leads")
    .insert({
      full_name: parsed.data.fullName,
      email: parsed.data.email ?? null,
      phone: parsed.data.phone ?? null,
      source: parsed.data.source,
      budget_min_eur: parsed.data.budgetMinEur ?? null,
      budget_max_eur: parsed.data.budgetMaxEur ?? null,
      preferred_zones: parsed.data.preferredZones ?? [],
      notes: parsed.data.notes ?? null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: { code: "db_error", message: "Creazione non riuscita" } };
  }

  revalidatePath("/crm");
  return { ok: true, data: { id: data.id } };
}


