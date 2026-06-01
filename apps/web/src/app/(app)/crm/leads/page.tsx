import { AddNewLeadFlow } from "@/components/crm/add-new-lead-flow";
import { PipelineShell } from "@/components/crm/pipeline-shell";
import { mapStagesToDynamicColumns } from "@/lib/crm/pipeline";
import { listAgentsForAgency } from "@/lib/queries/agency-members";
import { listLeadsForAgency } from "@/lib/queries/leads";
import { getPipelineStages } from "@/lib/queries/pipeline-stages";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata = { title: "Pipeline · CRM" };

interface Props {
  searchParams: Promise<{ filter?: string }>;
}

export default async function CrmLeadsPipelinePage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const isMineFilter = filter === "mine";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [initialLeads, agents, stages] = await Promise.all([
    listLeadsForAgency(isMineFilter && user ? { assignedTo: user.id } : undefined),
    listAgentsForAgency(),
    getPipelineStages(),
  ]);

  // Map DB stages to dynamic columns for the board.
  // If stages is null (auth error) or empty, board falls back to static columns.
  const dynamicColumns =
    stages && stages.length > 0 ? mapStagesToDynamicColumns(stages) : undefined;

  return (
    <div className="px-4 sm:px-8 py-8 max-w-[1920px] mx-auto">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between animate-in-card">
        <div>
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)] mb-2">
            Pipeline
          </p>
          <h1 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] leading-tight text-[var(--fg-primary)]">
            Lead pipeline
          </h1>
          <p className="mt-2 text-[13px] text-[var(--fg-muted)] max-w-xl leading-relaxed">
            Vista Kanban premium: analisi, filtri e trascinamento tra le fasi. I dati si aggiornano
            in tempo reale.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex rounded-xl border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-elevated)] text-[12px] font-medium">
            <Link
              href="/crm/leads"
              className={`px-4 py-2.5 transition-colors ${
                !isMineFilter
                  ? "bg-[var(--color-onyx-900)] text-white"
                  : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
              }`}
            >
              Tutti
            </Link>
            <Link
              href="/crm/leads?filter=mine"
              className={`px-4 py-2.5 transition-colors ${
                isMineFilter
                  ? "bg-[var(--color-onyx-900)] text-white"
                  : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
              }`}
            >
              Miei
            </Link>
          </div>
          <AddNewLeadFlow />
        </div>
      </header>

      <PipelineShell initialLeads={initialLeads} agents={agents} columns={dynamicColumns} />
    </div>
  );
}
