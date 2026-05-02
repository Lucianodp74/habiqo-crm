import Link from "next/link";
import { Button, Pill } from "@habiqo/ui";
import { AiValuationWidget } from "./valuation-widget";

export const metadata = { title: "Dashboard" };

type LeadStatus = "Nuovo" | "Da richiamare" | "Visita fissata" | "Caldo";

const stats = [
  { label: "Active properties", value: "126", hint: "in esclusiva: 41", tone: "neutral" as const },
  { label: "Leads (7d)", value: "38", hint: "+12% vs settimana scorsa", tone: "positive" as const },
  { label: "Appointments", value: "7", hint: "oggi · 3 visite, 2 call", tone: "brass" as const },
  { label: "Conversion rate", value: "12,6%", hint: "lead → proposta", tone: "neutral" as const },
] as const;

const recentLeads: Array<{
  name: string;
  city: string;
  budget: string;
  status: LeadStatus;
  source: string;
  lastTouch: string;
}> = [
  {
    name: "Alessandra Vitale",
    city: "Milano",
    budget: "€ 900k–1,2M",
    status: "Visita fissata",
    source: "Portale",
    lastTouch: "oggi · 11:02",
  },
  {
    name: "Riccardo Galli",
    city: "Roma",
    budget: "€ 650k–850k",
    status: "Caldo",
    source: "Referral",
    lastTouch: "ieri · 19:18",
  },
  {
    name: "Martina De Luca",
    city: "Torino",
    budget: "€ 350k–450k",
    status: "Da richiamare",
    source: "WhatsApp",
    lastTouch: "ieri · 09:44",
  },
  {
    name: "Lorenzo Bianchi",
    city: "Firenze",
    budget: "€ 700k–950k",
    status: "Nuovo",
    source: "Sito",
    lastTouch: "2 gg fa",
  },
];

function leadTone(status: LeadStatus): "neutral" | "warm" | "positive" | "danger" | "brass" {
  if (status === "Caldo") return "brass";
  if (status === "Visita fissata") return "positive";
  if (status === "Da richiamare") return "warm";
  return "neutral";
}

export default function DashboardPage() {
  const today = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "2-digit", month: "long" }).format(
    new Date(),
  );

  return (
    <div className="px-5 py-6 lg:px-10 lg:py-8">
      <header className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)]">
              Dashboard · {today}
            </p>
            <h1 className="font-display text-[34px] leading-[1.05] tracking-tight mt-2">
              Real estate performance
              <span className="italic text-[var(--accent-deep)]">.</span>
            </h1>
            <p className="text-[14px] text-[var(--fg-secondary)] mt-2 max-w-2xl">
              Una vista premium su immobili, lead e attività. Dati realistici demo, UI pronta per collegarsi al DB.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/crm">
              <Button intent="secondary" size="md">
                Apri leads
              </Button>
            </Link>
            <Link href="/ai-assistant">
              <Button intent="brass" size="md">
                AI Assistant
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Stats cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-10">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 relative overflow-hidden"
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.55]"
              style={{
                background:
                  "radial-gradient(900px 220px at 0% 0%, rgba(167,122,69,0.12), transparent 60%), radial-gradient(700px 200px at 100% 100%, rgba(16,13,9,0.10), transparent 55%)",
              }}
            />
            <div className="relative">
              <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-[var(--fg-muted)]">{s.label}</p>
              <div className="flex items-end justify-between mt-3">
                <div className="font-display text-[28px] leading-none">{s.value}</div>
                <Pill tone={s.tone}>{s.tone === "positive" ? "in crescita" : s.tone === "brass" ? "oggi" : "—"}</Pill>
              </div>
              <p className="text-[12.5px] text-[var(--fg-secondary)] mt-2">{s.hint}</p>
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Recent leads table */}
        <section className="xl:col-span-8">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)]">Leads</p>
              <h2 className="font-display text-[22px] leading-tight mt-1">Recent leads</h2>
            </div>
            <Link href="/crm" className="text-[13px] text-[var(--accent-deep)] underline underline-offset-4">
              Apri CRM
            </Link>
          </div>

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full">
                <thead>
                  <tr className="bg-[var(--bg-sunken)] border-b border-[var(--border-subtle)]">
                    {["Lead", "Città", "Budget", "Stato", "Fonte", "Ultimo contatto"].map((h) => (
                      <th
                        key={h}
                        className="text-left font-mono text-[10px] tracking-[0.18em] uppercase text-[var(--fg-muted)] px-4 py-3"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map((l) => (
                    <tr
                      key={l.name}
                      className="border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-sunken)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="text-[13.5px] font-medium">{l.name}</div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-secondary)]">{l.city}</td>
                      <td className="px-4 py-3 text-[13px]">{l.budget}</td>
                      <td className="px-4 py-3">
                        <Pill tone={leadTone(l.status)} dot>
                          {l.status}
                        </Pill>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-secondary)]">{l.source}</td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-muted)]">{l.lastTouch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* AI valuation widget */}
        <aside className="xl:col-span-4 space-y-6">
          <AiValuationWidget />

          <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)]">Next actions</p>
            <h3 className="font-display text-[20px] leading-tight mt-1">Oggi</h3>
            <div className="mt-3 grid grid-cols-1 gap-2">
              {[
                "Invia proposta per MI-0274 (Porta Nuova)",
                "Conferma visita · Alessandra Vitale",
                "Follow-up WhatsApp · Martina De Luca",
              ].map((t) => (
                <div
                  key={t}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-3 py-2 text-[12.5px] text-[var(--fg-secondary)]"
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

