"use client";

import type { PipelineLead } from "@/lib/crm/pipeline";
import { computePipelineStats, filterStatusToDbStatus } from "@/lib/crm/pipeline-analytics";
import type { AgencyAgentOption } from "@/lib/queries/agency-members";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useCallback, useMemo } from "react";
import { PipelineAnalyticsBar } from "./pipeline-analytics-bar";
import { PipelineBoard } from "./pipeline-board";
import { type PipelineFilterValues, PipelineFilters } from "./pipeline-filters";

type Props = {
  initialLeads: PipelineLead[];
  agents: AgencyAgentOption[];
};

export function PipelineShell({ initialLeads, agents }: Props) {
  const [query, setQuery] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      agentId: parseAsString.withDefault(""),
      budgetMin: parseAsInteger,
      budgetMax: parseAsInteger,
      city: parseAsString.withDefault(""),
      source: parseAsString.withDefault(""),
      status: parseAsString.withDefault(""),
    },
    { history: "replace", shallow: true },
  );

  const filterValues: PipelineFilterValues = useMemo(
    () => ({
      q: query.q,
      agentId: query.agentId,
      budgetMin: query.budgetMin ?? null,
      budgetMax: query.budgetMax ?? null,
      city: query.city,
      source: query.source,
      status: query.status,
    }),
    [query],
  );

  const onFilterChange = useCallback(
    (patch: Partial<PipelineFilterValues>) => {
      const next: PipelineFilterValues = { ...filterValues, ...patch };
      setQuery({
        q: next.q || null,
        agentId: next.agentId || null,
        budgetMin: next.budgetMin,
        budgetMax: next.budgetMax,
        city: next.city || null,
        source: next.source || null,
        status: next.status || null,
      });
    },
    [filterValues, setQuery],
  );

  const stats = useMemo(() => computePipelineStats(initialLeads), [initialLeads]);

  const filteredLeads = useMemo(() => {
    return initialLeads.filter((lead) => {
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
    });
  }, [initialLeads, filterValues]);

  return (
    <>
      <PipelineAnalyticsBar stats={stats} />
      <PipelineFilters agents={agents} values={filterValues} onChange={onFilterChange} />
      <PipelineBoard initialLeads={filteredLeads} />
    </>
  );
}
