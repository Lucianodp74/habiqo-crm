"use client";

import { computeStaleness, stalenessDotColor } from "@/lib/funnel/staleness";

type Props = {
  status: string;
  lastActivityAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

/**
 * Badge minimale da mostrare sulla lead card nella Kanban.
 * Mostra un punto colorato + giorni di inattività solo se stale.
 */
export function StaleBadge({ status, lastActivityAt, updatedAt, createdAt }: Props) {
  const staleness = computeStaleness(status, lastActivityAt, updatedAt, createdAt);

  if (!staleness.isStale) return null;

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-mono leading-none"
      title={`Inattivo da ${staleness.label}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full shrink-0 ${stalenessDotColor(staleness.level)}`}
      />
      <span className="text-[var(--fg-muted)]">{staleness.daysSinceActivity}gg</span>
    </span>
  );
}
