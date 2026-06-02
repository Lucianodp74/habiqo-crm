import { LeadDocumentsSection } from "@/components/crm/lead-documents-section";
import { LeadMatchingProperties } from "@/components/crm/lead-matching-properties";
import { LeadPreferencesForm } from "@/components/crm/lead-preferences-form";
import { LeadActivityTimeline } from "@/components/crm/lead-activity-timeline";
import { LeadInsightPanel } from "@/components/crm/lead-insight-panel";
import { LeadNotesForm } from "@/components/crm/lead-notes-form";
import { LeadQuickActions } from "@/components/crm/lead-quick-actions";
import { LeadTasksFollowUp } from "@/components/crm/lead-tasks-follow-up";
import { LeadStatusSelect } from "@/components/lead-status-select";
import { NextActionBanner } from "@/components/funnel/NextActionBanner";
import { WhatsAppLinkButton } from "@/components/funnel/WhatsAppLinkButton";
import { synthesizeLeadInsight } from "@/lib/crm/lead-insight-synthesis";
import {
  formatBudgetRange,
  formatLeadSource,
  formatPropertyType,
  formatZones,
  resolveDisplayUrgency,
  urgencyLabel,
} from "@/lib/crm/lead-presenter";
import { NON_SPECIFICATO } from "@/lib/crm/missing-value";
import { listLeadEventsForLead } from "@/lib/queries/lead-events";
import { getLeadByIdForAgency } from "@/lib/queries/leads";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function FieldValue({ value }: { value: string }) {
  const muted = value === NON_SPECIFICATO;
  return (
    <dd
      className={
        muted
          ? "text-[12px] italic text-[var(--fg-muted)] tracking-tight"
          : "text-[var(--fg-primary)]"
      }
    >
      {value}
    </dd>
  );
}

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Recupera nome agente e agenzia per il WhatsApp template
  const [lead, events, agentData] = await Promise.all([
    getLeadByIdForAgency(id),
    listLeadEventsForLead(id),
    user
      ? supabase
          .from("agency_members")
          .select("agencies(name), profiles(full_name)")
          .eq("user_id", user.id)
          .limit(1)
          .single()
      : Promise.resolve({ data: null }),
  ]);

  if (!lead) notFound();

  const urgency = resolveDisplayUrgency(lead);
  const insight = synthesizeLeadInsight(lead, events);

  const emailDisplay = lead.email?.trim() || NON_SPECIFICATO;
  const phoneDisplay = lead.phone?.trim() || NON_SPECIFICATO;
  const whatsappDisplay = lead.whatsapp?.trim() || NON_SPECIFICATO;
  const aiScoreDisplay = lead.aiScore != null ? String(lead.aiScore) : NON_SPECIFICATO;

 // Nome agente e agenzia per WhatsApp template
  const rawData = agentData?.data as unknown as {
    profiles?: { full_name?: string | null } | { full_name?: string | null }[];
    agencies?: { name?: string | null } | { name?: string | null }[];
  } | null;
  const profilesRaw = rawData?.profiles;
  const agenciesRaw = rawData?.agencies;
  const agentName = (Array.isArray(profilesRaw) ? profilesRaw[0]?.full_name : profilesRaw?.full_name) ?? "Agente";
  const agencyName = (Array.isArray(agenciesRaw) ? agenciesRaw[0]?.name : agenciesRaw?.name) ?? "Habiquo";

  return (
    <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto">
      <Link
        href="/crm/leads"
        className="inline-flex text-[12px] font-medium text-[var(--fg-muted)] hover:text-[var(--fg-primary)] mb-6 transition-colors duration-200"
      >
        ← Pipeline
      </Link>

      <header className="mb-10 space-y-5 animate-in-card">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
          Lead profile
        </p>
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="min-w-0 space-y-4">
            <h1 className="font-display text-[clamp(2rem,5vw,3rem)] leading-[1.08] text-[var(--fg-primary)] tracking-tight">
              {lead.fullName}
            </h1>
            <LeadQuickActions
              fullName={lead.fullName}
              email={lead.email}
              phone={lead.phone}
              whatsapp={lead.whatsapp}
            />
            <p className="text-[13px] text-[var(--fg-muted)]">
              <span className="text-[var(--fg-secondary)]">
                {formatLeadSource(lead.source, lead.sourceDetail)}
              </span>
              {lead.assignedToName ? (
                <span className="text-[var(--fg-secondary)]"> · {lead.assignedToName}</span>
              ) : (
                <span className="italic text-[var(--fg-muted)]">
                  {" "}
                  · Assegnatario: {NON_SPECIFICATO}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-1 text-[11px] text-[var(--fg-secondary)] transition-colors duration-200 hover:border-[var(--color-brass)]/25">
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

        {/* Next Action Banner — visibile solo se il lead è stale */}
        <NextActionBanner
          status={lead.status}
          lastActivityAt={lead.lastContactAt}
          updatedAt={lead.updatedAt}
          createdAt={null}
          leadName={lead.fullName}
        />

        {/* WhatsApp Link Button — messaggio precompilato per lo stage corrente */}
        <div className="flex items-center gap-3 pt-1">
          <WhatsAppLinkButton
            phone={lead.phone}
            whatsapp={lead.whatsapp}
            status={lead.status}
            leadName={lead.fullName}
            agentName={agentName}
            agencyName={agencyName}
          />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="glass-panel rounded-2xl p-5 sm:p-6 transition-shadow duration-300 hover:shadow-[0_14px_44px_-24px_rgba(24,20,16,0.18)] animate-in-card [animation-delay:80ms]">
            <h2 className="font-display text-[20px] text-[var(--fg-primary)] mb-5">
              Profilo richiesta
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-[13px]">
              <div>
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1.5">
                  Email
                </dt>
                <FieldValue value={emailDisplay} />
              </div>
              <div>
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1.5">
                  Telefono
                </dt>
                <FieldValue value={phoneDisplay} />
              </div>
              <div>
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1.5">
                  WhatsApp
                </dt>
                <FieldValue value={whatsappDisplay} />
              </div>
              <div>
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1.5">
                  Budget
                </dt>
                <FieldValue value={formatBudgetRange(lead)} />
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1.5">
                  Zone preferite
                </dt>
                <FieldValue value={formatZones(lead.preferredZones, 12)} />
              </div>
              <div>
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1.5">
                  Tipologia
                </dt>
                <FieldValue value={formatPropertyType(lead.propertyType)} />
              </div>
              <div>
                <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1.5">
                  AI score
                </dt>
                <FieldValue value={aiScoreDisplay} />
              </div>
            </dl>
          </section>

          <LeadPreferencesForm
            leadId={lead.id}
            initial={{
              preferredCity: lead.preferredCity,
              preferredListingType: lead.preferredListingType,
              preferredRoomsMin: lead.preferredRoomsMin,
              preferredSqmMin: lead.preferredSqmMin,
            }}
          />
          <LeadTasksFollowUp leadId={lead.id} />
          <LeadNotesForm leadId={lead.id} />
          <LeadDocumentsSection leadId={lead.id} />
          <LeadMatchingProperties leadId={lead.id} />

          <section className="glass-panel rounded-2xl p-5 sm:p-6 transition-shadow duration-300 hover:shadow-[0_14px_44px_-24px_rgba(24,20,16,0.16)] animate-in-card [animation-delay:120ms]">
            <h2 className="font-display text-[20px] text-[var(--fg-primary)] mb-6">
              Timeline attività
            </h2>
            <LeadActivityTimeline events={events} />
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <LeadInsightPanel synthesis={insight} />
        </aside>
      </div>
    </div>
  );
}
