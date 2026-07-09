"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

export async function addPropertyVisit(input: {
  propertyId: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  visitDate: string;
  visitTime: string | null;
  visitType: string;
  notes: string | null;
  outcome: string;
  leadId: string | null;
}): Promise<ActionResult<{ id: string }>> {
  if (!input.fullName || input.fullName.trim().length < 2) {
    return { ok: false, error: { code: "validation_error", message: "Nome obbligatorio" } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "unauthenticated", message: "Sessione scaduta" } };
  }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return { ok: false, error: { code: "forbidden", message: "Nessuna agenzia trovata" } };
  }

  const { data, error } = await supabase
    .from("property_visits")
    .insert({
      property_id: input.propertyId,
      agency_id: membership.agency_id,
      full_name: input.fullName.trim(),
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      visit_date: input.visitDate,
      visit_time: input.visitTime || null,
      visit_type: input.visitType,
      notes: input.notes?.trim() || null,
      outcome: input.outcome,
      lead_id: input.leadId || null,
      agent_id: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: { code: "db_error", message: "Impossibile salvare" } };
  }

  revalidatePath(`/admin/properties/${input.propertyId}/photos`);
  return { ok: true, data: { id: data.id } };
}

export async function deletePropertyVisit(input: {
  visitId: string;
  propertyId: string;
}): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "unauthenticated", message: "Sessione scaduta" } };
  }

  const { error } = await supabase
    .from("property_visits")
    .delete()
    .eq("id", input.visitId);

  if (error) {
    return { ok: false, error: { code: "db_error", message: "Impossibile eliminare" } };
  }

  revalidatePath(`/admin/properties/${input.propertyId}/photos`);
  return { ok: true, data: { id: input.visitId } };
}