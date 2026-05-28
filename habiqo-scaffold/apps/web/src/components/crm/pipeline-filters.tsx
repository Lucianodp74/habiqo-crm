"use client";

import { PIPELINE_COLUMNS } from "@/lib/crm/pipeline";
import type { AgencyAgentOption } from "@/lib/queries/agency-members";
import { Search } from "lucide-react";

const SOURCE_OPTIONS = [
  { value: "", label: "Tutte le fonti" },
  { value: "valuation", label: "Valutazione" },
  { value: "portal", label: "Portale" },
  { value: "idealista", label: "Idealista" },
  { value: "facebook", label: "Facebook" },
  { value: "website", label: "Website" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "referral", label: "Referral" },
  { value: "manual", label: "Manuale" },
];

export type PipelineFilterValues = {
  q: string;
  agentId: string;
  budgetMin: number | null;
  budgetMax: number | null;
  city: string;
  source: string;
  status: string;
};

type Props = {
  agents: AgencyAgentOption[];
  values: PipelineFilterValues;
  onChange: (patch: Partial<PipelineFilterValues>) => void;
};

export function PipelineFilters({ agents, values, onChange }: Props) {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 mb-6 space-y-4 animate-in-card [animation-delay:60ms]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--fg-muted)] pointer-events-none" />
        <input
          type="search"
          value={values.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Cerca nome, email, telefono…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 text-[13px] text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/35 transition-shadow"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
            Agente
          </span>
          <select
            value={values.agentId}
            onChange={(e) => onChange({ agentId: e.target.value })}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 px-3 py-2 text-[12px] text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/35"
          >
            <option value="">Tutti</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
            Budget min €
          </span>
          <input
            type="number"
            min={0}
            step={10000}
            placeholder="0"
            value={values.budgetMin ?? ""}
            onChange={(e) =>
              onChange({
                budgetMin: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 px-3 py-2 text-[12px] text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/35"
          />
        </label>

        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
            Budget max €
          </span>
          <input
            type="number"
            min={0}
            step={10000}
            placeholder="∞"
            value={values.budgetMax ?? ""}
            onChange={(e) =>
              onChange({
                budgetMax: e.target.value === "" ? null : Number(e.target.value),
              })
            }
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 px-3 py-2 text-[12px] text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/35"
          />
        </label>

        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
            Zona / città
          </span>
          <input
            type="text"
            value={values.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="es. Brera, Milano"
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 px-3 py-2 text-[12px] text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/35"
          />
        </label>

        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
            Fonte
          </span>
          <select
            value={values.source}
            onChange={(e) => onChange({ source: e.target.value })}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 px-3 py-2 text-[12px] text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/35"
          >
            {SOURCE_OPTIONS.map((o) => (
              <option key={`${o.value}-${o.label}`} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--fg-muted)]">
            Stato
          </span>
          <select
            value={values.status}
            onChange={(e) => onChange({ status: e.target.value })}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/60 px-3 py-2 text-[12px] text-[var(--fg-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/35"
          >
            <option value="">Tutti</option>
            {PIPELINE_COLUMNS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
