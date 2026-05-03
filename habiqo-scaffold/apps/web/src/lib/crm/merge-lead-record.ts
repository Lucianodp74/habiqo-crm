import type { LeadPriority, PipelineLead } from "@/lib/crm/pipeline";

function parsePriority(raw: unknown): LeadPriority {
  if (raw === "low" || raw === "medium" || raw === "high" || raw === "critical") return raw;
  return "medium";
}

function readString(row: Record<string, unknown>, key: string): string | null {
  const v = row[key];
  return typeof v === "string" ? v : null;
}

function readNumber(row: Record<string, unknown>, key: string): number | null {
  const v = row[key];
  return typeof v === "number" && !Number.isNaN(v) ? v : null;
}

function readStringArray(row: Record<string, unknown>, key: string): string[] {
  const v = row[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string");
}

/**
 * Maps a Realtime / PostgREST `leads` row into `PipelineLead`, merging onto `prev`
 * so assignee display names stay stable when only `assigned_to` id is unchanged.
 */
export function mergeLeadRecordIntoPipelineLead(
  raw: Record<string, unknown>,
  prev: PipelineLead | null,
): PipelineLead | null {
  const id = raw.id;
  if (typeof id !== "string" || id.length === 0) return null;

  const fullNameRaw = readString(raw, "full_name");
  const fullName =
    fullNameRaw && fullNameRaw.trim().length > 0
      ? fullNameRaw.trim()
      : (prev?.fullName ?? "Senza nome");

  const assignedTo = readString(raw, "assigned_to");
  const prevAssignee = prev?.assignedToId ?? null;
  const nextAssignee = assignedTo ?? null;
  const assignedToName = nextAssignee === prevAssignee ? (prev?.assignedToName ?? null) : null;

  const priorityRaw = readString(raw, "lead_priority") ?? readString(raw, "priority");

  return {
    id,
    fullName,
    phone: readString(raw, "phone"),
    whatsapp: readString(raw, "whatsapp"),
    email: readString(raw, "email"),
    budgetMinEur: readNumber(raw, "budget_min_eur"),
    budgetMaxEur: readNumber(raw, "budget_max_eur"),
    preferredZones: readStringArray(raw, "preferred_zones"),
    propertyType:
      readString(raw, "preferred_property_type") ??
      readString(raw, "property_type") ??
      prev?.propertyType ??
      null,
    leadPriority: parsePriority(priorityRaw),
    insightUrgency: prev?.insightUrgency ?? null,
    source: readString(raw, "source") ?? prev?.source ?? "manual",
    sourceDetail: readString(raw, "source_detail"),
    lastContactAt:
      readString(raw, "last_activity_at") ??
      readString(raw, "created_at") ??
      prev?.lastContactAt ??
      null,
    updatedAt: readString(raw, "updated_at") ?? prev?.updatedAt ?? null,
    assignedToId: nextAssignee,
    assignedToName,
    status: readString(raw, "status") ?? prev?.status ?? "new",
    temperature: readString(raw, "temperature") ?? prev?.temperature ?? "cold",
    aiScore: readNumber(raw, "ai_score") ?? prev?.aiScore ?? null,
  };
}
