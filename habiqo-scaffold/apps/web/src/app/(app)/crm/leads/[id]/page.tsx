import { LeadActivityTimeline } from "@/components/crm/lead-activity-timeline";
import { LeadNotesForm } from "@/components/crm/lead-notes-form";
import { LeadStatusSelect } from "@/components/lead-status-select";
import {
  formatBudgetRange,
  formatLeadSource,
  formatPropertyType,
  formatZones,
  resolveDisplayUrgency,
  urgencyLabel,
} from "@/lib/crm/lead-presenter";
import { listLeadEventsForLead } from "@/lib/queries/lead-events";
import { getLeadByIdForAgency } from "@/lib/queries/leads";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;

  const [lead, events] = await Promise.all([getLeadByIdForAgency(id), listLeadEventsForLead(id)]);

  if (!lead) {
    notFound();
  }

  const urgency = resolveDisplayUrgency(lead);

  return (
    <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto">
      <Link
        href="/crm/leads"
        className="inline-flex text-[12px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg-primary)] mb-6 transition-colors"
      >
        ← Pipeline
      </Link>

      <header className="mb-10 space-y-4 animate-in-card">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
          Lead profile
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <h1 className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.08] text-[var(--fg-primary)] tracking-tight">
              {lead.fullName}
            </h1>
            <p className="mt-2 text-[13px] text-[var(--fg-muted)]">
              {formatLeadSource(lead.source, lead.sourceDetail)}
              {lead.assignedToName ? ` · ${lead.assignedToName}` : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-1 text-[11px] text-[var(--fg-secondary)]">
              Urgenza: {urgencyLabel(urgency)}
            </span>
          </div>
        </div>

        <div className="max-w-xs">
          <label
            className="text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)] block mb-2"
            htmlFor="lead-status"
          >
            Stato pipeline
          </label>
          <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-panel rounded-2xl p-5 sm:p-6 animate-in-card [animation-delay:80ms]">
            <h2 className="font-display text-[20px] text-[var(--fg-primary)] mb-5">
              Profilo richiesta
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-[13px]">
              <div>
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1">
                  Email
                </dt>
                <dd className="text-[var(--fg-primary)]">{lead.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1">
                  Telefono
                </dt>
                <dd className="text-[var(--fg-primary)]">{lead.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1">
                  WhatsApp
                </dt>
                <dd className="text-[var(--fg-primary)]">{lead.whatsapp ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1">
                  Budget
                </dt>
                <dd className="text-[var(--fg-primary)] tabular-nums">{formatBudgetRange(lead)}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1">
                  Zone preferite
                </dt>
                <dd className="text-[var(--fg-primary)]">{formatZones(lead.preferredZones, 12)}</dd>
              </div>
              <div>
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1">
                  Tipologia
                </dt>
                <dd className="text-[var(--fg-primary)]">
                  {formatPropertyType(lead.propertyType)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1">
                  AI score
                </dt>
                <dd className="font-mono text-[var(--accent-deep)]">{lead.aiScore ?? "—"}</dd>
              </div>
            </dl>
          </section>

          <LeadNotesForm leadId={lead.id} />

          <section className="glass-panel rounded-2xl p-5 sm:p-6 animate-in-card [animation-delay:120ms]">
            <h2 className="font-display text-[20px] text-[var(--fg-primary)] mb-5">
              Timeline attività
            </h2>
            <LeadActivityTimeline events={events} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="glass-panel rounded-2xl p-5 border-[var(--color-brass)]/20 animate-in-card [animation-delay:100ms]">
            <h2 className="font-display text-[17px] text-[var(--fg-primary)] mb-3 flex items-center gap-2">
              AI insight
            </h2>
            <p className="text-[12px] text-[var(--fg-muted)] leading-relaxed">
              Sintesi automatica disponibile quando il motore AI elabora il lead. Intanto usa note e
              timeline per coordinare il team.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
