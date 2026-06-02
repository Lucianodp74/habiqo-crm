"use client";

import {
  computeStaleness,
  nextActionSuggestion,
  stalenessColor,
} from "@/lib/funnel/staleness";

type Props = {
  status: string;
  lastActivityAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
  leadName: string;
};

/**
 * Banner nella scheda lead che mostra il prossimo passo suggerito.
 * Visibile solo quando il lead è stale o in warning.
 */
export function NextActionBanner({
  status,
  lastActivityAt,
  updatedAt,
  createdAt,
  leadName,
}: Props) {
  const staleness = computeStaleness(status, lastActivityAt, updatedAt, createdAt);

  // Non mostrare per lead fresh o per won/lost
  if (staleness.level === "fresh" || status === "won" || status === "lost") {
    return null;
  }

  const suggestion = nextActionSuggestion(status, staleness.daysSinceActivity, leadName);

  const bannerStyle =
    staleness.level === "critical"
      ? "border-red-200 bg-red-50 text-red-900"
      : staleness.level === "stale"
        ? "border-orange-200 bg-orange-50 text-orange-900"
        : "border-amber-200 bg-amber-50 text-amber-900";

  const iconStyle =
    staleness.level === "critical"
      ? "text-red-500"
      : staleness.level === "stale"
        ? "text-orange-500"
        : "text-amber-500";

  return (
    <div className={`rounded-xl border px-4 py-3.5 flex gap-3 items-start ${bannerStyle}`}>
      {/* Icona orologio */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={`shrink-0 mt-0.5 ${iconStyle}`}
        aria-hidden
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {staleness.level === "critical" ? "Urgente" : "Prossimo passo"}
          </span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${stalenessColor(staleness.level)}`}
          >
            {staleness.label}
          </span>
        </div>
        <p className="text-[13px] leading-relaxed">{suggestion}</p>
      </div>
    </div>
  );
}
