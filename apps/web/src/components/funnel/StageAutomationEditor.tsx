"use client";

/**
 * StageAutomationEditor — Sprint 3 placeholder.
 *
 * This component will allow configuring WhatsApp automations
 * (automation_enabled, automation_config) per pipeline stage.
 * The DB columns are already present from migration 0020.
 */
export function StageAutomationEditor({ stageId }: { stageId: string }) {
  void stageId; // will be used in Sprint 3

  return (
    <div className="rounded-xl border border-dashed border-[var(--border-subtle)] px-6 py-8 text-center">
      <p className="text-sm font-medium text-[var(--fg-muted)]">Automazioni stage</p>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">
        Disponibile nel prossimo sprint — configurazione WhatsApp per ogni fase della pipeline.
      </p>
      <span className="mt-3 inline-block text-[10px] font-mono tracking-wider text-[var(--fg-muted)] bg-[var(--bg-sunken)] px-2 py-0.5 rounded">
        SPRINT 3
      </span>
    </div>
  );
}
