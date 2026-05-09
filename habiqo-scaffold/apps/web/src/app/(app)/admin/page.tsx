import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin · HABIQO" };

type AgentKpi = {
  userId: string;
  name: string;
  role: string;
  total: number;
  nuovi: number;
  attivi: number;
  vinti: number;
};

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verifica che sia owner
  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id)
    .single();

  if (!membership || membership.role !== "owner") redirect("/dashboard");

  const agencyId = membership.agency_id;

  // Carica tutti i membri con profili
  const { data: members } = await supabase
    .from("agency_members")
    .select("user_id, role, profiles(full_name)")
    .eq("agency_id", agencyId);

  // Carica tutti i lead dell'agenzia
  const { data: leads } = await supabase
    .from("leads")
    .select("id, assigned_to, status")
    .eq("agency_id", agencyId);

  const allLeads = leads ?? [];
  const allMembers = members ?? [];

  // Calcola KPI per agente
  const kpis: AgentKpi[] = allMembers.map((m) => {
    const mine = allLeads.filter((l) => l.assigned_to === m.user_id);
    return {
      userId: m.user_id,
      name:
        (m.profiles as unknown as { full_name: string | null } | null)?.full_name ??
        "Agente",
      role: m.role,
      total: mine.length,
      nuovi: mine.filter((l) => l.status === "new").length,
      attivi: mine.filter((l) => !["won", "lost"].includes(l.status ?? ""))
        .length,
      vinti: mine.filter((l) => l.status === "won").length,
    };
  });

  const nonAssegnati = allLeads.filter((l) => !l.assigned_to).length;

  const statBox = (value: number, label: string, color?: string) => (
    <div className="text-center p-3 bg-[var(--bg-canvas)] rounded-xl">
      <p
        className="text-[22px] font-bold leading-none mb-1"
        style={{ color: color ?? "var(--fg-primary)" }}
      >
        {value}
      </p>
      <p className="text-[11px] text-[var(--fg-muted)]">{label}</p>
    </div>
  );

  return (
    <div className="px-4 sm:px-8 py-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)] mb-2">
          Admin
        </p>
        <h1 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] leading-tight text-[var(--fg-primary)]">
          Dashboard team
        </h1>
        <p className="mt-2 text-[13px] text-[var(--fg-muted)]">
          Panoramica lead e performance per agente
        </p>
      </header>

      {/* KPI globali */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 text-center">
          <p className="text-[32px] font-bold text-[var(--fg-primary)] leading-none mb-1">
            {allLeads.length}
          </p>
          <p className="text-[12px] text-[var(--fg-muted)]">Lead totali</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 text-center">
          <p className="text-[32px] font-bold text-[var(--fg-primary)] leading-none mb-1">
            {allMembers.length}
          </p>
          <p className="text-[12px] text-[var(--fg-muted)]">Agenti attivi</p>
        </div>
        <div className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5 text-center">
          <p
            className="text-[32px] font-bold leading-none mb-1"
            style={{ color: nonAssegnati > 0 ? "#d97706" : "var(--fg-primary)" }}
          >
            {nonAssegnati}
          </p>
          <p className="text-[12px] text-[var(--fg-muted)]">Non assegnati</p>
        </div>
      </div>

      {/* KPI per agente */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-[var(--fg-primary)]">
            Performance per agente
          </h2>
          <Link
            href="/admin/team"
            className="text-[12px] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 bg-[var(--bg-elevated)] transition-colors"
          >
            Gestisci team →
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {kpis.map((k) => (
            <div
              key={k.userId}
              className="bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--color-onyx-100,#f3f4f6)] flex items-center justify-center text-[13px] font-semibold text-[var(--fg-primary)]">
                    {k.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[var(--fg-primary)]">
                      {k.name}
                    </p>
                    <p className="text-[12px] text-[var(--fg-muted)]">
                      {k.role === "owner" ? "Admin" : "Agente"}
                    </p>
                  </div>
                </div>
                <Link
                  href="/crm/leads"
                  className="text-[12px] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors"
                >
                  Vedi lead →
                </Link>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {statBox(k.total, "Totale")}
                {statBox(k.nuovi, "Nuovi")}
                {statBox(k.attivi, "Attivi")}
                {statBox(k.vinti, "Vinti", "#16a34a")}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
