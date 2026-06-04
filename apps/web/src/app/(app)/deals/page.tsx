import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { computeStaleness } from "@/lib/funnel/staleness";

export const metadata = { title: "Trattative · Habiquo" };

// ─── Query ────────────────────────────────────────────────────────

async function getDealsData() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id);

  if (!memberships?.length) return null;

  const roleOrder = ["owner", "admin", "agent", "viewer"];
  const sorted = [...memberships].sort(
    (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role),
  );
  const agencyId = sorted[0]?.agency_id;
  if (!agencyId) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Tutte le query in parallelo
  const [allLeadsRes, wonThisMonthRes, negotiationLeadsRes] = await Promise.all([
    // Tutti i lead dell'agenzia con status e budget
    supabase
      .from("leads")
      .select("id, full_name, status, budget_min_eur, budget_max_eur, last_activity_at, updated_at, phone, whatsapp, created_at")
      .eq("agency_id", agencyId)
      .order("last_activity_at", { ascending: false }),

    // Lead vinti questo mese
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("status", "won")
      .gte("updated_at", startOfMonth),

    // Lead in trattativa con dettaglio
    supabase
      .from("leads")
      .select("id, full_name, budget_min_eur, budget_max_eur, last_activity_at, updated_at, phone, whatsapp")
      .eq("agency_id", agencyId)
      .eq("status", "in_negotiation")
      .order("last_activity_at", { ascending: true }),
  ]);

  const leads = allLeadsRes.data ?? [];

  // Conta per status
  const byStatus = leads.reduce<Record<string, number>>((acc, l) => {
    const s = l.status ?? "new";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  const total = leads.length;
  const newCount = byStatus["new"] ?? 0;
  const qualifiedCount = byStatus["qualified"] ?? 0;
  const visitCount = byStatus["visit_scheduled"] ?? 0;
  const negotiationCount = byStatus["in_negotiation"] ?? 0;
  const wonCount = byStatus["won"] ?? 0;
  const lostCount = byStatus["lost"] ?? 0;

  // Conversioni (evita divisione per zero)
  const convNewToQualified = total > 0 ? Math.round((qualifiedCount + visitCount + negotiationCount + wonCount) / Math.max(total - lostCount, 1) * 100) : 0;
  const convQualifiedToVisit = (qualifiedCount + visitCount + negotiationCount + wonCount) > 0
    ? Math.round((visitCount + negotiationCount + wonCount) / (qualifiedCount + visitCount + negotiationCount + wonCount) * 100) : 0;
  const convVisitToNegotiation = (visitCount + negotiationCount + wonCount) > 0
    ? Math.round((negotiationCount + wonCount) / (visitCount + negotiationCount + wonCount) * 100) : 0;
  const convNegotiationToWon = (negotiationCount + wonCount) > 0
    ? Math.round(wonCount / (negotiationCount + wonCount) * 100) : 0;

  // Valore pipeline — media budget_max dei lead in trattativa
  const negotiationLeads = negotiationLeadsRes.data ?? [];
  const pipelineValue = negotiationLeads.reduce((sum, l) => {
    const v = l.budget_max_eur ? Number(l.budget_max_eur) : l.budget_min_eur ? Number(l.budget_min_eur) : 0;
    return sum + v;
  }, 0);

  return {
    kpis: {
      negotiationCount,
      wonThisMonth: wonThisMonthRes.count ?? 0,
      pipelineValue,
      convNegotiationToWon,
      convNewToQualified,
      convQualifiedToVisit,
      convVisitToNegotiation,
    },
    funnel: [
      { label: "Nuovi", count: newCount, color: "#3B82F6" },
      { label: "Qualificati", count: qualifiedCount, color: "#8B5CF6" },
      { label: "Visita", count: visitCount, color: "#F59E0B" },
      { label: "Trattativa", count: negotiationCount, color: "#EF4444" },
      { label: "Vinti", count: wonCount, color: "#10B981" },
    ],
    negotiationLeads,
    totalActive: total - wonCount - lostCount,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value === 0) return "—";
  if (value >= 1_000_000) {
    return `€${(value / 1_000_000).toFixed(1)}M`;
  }
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

// ─── KPI Card ────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sublabel,
  accent = false,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        accent
          ? "border-[var(--color-brass)]/30 bg-[var(--color-brass)]/5"
          : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
      }`}
    >
      <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)] mb-2">
        {label}
      </p>
      <p
        className={`text-[32px] font-bold leading-none ${
          accent ? "text-[var(--color-brass-deep)]" : "text-[var(--fg-primary)]"
        }`}
      >
        {value}
      </p>
      {sublabel && (
        <p className="text-[11px] text-[var(--fg-muted)] mt-1">{sublabel}</p>
      )}
    </div>
  );
}

// ─── Funnel Bar ───────────────────────────────────────────────────

function FunnelBar({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[12px] text-[var(--fg-muted)] w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[12px] font-mono text-[var(--fg-secondary)] w-6 text-right">
        {count}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────

export default async function DealsPage() {
  const data = await getDealsData();
  if (!data) redirect("/login");

  const { kpis, funnel, negotiationLeads, totalActive } = data;
  const { convNewToQualified, convQualifiedToVisit, convVisitToNegotiation } = kpis;
  const maxFunnel = Math.max(...funnel.map((f) => f.count), 1);

  return (
    <div className="px-4 sm:px-8 py-8 max-w-5xl mx-auto">

      {/* Header */}
      <header className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-muted)] mb-2">
          Trattative
        </p>
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] text-[var(--fg-primary)] leading-tight">
          Pipeline commerciale
          <span className="italic text-[var(--accent-deep)]">.</span>
        </h1>
        <p className="text-[13px] text-[var(--fg-muted)] mt-2">
          Panoramica delle trattative attive e delle conversioni della tua agenzia.
        </p>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <KpiCard
          label="Trattative attive"
          value={kpis.negotiationCount}
          sublabel="in negoziazione"
          accent
        />
        <KpiCard
          label="Valore pipeline"
          value={formatCurrency(kpis.pipelineValue)}
          sublabel="budget stimato"
        />
        <KpiCard
          label="Vinti questo mese"
          value={kpis.wonThisMonth}
          sublabel="lead chiusi"
        />
        <KpiCard
          label="Conv. trattativa"
          value={`${kpis.convNegotiationToWon}%`}
          sublabel="trattativa → vinto"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Funnel conversione */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
          <h2 className="text-[14px] font-semibold text-[var(--fg-primary)] mb-1">
            Funnel di conversione
          </h2>
          <p className="text-[11px] text-[var(--fg-muted)] mb-5">
            {totalActive} lead attivi in pipeline
          </p>
          <div className="space-y-3">
            {funnel.map((f) => (
              <FunnelBar
                key={f.label}
                label={f.label}
                count={f.count}
                max={maxFunnel}
                color={f.color}
              />
            ))}
          </div>
        </section>

        {/* Tassi di conversione */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
          <h2 className="text-[14px] font-semibold text-[var(--fg-primary)] mb-1">
            Tassi di conversione
          </h2>
          <p className="text-[11px] text-[var(--fg-muted)] mb-5">
            Percentuale di avanzamento tra le fasi
          </p>
          <div className="space-y-4">
            {[
              { label: "Nuovo → Qualificato", value: convNewToQualified },
              { label: "Qualificato → Visita", value: convQualifiedToVisit },
              { label: "Visita → Trattativa", value: convVisitToNegotiation },
              { label: "Trattativa → Vinto", value: kpis.convNegotiationToWon },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[12px] text-[var(--fg-muted)]">{item.label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 rounded-full bg-[var(--bg-sunken)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-brass)]"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                  <span className="text-[12px] font-mono font-semibold text-[var(--fg-primary)] w-8 text-right">
                    {item.value}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Trattative in corso */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[16px] font-semibold text-[var(--fg-primary)]">
            Trattative in corso
          </h2>
          <Link
            href="/crm/leads?status=in_negotiation"
            className="text-[12px] text-[var(--accent-deep)] hover:underline"
          >
            Vedi pipeline →
          </Link>
        </div>

        {negotiationLeads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-8 text-center">
            <p className="text-[13px] text-[var(--fg-muted)] mb-3">
              Nessuna trattativa attiva al momento.
            </p>
            <Link
              href="/crm/leads"
              className="text-[12px] text-[var(--accent-deep)] hover:underline"
            >
              Apri la pipeline →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden">
            <div className="divide-y divide-[var(--border-subtle)]">
              {negotiationLeads.map((lead) => {
                const staleness = computeStaleness(
                  "in_negotiation",
                  lead.last_activity_at,
                  lead.updated_at,
                  null,
                );
                const budget = lead.budget_max_eur
                  ? formatCurrency(Number(lead.budget_max_eur))
                  : lead.budget_min_eur
                    ? `da ${formatCurrency(Number(lead.budget_min_eur))}`
                    : "Budget n.d.";

                return (
                  <Link
                    key={lead.id}
                    href={`/crm/leads/${lead.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-sunken)] transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center flex-shrink-0">
                      <span className="text-[13px] font-semibold text-[var(--fg-secondary)]">
                        {(lead.full_name ?? "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--fg-primary)] truncate group-hover:text-[var(--accent-deep)] transition-colors">
                        {lead.full_name?.trim() || "Senza nome"}
                      </p>
                      <p className="text-[11px] text-[var(--fg-muted)]">{budget}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {staleness.isStale ? (
                        <span className="text-[11px] font-medium text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                          {staleness.daysSinceActivity}gg inattivo
                        </span>
                      ) : (
                        <span className="text-[11px] text-[var(--fg-muted)]">
                          {staleness.label}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Footer note */}
      <p className="text-[11px] text-[var(--fg-muted)] text-center mt-8">
        Analisi avanzate delle trattative disponibili nel prossimo aggiornamento.
      </p>

    </div>
  );
}
