import type { LeadPriority, PipelineLead } from "@/lib/crm/pipeline";
import { listLeadEventsForLead } from "@/lib/queries/lead-events";
import { createClient } from "@/lib/supabase/server";

type DbLead = Record<string, unknown> & {
  id: string;
  full_name: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  budget_min_eur: number | null;
  budget_max_eur: number | null;
  preferred_zones: string[] | null;
  preferred_property_type?: string | null;
  lead_priority?: string | null;
  source: string;
  source_detail: string | null;
  last_activity_at: string | null;
  updated_at: string | null;
  created_at: string | null;
  assigned_to: string | null;
  status: string | null;
  temperature: string | null;
  ai_score: number | null;
};

function parsePriority(raw: string | null | undefined): LeadPriority {
  if (raw === "low" || raw === "medium" || raw === "high" || raw === "critical") return raw;
  return "medium";
}

function mapDbLead(
  row: DbLead,
  assigneeName: string | null,
  insightUrgency: string | null,
): PipelineLead {
  return {
    id: row.id,
    fullName: row.full_name?.trim() || "Senza nome",
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    budgetMinEur: row.budget_min_eur,
    budgetMaxEur: row.budget_max_eur,
    preferredZones: row.preferred_zones ?? [],
    propertyType: row.preferred_property_type ?? null,
    leadPriority: parsePriority(row.lead_priority),
    insightUrgency,
    source: row.source ?? "manual",
    sourceDetail: row.source_detail,
    lastContactAt: row.last_activity_at ?? row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
    assignedToId: row.assigned_to,
    assignedToName: assigneeName,
    status: row.status ?? "new",
    temperature: row.temperature ?? "cold",
    aiScore: row.ai_score ?? null,
  };
}

async function enrichLeads(supabase: Awaited<ReturnType<typeof createClient>>, rows: DbLead[]) {
  if (!rows.length) return [];

  const assignIds = [...new Set(rows.map((r) => r.assigned_to).filter(Boolean))] as string[];
  const leadIds = rows.map((r) => r.id);

  const [profilesRes, insightsRes] = await Promise.all([
    assignIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", assignIds)
      : Promise.resolve({ data: [] as { id: string; full_name: string | null }[] }),
    leadIds.length
      ? supabase.from("lead_insights").select("lead_id, urgency_level").in("lead_id", leadIds)
      : Promise.resolve({ data: [] as { lead_id: string; urgency_level: string | null }[] }),
  ]);

  const nameByUserId = Object.fromEntries(
    (profilesRes.data ?? []).map((p) => [p.id, p.full_name?.trim() || null]),
  );
  const urgencyByLeadId = Object.fromEntries(
    (insightsRes.data ?? []).map((i) => [i.lead_id, i.urgency_level]),
  );

  return rows.map((row) =>
    mapDbLead(
      row,
      row.assigned_to ? (nameByUserId[row.assigned_to] ?? null) : null,
      urgencyByLeadId[row.id] ?? null,
    ),
  );
}

export async function listLeadsForAgency(): Promise<PipelineLead[]> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("SUPABASE ERROR:", error.message);
    return [];
  }

  return enrichLeads(supabase, (rows ?? []) as DbLead[]);
}

export async function getLeadByIdForAgency(id: string): Promise<PipelineLead | null> {
  const supabase = await createClient();

  const { data: row, error } = await supabase.from("leads").select("*").eq("id", id).single();

  if (error || !row) {
    return null;
  }

  const [enriched] = await enrichLeads(supabase, [row as DbLead]);
  return enriched ?? null;
}

/** Shape expected by `api/ai/insights` — kept separate from CRM pipeline mapping. */
export async function getLeadById(id: string): Promise<{
  id: string;
  agencyId: string;
  fullName: string;
  status: string;
  source: string;
  budgetMinEur: number | null;
  budgetMaxEur: number | null;
  preferredZones: string[];
  tags: string[];
  createdAt: Date;
} | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("leads").select("*").eq("id", id).single();
  if (error || !data) return null;
  return {
    id: data.id,
    agencyId: data.agency_id,
    fullName: data.full_name ?? "",
    status: data.status,
    source: data.source,
    budgetMinEur: data.budget_min_eur,
    budgetMaxEur: data.budget_max_eur,
    preferredZones: data.preferred_zones ?? [],
    tags: (data.tags as string[]) ?? [],
    createdAt: new Date(data.created_at),
  };
}

export async function listEventsForLead(leadId: string) {
  const rows = await listLeadEventsForLead(leadId);
  return rows.map((e) => ({
    type: e.type,
    title: e.title,
    detail: e.detail,
    occurredAt: new Date(e.occurredAt),
  }));
}
