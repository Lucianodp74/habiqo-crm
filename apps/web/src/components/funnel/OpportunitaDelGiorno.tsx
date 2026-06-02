import {
  buildWhatsAppLink,
  whatsappTemplate,
} from "@/lib/funnel/staleness";
import { getOpportunitaDelGiorno } from "@/lib/queries/opportunita";
import Link from "next/link";

// ─── Helpers ─────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  if (d.toDateString() === today.toDateString()) return "oggi";
  if (d.toDateString() === tomorrow.toDateString()) return "domani";
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "short" });
}

const STATUS_LABEL: Record<string, string> = {
  new: "Nuovo",
  qualified: "Qualificato",
  visit_scheduled: "Visita",
  in_negotiation: "Trattativa",
};

// ─── Sub-components ──────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
  count,
  priority,
}: {
  icon: string;
  label: string;
  count: number;
  priority: "high" | "medium" | "low";
}) {
  const colors = {
    high: "text-red-700 bg-red-50 border-red-200",
    medium: "text-amber-700 bg-amber-50 border-amber-200",
    low: "text-blue-700 bg-blue-50 border-blue-200",
  };
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-base">{icon}</span>
      <span className="text-[13px] font-semibold text-[var(--fg-primary)]">{label}</span>
      <span
        className={`ml-auto text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${colors[priority]}`}
      >
        {count}
      </span>
    </div>
  );
}

function WhatsAppAction({
  phone,
  whatsapp,
  status,
  leadName,
}: {
  phone: string | null;
  whatsapp: string | null;
  status: string;
  leadName: string;
}) {
  const message = whatsappTemplate(status, leadName, "Agente", "");
  const href = buildWhatsAppLink(phone, whatsapp, message);

  if (!href) {
    return (
      <span className="text-[11px] text-[var(--fg-muted)] px-2 py-1 rounded-lg border border-dashed border-[var(--border-subtle)]">
        No numero
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors shrink-0"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.533 5.856L.057 23.214a.75.75 0 0 0 .93.93l5.356-1.476A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.535-5.21-1.463l-.373-.223-3.876 1.068 1.068-3.877-.222-.372A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
      </svg>
      WhatsApp
    </a>
  );
}

// ─── Main component ───────────────────────────────────────────────

export async function OpportunitaDelGiorno() {
  const data = await getOpportunitaDelGiorno();

  if (!data) return null;

  const { leadUrgenti, appuntamentiDaConfermare, immobiliDaProporre } = data;
  const totalOpportunita =
    leadUrgenti.length + appuntamentiDaConfermare.length + immobiliDaProporre.length;

  // Non mostrare se non ci sono opportunità
  if (totalOpportunita === 0) {
    return (
      <section className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
        <div className="flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <p className="text-[14px] font-semibold text-[var(--fg-primary)]">
              Opportunità del giorno
            </p>
            <p className="text-[12px] text-[var(--fg-muted)]">
              Nessuna azione urgente. Ottimo lavoro.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/30 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-amber-200/60">
        <div className="flex items-center gap-3">
          <span className="text-xl">⚡</span>
          <div>
            <p className="text-[14px] font-semibold text-[var(--fg-primary)]">
              Opportunità del giorno
            </p>
            <p className="text-[11px] text-[var(--fg-muted)]">
              {totalOpportunita} {totalOpportunita === 1 ? "azione consigliata" : "azioni consigliate"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* 1. Lead urgenti */}
        {leadUrgenti.length > 0 && (
          <div>
            <SectionHeader
              icon="🔴"
              label="Lead urgenti"
              count={leadUrgenti.length}
              priority="high"
            />
            <ul className="space-y-2">
              {leadUrgenti.map((lead) => (
                <li
                  key={lead.id}
                  className="flex items-center gap-3 rounded-xl bg-white border border-red-100 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[var(--fg-primary)] truncate">
                      {lead.fullName}
                    </p>
                    <p className="text-[11px] text-[var(--fg-muted)]">
                      {STATUS_LABEL[lead.status] ?? lead.status} · {lead.daysSince}gg fa
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <WhatsAppAction
                      phone={lead.phone}
                      whatsapp={lead.whatsapp}
                      status={lead.status}
                      leadName={lead.fullName}
                    />
                    <Link
                      href={`/crm/leads/${lead.id}`}
                      className="text-[11px] font-medium text-[var(--fg-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-sunken)] transition-colors"
                    >
                      Apri
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 2. Appuntamenti da confermare */}
        {appuntamentiDaConfermare.length > 0 && (
          <div>
            <SectionHeader
              icon="📅"
              label="Da confermare"
              count={appuntamentiDaConfermare.length}
              priority="medium"
            />
            <ul className="space-y-2">
              {appuntamentiDaConfermare.map((apt) => (
                <li
                  key={apt.id}
                  className="flex items-center gap-3 rounded-xl bg-white border border-amber-100 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[var(--fg-primary)] truncate">
                      {apt.title}
                    </p>
                    <p className="text-[11px] text-[var(--fg-muted)]">
                      {apt.leadName && `${apt.leadName} · `}
                      {formatDate(apt.scheduledAt)} {formatTime(apt.scheduledAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {apt.leadId && (
                      <Link
                        href={`/crm/leads/${apt.leadId}`}
                        className="text-[11px] font-medium text-[var(--fg-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-sunken)] transition-colors"
                      >
                        Apri lead
                      </Link>
                    )}
                    <Link
                      href="/dashboard/agenda"
                      className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      Agenda
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Immobili da proporre */}
        {immobiliDaProporre.length > 0 && (
          <div>
            <SectionHeader
              icon="🏠"
              label="Da proporre"
              count={immobiliDaProporre.length}
              priority="low"
            />
            <ul className="space-y-2">
              {immobiliDaProporre.map((item) => (
                <li
                  key={item.propertyId}
                  className="flex items-center gap-3 rounded-xl bg-white border border-blue-100 px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[var(--fg-primary)] truncate">
                      {item.propertyTitle}
                    </p>
                    <p className="text-[11px] text-[var(--fg-muted)]">
                      {item.propertyCity && `${item.propertyCity} · `}
                      {item.matchCount} {item.matchCount === 1 ? "lead compatibile" : "lead compatibili"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.topLeadId && (
                      <WhatsAppAction
                        phone={item.topLeadPhone}
                        whatsapp={item.topLeadWhatsapp}
                        status={item.topLeadStatus ?? "new"}
                        leadName={item.topLeadName ?? "Lead"}
                      />
                    )}
                    <Link
                      href={`/admin/properties/${item.propertyId}/photos`}
                      className="text-[11px] font-medium text-[var(--fg-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-sunken)] transition-colors"
                    >
                      Apri
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </section>
  );
}
