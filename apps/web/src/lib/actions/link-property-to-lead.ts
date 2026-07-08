"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

export async function linkPropertyToLead(input: {
  leadId: string;
  propertyId: string | null;
}): Promise<ActionResult<{ leadId: string }>> {
  if (!input.leadId) {
    return { ok: false, error: { code: "validation_error", message: "Lead ID mancante" } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "unauthenticated", message: "Sessione scaduta" } };
  }

  const { error } = await supabase
    .from("leads")
    .update({ source_property_id: input.propertyId })
    .eq("id", input.leadId);

  if (error) {
    return { ok: false, error: { code: "db_error", message: "Impossibile collegare l'immobile" } };
  }

  revalidatePath(`/crm/leads/${input.leadId}`);
  return { ok: true, data: { leadId: input.leadId } };
}