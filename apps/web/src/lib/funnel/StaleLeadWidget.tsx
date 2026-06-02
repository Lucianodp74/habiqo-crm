import { computeStaleness, stalenessColor } from "@/lib/funnel/staleness";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type StaleLead = {
  id: string;
  fullName: string;
  status: string;
  lastActivityAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
};

async function getStaleLeads(): Promise<StaleLead[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("id, full_name, status, last_activity_at, updated_at, created_at")
    .not("status", "in", '("won","lost")')
    .order("last_activity_at", { ascending: true, nullsFirst: true })
    .limit(20);

  if (error || !data) return [];

  return data
    .map((row) => ({
      id: row.id,
      fullName: row.full_name?.trim() || "Senza nome",
      status: row.status ?? "new",
      lastActivityAt: row.last_activity_at,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    }))
    .filter((lead) => {
      const s = computeStaleness(lead.status, lead.lastActivityAt, lead.updatedAt, lead.createdAt);
      return s.isStale;
    })
    .slice(0, 5);
}

const STATUS_LABEL: Record<string, string> = {
  new: "Nuovo",
  qualified: "Qualificato",
  visit_scheduled: "Visita",
  in_negotiation: "Trattativa",
};

export async function StaleLeadWidget() {
  const staleLeads = await getStaleLeads();

  if (staleLeads.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
        <p className="text-[11px] font-mono uppercase tracking-wider text-[var(--fg-muted)] mb-3">
          Lead da ricontattare
        </p>
        <p className="text-[13px] text-[var(--fg-muted)]">
          ✓ Tutti i lead sono aggiornati.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-mono uppercase tracking-wider text-orange-700">
          Lead da ricontattare
        </p>
        <span className="text-[11px] font-mono text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
          {staleLeads.length}
        </span>
      </div>

      <ul className="space-y-2">
        {staleLeads.map((lead) => {
          const s = computeStaleness(
            lead.status,
            lead.lastActivityAt,
            lead.updatedAt,
            lead.createdAt,
          );
          return (
            <li key={lead.id}>
              <Link
                href={`/crm/leads/${lead.id}`}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 bg-white border border-orange-100 hover:border-orange-300 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-[var(--fg-primary)] truncate group-hover:text-orange-700 transition-colors">
                    {lead.fullName}
                  </p>
                  <p className="text-[11px] text-[var(--fg-muted)]">
                    {STATUS_LABEL[lead.status] ?? lead.status}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-[11px] font-mono px-2 py-0.5 rounded-full border ${stalenessColor(s.level)}`}
                >
                  {s.daysSinceActivity}gg
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href="/crm/leads"
        className="mt-3 block text-center text-[12px] text-orange-600 hover:text-orange-800 transition-colors"
      >
        Vedi tutti →
      </Link>
    </div>
  );
}
