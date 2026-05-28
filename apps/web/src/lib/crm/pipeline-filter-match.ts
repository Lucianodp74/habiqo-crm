import type { PipelineFilterValues } from "@/components/crm/pipeline-filters";
import type { PipelineLead } from "@/lib/crm/pipeline";
import { filterStatusToDbStatus } from "@/lib/crm/pipeline-analytics";

/** Same rules as `PipelineShell` filtered list — keep CRM board + realtime INSERT in sync with filters. */
export function leadMatchesPipelineFilters(
  lead: PipelineLead,
  filterValues: PipelineFilterValues,
): boolean {
  if (filterValues.q.trim()) {
    const s = filterValues.q.toLowerCase().trim();
    const match =
      lead.fullName.toLowerCase().includes(s) ||
      lead.email?.toLowerCase().includes(s) ||
      (lead.phone?.includes(s) ?? false) ||
      (lead.whatsapp?.includes(s) ?? false);
    if (!match) return false;
  }
  if (filterValues.agentId && lead.assignedToId !== filterValues.agentId) return false;
  if (filterValues.source && lead.source !== filterValues.source) return false;
  if (filterValues.status) {
    const db = filterStatusToDbStatus(filterValues.status);
    if (lead.status !== db) return false;
  }
  if (filterValues.city.trim()) {
    const c = filterValues.city.toLowerCase().trim();
    if (!lead.preferredZones.some((z) => z.toLowerCase().includes(c))) return false;
  }
  if (
    filterValues.budgetMin != null &&
    (lead.budgetMaxEur == null || lead.budgetMaxEur < filterValues.budgetMin)
  ) {
    return false;
  }
  if (
    filterValues.budgetMax != null &&
    (lead.budgetMinEur == null || lead.budgetMinEur > filterValues.budgetMax)
  ) {
    return false;
  }
  return true;
}
