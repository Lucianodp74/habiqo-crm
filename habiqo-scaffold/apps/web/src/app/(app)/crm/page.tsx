import { listLeadsForAgency } from "@/lib/queries/leads";
import { Pill, Skeleton } from "@habiquo/ui";
import { formatRelative, initials } from "@habiquo/utils";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = { title: "CRM" };

const COLUMNS = [
  { id: "new", label: "Nuovi" },
  { id: "qualified", label: "Qualificati" },
  { id: "in_negotiation", label: "In trattativa" },
  { id: "won", label: "Chiusi" },
] as const;

export default function CrmPage() {
  return (
    <div className="px-8 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-[var(--fg-muted)] mb-2">
            Pipeline
          </p>
          <h1 className="font-display text-[32px] leading-tight">CRM</h1>
        </div>
        <Link
          href="/crm/leads"
          className="text-[12px] font-medium text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 bg-[var(--bg-elevated)] transition-colors self-start sm:self-auto"
        >
          Vista Kanban
        </Link>
      </header>

      <Suspense fallback={<PipelineBoardSkeleton />}>
        <PipelineBoard />
      </Suspense>
    </div>
  );
}

async function PipelineBoard() {
  const leads = await listLeadsForAgency();
  const grouped = COLUMNS.map((col) => ({
    ...col,
    leads: leads.filter((l) => l.status === col.id),
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {grouped.map((col) => (
        <section
          key={col.id}
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3"
        >
          <header className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[12px] font-medium">{col.label}</h2>
            <span className="font-mono text-[10px] text-[var(--fg-muted)]">{col.leads.length}</span>
          </header>
          <ul className="space-y-2">
            {col.leads.length === 0 ? (
              <li className="text-[12px] text-[var(--fg-muted)] px-2 py-6 text-center">
                Nessun lead
              </li>
            ) : (
              col.leads.map((lead) => (
                <li key={lead.id}>
                  <Link
                    href={`/crm/leads/${lead.id}`}
                    className="block p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-display text-[11px] shrink-0"
                        style={{
                          background: "var(--color-onyx-900)",
                          color: "var(--color-brass-soft)",
                        }}
                      >
                        {initials(lead.fullName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium truncate">{lead.fullName}</div>
                        <div className="text-[11px] text-[var(--fg-muted)] truncate">
                          {lead.lastContactAt
                            ? formatRelative(lead.lastContactAt)
                            : "Nessuna attività"}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <Pill
                        tone={
                          lead.temperature === "hot"
                            ? "warm"
                            : lead.temperature === "warm"
                              ? "brass"
                              : "neutral"
                        }
                        dot={lead.temperature === "hot"}
                      >
                        {lead.temperature === "hot"
                          ? "Caldo"
                          : lead.temperature === "warm"
                            ? "Tiepido"
                            : "Freddo"}
                      </Pill>
                      {lead.aiScore != null ? (
                        <span className="font-mono text-[10px] text-[var(--accent-deep)]">
                          {lead.aiScore}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PipelineBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((col) => (
        <section
          key={col.id}
          className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[12px] font-medium">{col.label}</span>
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[78px] w-full" />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
