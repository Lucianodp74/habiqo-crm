"use client";

import { PIPELINE_COLUMNS } from "@/lib/crm/pipeline";
import type { PipelineStats } from "@/lib/crm/pipeline-analytics";

type Props = {
  stats: PipelineStats;
};

export function PipelineAnalyticsBar({ stats }: Props) {
  return (
    <section className="glass-panel rounded-2xl p-4 sm:p-5 mb-6 animate-in-card">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Lead totali
          </p>
          <p className="font-display text-[26px] sm:text-[30px] tabular-nums text-[var(--fg-primary)]">
            {stats.total}
          </p>
        </div>
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Tasso conversione
          </p>
          <p className="font-display text-[26px] sm:text-[30px] tabular-nums text-[var(--accent-deep)]">
            {stats.conversionRate}%
          </p>
          <p className="text-[10px] text-[var(--fg-muted)]">su lead won / (won + lost)</p>
        </div>
        <div className="space-y-1 col-span-2 lg:col-span-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">
            Chiusure mese
          </p>
          <p className="font-display text-[26px] sm:text-[30px] tabular-nums text-[var(--color-positive)]">
            {stats.closedThisMonth}
          </p>
        </div>
        <div className="col-span-2 lg:col-span-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)] mb-2">
            Per fase
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_COLUMNS.map((col) => (
              <span
                key={col.id}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-sunken)]/80 px-2 py-0.5 text-[10px] text-[var(--fg-secondary)]"
              >
                <span className="truncate max-w-[72px]">{col.shortLabel}</span>
                <span className="font-mono tabular-nums text-[var(--fg-primary)]">
                  {stats.byStage[col.id]}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
