"use client";

import type { PipelineColumnDynamic, PipelineLead } from "@/lib/crm/pipeline";
import { computePipelineStats } from "@/lib/crm/pipeline-analytics";
import { leadMatchesPipelineFilters } from "@/lib/crm/pipeline-filter-match";
import type { AgencyAgentOption } from "@/lib/queries/agency-members";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import { useCallback, useMemo } from "react";
import { PipelineAnalyticsBar } from "./pipeline-analytics-bar";
import { PipelineBoard } from "./pipeline-board-client";
import { type PipelineFilterValues, PipelineFilters } from "./pipeline-filters";

type Props = {
  initialLeads: PipelineLead[];
  agents: AgencyAgentOption[];
  /**
   * Dynamic columns from DB pipeline_stages.
   * Optional — when absent the board uses static PIPELINE_COLUMNS.
   */
  columns?: PipelineColumnDynamic[];
};

export function PipelineShell({ initialLeads, agents, columns }: Props) {
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
    return initialLeads.filter((lead) => leadMatchesPipelineFilters(lead, filterValues));
  }, [initialLeads, filterValues]);

  return (
    <>
      <PipelineAnalyticsBar stats={stats} />
      <PipelineFilters agents={agents} values={filterValues} onChange={onFilterChange} />
      <PipelineBoard
        initialLeads={filteredLeads}
        columns={columns}
        includeLeadInBoard={(lead) => leadMatchesPipelineFilters(lead, filterValues)}
      />
    </>
  );
}
