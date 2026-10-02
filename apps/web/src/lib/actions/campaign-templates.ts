"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per gestire i template.",
  NOT_FOUND: "Template non trovato.",
  SAVE_FAILED: "Salvataggio non riuscito. Riprova.",
  DELETE_FAILED: "Eliminazione non riuscita. Riprova.",
} as const;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export type CampaignTemplate = {
  id: string;
  name: string;
  body: string;
  createdAt: string;
};

async function resolveWriteAgencyId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", userId)
    .in("role", WRITE_ROLES as unknown as string[])
    .limit(1)
    .maybeSingle();
  return data?.agency_id ?? null;
}

/**
 * Template di messaggio riutilizzabili (§9), con variabili dinamiche
 * {{nome}}, {{cognome}}, {{nome_completo}} risolte in fase di invio
 * (vedi @/lib/campaigns/template-variables).
 */
export async function listCampaignTemplates(): Promise<CampaignTemplate[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) return [];

  const { data, error } = await supabase
    .from("campaign_templates")
    .select("id, name, body, created_at")
    .eq("agency_id", membership.agency_id)
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("listCampaignTemplates: query failed", error);
    return [];
  }

  return data.map((t) => ({
    id: t.id,
    name: t.name,
    body: t.body,
    createdAt: t.created_at,
  }));
}

const createTemplateSchema = z.object({
  name: z.string().trim().min(1, MSG.VALIDATION).max(120, MSG.VALIDATION),
  body: z.string().trim().min(1, MSG.VALIDATION).max(4000, MSG.VALIDATION),
});

export async function createCampaignTemplate(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = createTemplateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "validation_error", message: MSG.VALIDATION } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "unauthenticated", message: MSG.UNAUTHENTICATED } };
  }

  const agencyId = await resolveWriteAgencyId(supabase, user.id);
  if (!agencyId) {
    return { ok: false, error: { code: "forbidden", message: MSG.FORBIDDEN } };
  }

  const { data, error } = await supabase
    .from("campaign_templates")
    .insert({
      agency_id: agencyId,
      name: parsed.data.name,
      body: parsed.data.body,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("createCampaignTemplate: insert failed", error);
    return { ok: false, error: { code: "unknown", message: MSG.SAVE_FAILED } };
  }

  revalidatePath("/admin/marketing/campaigns/new");
  return { ok: true, data: { id: data.id } };
}

export async function deleteCampaignTemplate(
  templateId: string,
): Promise<ActionResult<{ id: string }>> {
  if (!templateId) {
    return { ok: false, error: { code: "validation_error", message: MSG.VALIDATION } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "unauthenticated", message: MSG.UNAUTHENTICATED } };
  }

  const agencyId = await resolveWriteAgencyId(supabase, user.id);
  if (!agencyId) {
    return { ok: false, error: { code: "forbidden", message: MSG.FORBIDDEN } };
  }

  const { data: existing } = await supabase
    .from("campaign_templates")
    .select("id")
    .eq("id", templateId)
    .eq("agency_id", agencyId)
    .maybeSingle();

  if (!existing) {
    return { ok: false, error: { code: "not_found", message: MSG.NOT_FOUND } };
  }

  const { error } = await supabase.from("campaign_templates").delete().eq("id", templateId);

  if (error) {
    console.error("deleteCampaignTemplate: delete failed", error);
    return { ok: false, error: { code: "unknown", message: MSG.DELETE_FAILED } };
  }

  revalidatePath("/admin/marketing/campaigns/new");
  return { ok: true, data: { id: templateId } };
}
