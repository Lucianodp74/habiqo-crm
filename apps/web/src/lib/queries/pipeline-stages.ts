import { createClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────

export type PipelineStage = {
  id: string;
  agencyId: string;
  name: string;
  shortLabel: string | null;
  color: string;
  sortOrder: number;
  isSystem: boolean;
  statusKey: string | null;
  automationEnabled: boolean;
  automationConfig: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

type DbRow = {
  id: string;
  agency_id: string;
  name: string;
  short_label: string | null;
  color: string;
  sort_order: number;
  is_system: boolean;
  status_key: string | null;
  automation_enabled: boolean;
  automation_config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function mapRow(row: DbRow): PipelineStage {
  return {
    id: row.id,
    agencyId: row.agency_id,
    name: row.name,
    shortLabel: row.short_label,
    color: row.color,
    sortOrder: row.sort_order,
    isSystem: row.is_system,
    statusKey: row.status_key,
    automationEnabled: row.automation_enabled,
    automationConfig: row.automation_config,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getPipelineStages(): Promise<PipelineStage[] | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Use limit(1) array form — avoids .single() crash with multiple memberships.
  const { data: memberships } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  const agencyId = memberships?.[0]?.agency_id;
  if (!agencyId) return null;

  const { data, error } = await supabase
    .from("pipeline_stages")
    .select(
      "id, agency_id, name, short_label, color, sort_order, is_system, status_key, automation_enabled, automation_config, created_at, updated_at",
    )
    .eq("agency_id", agencyId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getPipelineStages]", error.message);
    return null;
  }

  return (data ?? []).map(mapRow);
}

export async function getPipelineStagesForAgency(
  agencyId: string,
): Promise<PipelineStage[] | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("pipeline_stages")
    .select(
      "id, agency_id, name, short_label, color, sort_order, is_system, status_key, automation_enabled, automation_config, created_at, updated_at",
    )
    .eq("agency_id", agencyId)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getPipelineStagesForAgency]", error.message);
    return null;
  }

  return (data ?? []).map(mapRow);
}
