"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export type CreateRenovationLeadInput = {
  previewId: string;
  fullName: string;
  phone: string;
  email?: string;
};

export type CreateRenovationLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

export async function createRenovationLead(
  input: CreateRenovationLeadInput
): Promise<CreateRenovationLeadResult> {
  if (!input.fullName?.trim() || input.fullName.trim().length < 2)
    return { ok: false, error: "Inserisci il nome completo." };
  if (!input.phone?.trim())
    return { ok: false, error: "Inserisci il numero di telefono." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sessione scaduta." };

  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!member?.agency_id) return { ok: false, error: "Agenzia non trovata." };

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .insert({
      agency_id: member.agency_id,
      full_name: input.fullName.trim(),
      phone:     input.phone.trim(),
      email:     input.email?.trim() || null,
      source:    "manual",
      notes:     "Lead acquisito tramite Valorizza Casa AI",
    })
    .select("id")
    .single();

  if (leadError || !lead) {
    console.error("[createRenovationLead] ERRORE:", leadError?.code, leadError?.message);
    return { ok: false, error: `Errore: ${leadError?.message ?? "sconosciuto"}` };
  }

  await supabaseAdmin
    .from("renovation_previews")
    .update({ lead_id: lead.id })
    .eq("id", input.previewId);

  return { ok: true, leadId: lead.id };
}
