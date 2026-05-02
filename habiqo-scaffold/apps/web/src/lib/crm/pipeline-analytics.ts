import {
  type PipelineColumnId,
  type PipelineLead,
  columnIdToDbStatus,
  isPipelineColumnId,
  statusToColumnId,
} from "./pipeline";

export type PipelineStats = {
  total: number;
  conversionRate: number;
  byStage: Record<PipelineColumnId, number>;
  closedThisMonth: number;
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function computePipelineStats(leads: PipelineLead[]): PipelineStats {
  const total = leads.length;
  const byStage = {
    new: 0,
    qualified: 0,
    visit_scheduled: 0,
    negotiation: 0,
    won: 0,
    lost: 0,
  } as Record<PipelineColumnId, number>;

  for (const l of leads) {
    const col = statusToColumnId(l.status);
    if (col in byStage) {
      byStage[col] += 1;
    }
  }

  const won = byStage.won;
  const lost = byStage.lost;
  const decided = won + lost;
  const conversionRate = decided > 0 ? Math.round((won / decided) * 1000) / 10 : 0;

  const monthStart = startOfMonth(new Date());
  const closedThisMonth = leads.filter((l) => {
    if (l.status !== "won") return false;
    if (!l.updatedAt) return false;
    return new Date(l.updatedAt) >= monthStart;
  }).length;

  return {
    total,
    conversionRate,
    byStage,
    closedThisMonth,
  };
}

/** Map URL filter status (column id) to DB status for compare */
export function filterStatusToDbStatus(filter: string): string {
  if (isPipelineColumnId(filter)) return columnIdToDbStatus(filter);
  return filter;
}
