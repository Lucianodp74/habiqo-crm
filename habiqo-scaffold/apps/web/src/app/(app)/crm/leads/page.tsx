import { PipelineBoard } from "@/components/crm/pipeline-board";
import type { PipelineLead } from "@/lib/crm/pipeline";
import { listLeadsForAgency } from "@/lib/queries/leads";
import Link from "next/link";

export const metadata = { title: "Pipeline · CRM" };

export default async function CrmLeadsPipelinePage() {
  const rows = await listLeadsForAgency();
  const initialLeads: PipelineLead[] = rows.map((r) => ({
    id: r.id,
    fullName: r.fullName,
    status: r.status,
    temperature: r.temperature,
    aiScore: r.aiScore,
    lastActivityAt: r.lastActivityAt,
  }));

  return (
    <div className="px-4 sm:px-8 py-8 max-w-[1920px] mx-auto">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-[var(--fg-muted)] mb-2">
            Pipeline
          </p>
          <h1 className="font-display text-[28px] sm:text-[32px] leading-tight text-[var(--fg-primary)]">
            Lead pipeline
          </h1>
          <p className="mt-2 text-[13px] text-[var(--fg-muted)] max-w-xl">
            Trascina le card tra le fasi. Gli aggiornamenti si salvano automaticamente.
          </p>
        </div>
        <Link
          href="/crm"
          className="text-[12px] font-medium text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 bg-[var(--bg-elevated)] transition-colors self-start sm:self-auto"
        >
          Vista elenco
        </Link>
      </header>

      <PipelineBoard initialLeads={initialLeads} />
    </div>
  );
}
