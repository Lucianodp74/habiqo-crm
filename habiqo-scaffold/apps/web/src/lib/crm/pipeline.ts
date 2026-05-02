/**
 * CRM pipeline domain: column definitions and DB status mapping.
 * DB enum uses `in_negotiation`; the board uses column id `negotiation`.
 */

export const PIPELINE_COLUMN_IDS = [
  "new",
  "qualified",
  "visit_scheduled",
  "negotiation",
  "won",
  "lost",
] as const;

export type PipelineColumnId = (typeof PIPELINE_COLUMN_IDS)[number];

export type PipelineColumnMeta = {
  id: PipelineColumnId;
  label: string;
  shortLabel: string;
};

export const PIPELINE_COLUMNS: readonly PipelineColumnMeta[] = [
  { id: "new", label: "Nuovi", shortLabel: "Nuovi" },
  { id: "qualified", label: "Qualificati", shortLabel: "OK" },
  { id: "visit_scheduled", label: "Visita", shortLabel: "Visita" },
  { id: "negotiation", label: "Trattativa", shortLabel: "Tratt." },
  { id: "won", label: "Vinti", shortLabel: "Vinti" },
  { id: "lost", label: "Persi", shortLabel: "Persi" },
] as const;

export type LeadPriority = "low" | "medium" | "high" | "critical";

export type PipelineLead = {
  id: string;
  fullName: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  budgetMinEur: number | null;
  budgetMaxEur: number | null;
  preferredZones: string[];
  propertyType: string | null;
  leadPriority: LeadPriority;
  insightUrgency: string | null;
  source: string;
  sourceDetail: string | null;
  lastContactAt: string | null;
  updatedAt: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  status: string;
  temperature: string;
  aiScore: number | null;
};

const COLUMN_SET = new Set<string>(PIPELINE_COLUMN_IDS);

export function isPipelineColumnId(id: string): id is PipelineColumnId {
  return COLUMN_SET.has(id);
}

/** Map stored Supabase status to the Kanban column id. */
export function statusToColumnId(status: string): PipelineColumnId {
  if (status === "in_negotiation") return "negotiation";
  if (isPipelineColumnId(status)) return status;
  return "new";
}

/** Map Kanban column id to value persisted in `leads.status`. */
export function columnIdToDbStatus(columnId: PipelineColumnId): string {
  if (columnId === "negotiation") return "in_negotiation";
  return columnId;
}

export function buildColumnItemsFromLeads(
  leads: PipelineLead[],
): Record<PipelineColumnId, string[]> {
  const empty = PIPELINE_COLUMN_IDS.reduce(
    (acc, id) => {
      acc[id] = [];
      return acc;
    },
    {} as Record<PipelineColumnId, string[]>,
  );

  for (const lead of leads) {
    const col = statusToColumnId(lead.status);
    empty[col].push(lead.id);
  }

  return empty;
}

export function findLeadColumn(
  items: Record<PipelineColumnId, string[]>,
  leadId: string,
): PipelineColumnId | undefined {
  for (const col of PIPELINE_COLUMN_IDS) {
    if (items[col].includes(leadId)) return col;
  }
  return undefined;
}

export function findContainerForDnd(
  items: Record<PipelineColumnId, string[]>,
  id: string,
): PipelineColumnId | undefined {
  if (isPipelineColumnId(id)) return id;
  return findLeadColumn(items, id);
}
