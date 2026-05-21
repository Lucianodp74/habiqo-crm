import { getLeadSourceStats, getLeadTotals } from "@/lib/queries/analytics";
import { redirect } from "next/navigation";

export const metadata = { title: "Portali · Habiquo" };

function PortalBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    "Immobiliare.it": "bg-[var(--color-brass-glow)] text-[var(--accent-deep)]",
    "Idealista":      "bg-blue-50 text-blue-700",
    "Casa.it":        "bg-orange-50 text-orange-700",
    "Sito web":       "bg-[var(--bg-sunken)] text-[var(--fg-secondary)]",
    "Facebook":       "bg-blue-50 text-blue-700",
    "WhatsApp":       "bg-green-50 text-green-700",
  };
  const cls = colors[name] ?? "bg-[var(--bg-sunken)] text-[var(--fg-secondary)]";
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-widest ${cls}`}>
      {name}
    </span>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-1">{label}</p>
      <p className="font-display text-3xl text-[var(--fg-primary)] leading-none">{value}</p>
      {sub ? <p className="text-xs text-[var(--fg-secondary)] mt-1">{sub}</p> : null}
    </div>
  );
}

export default async function AnalyticsPage() {
  const [stats, totals] = await Promise.all([
    getLeadSourceStats(),
    getLeadTotals(),
  ]);

  if (!stats) redirect("/dashboard");

  const topPortal = stats[0] ?? null;
  const portals = stats.filter(
    (s) => ["Immobiliare.it", "Idealista", "Casa.it"].includes(s.displayName)
  );
  const otherSources = stats.filter(
    (s) => !["Immobiliare.it", "Idealista", "Casa.it"].includes(s.displayName)
  );

  return (
    <div className="px-4 sm:px-8 py-8 max-w-4xl mx-auto">

      {/* ── Header ───────────────────────────────────────────────── */}
      <header className="mb-10">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)] mb-2">
          Analytics
        </p>
        <h1 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] leading-tight text-[var(--fg-primary)]">
          Performance portali
        </h1>
        <p className="mt-2 text-[13px] text-[var(--fg-muted)] max-w-xl">
          Dove arrivano i lead e dove si generano le vendite reali.
        </p>
      </header>

      {/* ── KPI totali ───────────────────────────────────────────── */}
      {totals && (
        <div className="grid grid-cols-3 gap-6 mb-10 p-6 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
          <Stat label="Lead totali" value={totals.total} />
          <Stat label="Questo mese" value={totals.thisMonth} />
          <Stat
            label="Vinti"
            value={totals.won}
            sub={totals.total > 0 ? `${Math.round((totals.won / totals.total) * 100)}% conversione` : "—"}
          />
        </div>
      )}

      {/* ── Portali ──────────────────────────────────────────────── */}
      {portals.length > 0 && (
        <section className="mb-10">
          <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-4">
            Portali immobiliari
          </p>

          <div className="grid sm:grid-cols-3 gap-4">
            {portals.map((p, i) => (
              <div
                key={`${p.source}-${p.sourceDetail}`}
                className={`p-5 rounded-lg border transition-colors ${
                  i === 0
                    ? "border-[var(--accent-deep)]/30 bg-[var(--color-brass-glow)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-elevated)]"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <PortalBadge name={p.displayName} />
                  {i === 0 && topPortal?.totalLeads && topPortal.totalLeads > 0 && (
                    <span className="text-[10px] uppercase tracking-widest text-[var(--accent-deep)] font-medium">
                      Top ★
                    </span>
                  )}
                </div>

                <p className="font-display text-4xl text-[var(--fg-primary)] mb-1">
                  {p.totalLeads}
                </p>
                <p className="text-xs text-[var(--fg-secondary)] mb-4">
                  lead totali
                </p>

                <div className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--fg-muted)]">In trattativa</span>
                    <span className="font-medium text-[var(--fg-primary)]">{p.inNegotiation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--fg-muted)]">Vinti</span>
                    <span className="font-medium text-[var(--color-positive)]">{p.won}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--fg-muted)]">Conversione</span>
                    <span className="font-medium text-[var(--fg-primary)]">{p.conversionRate}%</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Placeholder per portali non ancora attivi */}
            {portals.length < 3 &&
              ["Immobiliare.it", "Idealista", "Casa.it"]
                .filter((name) => !portals.find((p) => p.displayName === name))
                .map((name) => (
                  <div
                    key={name}
                    className="p-5 rounded-lg border border-dashed border-[var(--border-subtle)] bg-[var(--bg-elevated)] opacity-50"
                  >
                    <PortalBadge name={name} />
                    <p className="font-display text-4xl text-[var(--fg-primary)] mt-4 mb-1">—</p>
                    <p className="text-xs text-[var(--fg-secondary)]">nessun lead ancora</p>
                  </div>
                ))}
          </div>
        </section>
      )}

      {/* ── Tutte le sorgenti ────────────────────────────────────── */}
      {stats.length > 0 && (
        <section>
          <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-4">
            Tutte le sorgenti
          </p>

          <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
                  <th className="text-left px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--fg-muted)] font-medium">
                    Sorgente
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--fg-muted)] font-medium">
                    Lead
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--fg-muted)] font-medium hidden sm:table-cell">
                    Trattativa
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--fg-muted)] font-medium">
                    Vinti
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--fg-muted)] font-medium hidden sm:table-cell">
                    Conv.
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.map((s, i) => (
                  <tr
                    key={`${s.source}-${s.sourceDetail}`}
                    className={`border-b border-[var(--border-subtle)] last:border-0 ${
                      i % 2 === 0 ? "bg-[var(--bg-canvas)]" : "bg-[var(--bg-elevated)]"
                    }`}
                  >
                    <td className="px-4 py-3">
                      <PortalBadge name={s.displayName} />
                    </td>
                    <td className="text-right px-4 py-3 font-medium text-[var(--fg-primary)]">
                      {s.totalLeads}
                    </td>
                    <td className="text-right px-4 py-3 text-[var(--fg-secondary)] hidden sm:table-cell">
                      {s.inNegotiation}
                    </td>
                    <td className="text-right px-4 py-3 font-medium text-[var(--color-positive)]">
                      {s.won > 0 ? s.won : "—"}
                    </td>
                    <td className="text-right px-4 py-3 text-[var(--fg-secondary)] hidden sm:table-cell">
                      {s.conversionRate > 0 ? `${s.conversionRate}%` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {stats.length === 0 && (
            <p className="text-center py-8 text-[13px] text-[var(--fg-muted)]">
              Nessun dato ancora. I lead tracciati con sorgente appariranno qui.
            </p>
          )}
        </section>
      )}

      {/* ── Empty state ───────────────────────────────────────────── */}
      {stats.length === 0 && (
        <div className="text-center py-16">
          <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
            Nessun dato
          </p>
          <p className="font-display text-2xl text-[var(--fg-primary)] mb-3">
            I dati arriveranno presto.
          </p>
          <p className="text-sm text-[var(--fg-secondary)] max-w-sm mx-auto">
            Quando i lead iniziano ad arrivare dai portali, vedrai qui le performance di ogni sorgente.
          </p>
        </div>
      )}
    </div>
  );
}
