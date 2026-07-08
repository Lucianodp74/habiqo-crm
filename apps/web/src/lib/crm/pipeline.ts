/**
 * CRM pipeline domain: column definitions and DB status mapping.
 * DB enum uses `in_negotiation`; the board uses column id `negotiation`.
 *
 * Sprint 1 addition: PipelineColumnDynamic + helpers to build column
 * lists from DB pipeline_stages rows. All existing exports are
 * unchanged — zero regresssions.
 */

// ─── Static types (unchanged) ─────────────────────────────────────

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
  preferredCity: string | null;
  preferredListingType: string | null;
  preferredRoomsMin: number | null;
  preferredSqmMin: number | null;
  sourcePropertyId: string | null;
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

// ─── Sprint 1 addition: Dynamic column support ────────────────────
//
// PipelineColumnDynamic is the runtime representation of a DB stage.
// It coexists with the static PipelineColumnMeta above.
// The board accepts either; it falls back to PIPELINE_COLUMNS when
// no dynamic columns are supplied.

export type PipelineColumnDynamic = {
  /** UUID from pipeline_stages.id */
  id: string;
  /** Display label (agency-customised or default) */
  label: string;
  shortLabel: string;
  color: string;
  isSystem: boolean;
  /**
   * For system stages: the PipelineColumnId this maps to.
   * Used to route leads from leads.status → correct column.
   * null for custom stages.
   */
  statusKey: PipelineColumnId | null;
  sortOrder: number;
};

/**
 * Convert DB pipeline_stages rows (from getPipelineStages()) into
 * PipelineColumnDynamic[] for use by the board.
 *
 * import type { PipelineStage } from "@/lib/queries/pipeline-stages";
 * (kept as unknown here to avoid circular deps at the lib layer)
 */
export function mapStagesToDynamicColumns(
  stages: Array<{
    id: string;
    name: string;
    shortLabel: string | null;
    color: string;
    isSystem: boolean;
    statusKey: string | null;
    sortOrder: number;
  }>,
): PipelineColumnDynamic[] {
  return stages.map((s) => ({
    id: s.id,
    label: s.name,
    shortLabel: s.shortLabel ?? s.name.slice(0, 6),
    color: s.color,
    isSystem: s.isSystem,
    statusKey:
      s.statusKey && isPipelineColumnId(s.statusKey)
        ? s.statusKey
        : s.statusKey === "in_negotiation"
          ? "negotiation"
          : null,
    sortOrder: s.sortOrder,
  }));
}

/**
 * Build column items map for dynamic columns.
 * Falls back to statusToColumnId() for system stages;
 * custom stages start empty (leads aren't assigned to custom stages yet).
 */
export function buildColumnItemsFromLeadsDynamic(
  leads: PipelineLead[],
  columns: PipelineColumnDynamic[],
): Record<string, string[]> {
  const empty = columns.reduce(
    (acc, col) => {
      acc[col.id] = [];
      return acc;
    },
    {} as Record<string, string[]>,
  );

  // Build a lookup: statusKey → column uuid
  const statusToColId = new Map<string, string>();
  for (const col of columns) {
    if (col.statusKey) {
      statusToColId.set(col.statusKey, col.id);
      // Also map the DB enum value for in_negotiation
      if (col.statusKey === "negotiation") {
        statusToColId.set("in_negotiation", col.id);
      }
    }
  }

  for (const lead of leads) {
    const canonicalColId = statusToColumnId(lead.status); // PipelineColumnId
    const dynamicId = statusToColId.get(canonicalColId) ?? statusToColId.get(lead.status);
    if (dynamicId && dynamicId in empty) {
      (empty[dynamicId] as string[]).push(lead.id);
    } else {
      // Fallback: put in first system column (new)
      const fallback = statusToColId.get("new");
      if (fallback && fallback in empty) (empty[fallback] as string[]).push(lead.id);
    }
  }

  return empty;
}

/**
 * Find which dynamic column contains a lead.
 */
export function findLeadColumnDynamic(
  items: Record<string, string[]>,
  leadId: string,
): string | undefined {
  for (const [colId, leadIds] of Object.entries(items)) {
    if (leadIds.includes(leadId)) return colId;
  }
  return undefined;
}

/**
 * Given a dynamic column id (UUID), return the DB status value
 * to persist in leads.status. Returns null for custom stages
 * (custom stages don't map to a lead_status enum value yet).
 */
export function dynamicColumnIdToDbStatus(
  colId: string,
  columns: PipelineColumnDynamic[],
): string | null {
  const col = columns.find((c) => c.id === colId);
  if (!col?.statusKey) return null;
  return columnIdToDbStatus(col.statusKey);
}
