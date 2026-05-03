import type { LeadInsightSynthesis } from "@/lib/crm/lead-insight-synthesis";
import { Activity, ArrowRight, Gauge, Sparkles, Target } from "lucide-react";

type Props = {
  synthesis: LeadInsightSynthesis;
};

export function LeadInsightPanel({ synthesis }: Props) {
  const { activitySummary, conversionPct, nextAction, nextActionRationale, signals } = synthesis;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--color-brass)]/25 bg-gradient-to-b from-[var(--bg-elevated)] via-[var(--bg-elevated)] to-[var(--bg-sunken)]/50 p-5 sm:p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] transition-[box-shadow,transform] duration-500 ease-out hover:shadow-[0_12px_40px_-20px_rgba(200,160,96,0.35)] motion-safe:animate-[habiqoInsightPulse_5s_ease-in-out_infinite]">
      <style>{`
        @keyframes habiqoInsightPulse {
          0%, 100% { box-shadow: inset 0 0 0 0 rgba(200, 160, 96, 0), 0 0 0 0 rgba(200, 160, 96, 0); }
          50% { box-shadow: inset 0 0 32px -24px rgba(200, 160, 96, 0.12), 0 0 0 1px rgba(200, 160, 96, 0.08); }
        }
      `}</style>
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-36 rounded-full bg-[var(--color-brass)]/8 blur-2xl"
        aria-hidden
      />
      <header className="relative mb-5 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-brass)]/30 bg-[var(--color-brass)]/10 text-[var(--color-brass-deep)] transition-transform duration-300 ease-out hover:scale-105">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-[18px] leading-tight text-[var(--fg-primary)]">
            Insight operativo
          </h2>
          <p className="mt-1 text-[11px] font-mono uppercase tracking-[0.14em] text-[var(--fg-muted)]">
            Sintesi da timeline e profilo
          </p>
        </div>
      </header>

      <div className="relative space-y-5">
        <div className="rounded-xl border border-[var(--border-subtle)]/90 bg-[var(--bg-canvas)]/40 p-4 transition-colors duration-300 hover:border-[var(--border-subtle)]">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-[var(--fg-muted)]">
            <Activity className="size-3.5 text-[var(--color-brass)]" aria-hidden />
            Attività recente
          </div>
          <p className="text-[13px] leading-relaxed text-[var(--fg-secondary)]">
            {activitySummary}
          </p>
        </div>

        <div className="rounded-xl border border-[var(--border-subtle)]/90 bg-[var(--bg-canvas)]/40 p-4 transition-colors duration-300 hover:border-[var(--border-subtle)]">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-[var(--fg-muted)]">
              <Gauge className="size-3.5 text-[var(--color-brass)]" aria-hidden />
              Probabilità conversione
            </div>
            <span className="font-display text-[22px] tabular-nums text-[var(--fg-primary)]">
              {conversionPct}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-sunken)] ring-1 ring-[var(--border-subtle)]/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-brass-soft)] via-[var(--color-brass)] to-[var(--color-brass-deep)] transition-[width] duration-700 ease-out"
              style={{ width: `${conversionPct}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-brass)]/20 bg-[var(--color-brass)]/[0.06] p-4 transition-all duration-300 hover:border-[var(--color-brass)]/35">
          <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-[var(--fg-muted)]">
            <Target className="size-3.5 text-[var(--color-brass-deep)]" aria-hidden />
            Next best action
          </div>
          <p className="text-[14px] font-medium leading-snug text-[var(--fg-primary)]">
            {nextAction}
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-[var(--fg-muted)]">
            <ArrowRight
              className="mt-0.5 size-3.5 shrink-0 text-[var(--color-brass)]"
              aria-hidden
            />
            {nextActionRationale}
          </p>
        </div>

        <ul className="space-y-2">
          {signals.map((s) => (
            <li
              key={s}
              className="flex gap-2 rounded-lg border border-transparent px-2 py-1.5 text-[12px] text-[var(--fg-secondary)] transition-colors duration-200 hover:border-[var(--border-subtle)]/80 hover:bg-[var(--bg-sunken)]/50"
            >
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-brass)]/80"
                aria-hidden
              />
              {s}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
