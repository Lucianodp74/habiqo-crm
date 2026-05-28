import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDashboardData } from '@/lib/queries/dashboard'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { LeadsChart } from '@/components/dashboard/leads-chart'

export const metadata = { title: 'Dashboard · Habiquo' }

const STATUS_LABEL: Record<string, string> = {
  new:             'Nuovo',
  qualified:       'Qualificato',
  visit_scheduled: 'Visita',
  in_negotiation:  'Trattativa',
  won:             'Vinto',
  lost:            'Perso',
}

const STATUS_COLOR: Record<string, string> = {
  new:             'bg-blue-50 text-blue-700',
  qualified:       'bg-emerald-50 text-emerald-700',
  visit_scheduled: 'bg-amber-50 text-amber-700',
  in_negotiation:  'bg-purple-50 text-purple-700',
  won:             'bg-green-50 text-green-700',
  lost:            'bg-red-50 text-red-700',
}

const APT_ICON: Record<string, string> = {
  visit:   '🏠',
  call:    '📞',
  meeting: '🤝',
  signing: '✍️',
  other:   '📅',
}

function formatPrice(price: number | null, type: string): string {
  if (!price) return '—'
  const f = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price)
  return type === 'rent' ? f + '/mese' : f
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'oggi'
  if (days === 1) return 'ieri'
  return `${days}gg fa`
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  if (!data) redirect('/login')

  const { kpis, recentLeads, recentProps, appointments, agencyName, chartData } = data

  const today = new Intl.DateTimeFormat('it-IT', {
    weekday: 'long', day: '2-digit', month: 'long',
  }).format(new Date())

  return (
    <div className="px-4 sm:px-8 py-8 max-w-7xl mx-auto">

      {/* Header */}
      <header className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-muted)] mb-2">
          Dashboard · {today}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-[clamp(1.8rem,4vw,2.4rem)] text-[var(--fg-primary)] leading-tight">
              {agencyName}
            </h1>
            <p className="text-[13px] text-[var(--fg-muted)] mt-1">
              Panoramica operativa della tua agenzia.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/crm/leads"
              className="px-4 py-2 text-[13px] font-medium border border-[var(--border-subtle)] text-[var(--fg-secondary)] rounded-xl hover:bg-[var(--bg-elevated)] transition-colors">
              Lead
            </Link>
            <Link href="/admin/properties"
              className="px-4 py-2 text-[13px] font-medium bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-xl hover:opacity-90 transition-opacity">
              Immobili
            </Link>
          </div>
        </div>
      </header>

      {/* KPI Grid */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <KpiCard
          label="Lead attivi"
          value={kpis.activeLeads}
          icon="👥"
          sublabel="in pipeline"
          accent
        />
        <KpiCard
          label="Immobili"
          value={kpis.publishedProps}
          icon="🏠"
          sublabel="pubblicati"
        />
        <KpiCard
          label="Nuovi 30gg"
          value={kpis.newLeads30d}
          icon="📈"
          sublabel="lead ricevuti"
        />
        <KpiCard
          label="Render AI"
          value={kpis.rendersCompleted}
          icon="✨"
          sublabel="completati"
        />
        <KpiCard
          label="Appuntamenti"
          value={kpis.appointmentsToday}
          icon="📅"
          sublabel="oggi"
        />
        <KpiCard
          label="Match attivi"
          value={kpis.leadsWithPrefs}
          icon="🎯"
          sublabel="lead con preferenze"
        />
      </section>

      {/* Grafico lead */}
      <section className="mb-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-[18px] text-[var(--fg-primary)]">Lead ultimi 30 giorni</h2>
            <p className="text-[12px] text-[var(--fg-muted)] mt-0.5">{kpis.newLeads30d} lead ricevuti</p>
          </div>
        </div>
        <LeadsChart data={chartData} />
      </section>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left col — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Ultimi lead */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[18px] text-[var(--fg-primary)]">Ultimi lead</h2>
              <Link href="/crm/leads" className="text-[12px] text-[var(--accent-deep)] hover:underline">
                Vedi tutti →
              </Link>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden">
              {recentLeads.length === 0 ? (
                <p className="text-[13px] text-[var(--fg-muted)] italic p-5">Nessun lead ancora.</p>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {recentLeads.map(lead => (
                    <Link key={lead.id} href={`/crm/leads/${lead.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg-sunken)] transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center flex-shrink-0">
                        <span className="text-[13px] font-medium text-[var(--fg-secondary)]">
                          {(lead.full_name ?? '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[var(--fg-primary)] truncate">
                          {lead.full_name ?? 'Senza nome'}
                        </p>
                        <p className="text-[11px] text-[var(--fg-muted)]">
                          {lead.source} · {timeAgo(lead.created_at)}
                        </p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[lead.status] ?? 'bg-stone-50 text-stone-600'}`}>
                        {STATUS_LABEL[lead.status] ?? lead.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Immobili recenti */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[18px] text-[var(--fg-primary)]">Immobili pubblicati</h2>
              <Link href="/admin/properties" className="text-[12px] text-[var(--accent-deep)] hover:underline">
                Vedi tutti →
              </Link>
            </div>
            <div className="space-y-2">
              {recentProps.length === 0 ? (
                <p className="text-[13px] text-[var(--fg-muted)] italic">Nessun immobile pubblicato.</p>
              ) : (
                recentProps.map(prop => (
                  <Link key={prop.id} href={`/admin/properties/${prop.id}/photos`}
                    className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--fg-primary)]/20 hover:bg-[var(--bg-sunken)] transition-all group">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--bg-sunken)] flex-shrink-0">
                      {prop.photos[0] ? (
                        <img src={prop.photos[0]} alt={prop.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--fg-muted)] text-lg">🏠</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--fg-primary)] truncate">{prop.title}</p>
                      <p className="text-[11px] text-[var(--fg-muted)]">{prop.city ?? '—'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[13px] font-semibold text-[var(--fg-primary)]">
                        {formatPrice(prop.price_eur, prop.listing_type)}
                      </p>
                      {prop.published_at && (
                        <p className="text-[11px] text-[var(--fg-muted)]">{formatDate(prop.published_at)}</p>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

        </div>

        {/* Right col — 1/3 */}
        <div className="space-y-6">

          {/* Appuntamenti oggi */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-[18px] text-[var(--fg-primary)]">Agenda</h2>
              <Link href="/dashboard/agenda" className="text-[12px] text-[var(--accent-deep)] hover:underline">
                Apri →
              </Link>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] overflow-hidden">
              {appointments.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="text-2xl mb-2">📅</p>
                  <p className="text-[12px] text-[var(--fg-muted)]">Nessun appuntamento oggi.</p>
                  <Link href="/dashboard/agenda"
                    className="inline-block mt-2 text-[12px] text-[var(--accent-deep)] hover:underline">
                    + Nuovo appuntamento
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)]">
                  {appointments.map(apt => (
                    <div key={apt.id} className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <span className="text-base flex-shrink-0 mt-0.5">
                          {APT_ICON[apt.type] ?? '📅'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[var(--fg-primary)] truncate">{apt.title}</p>
                          {apt.leads?.full_name && (
                            <p className="text-[11px] text-[var(--fg-muted)] truncate">{apt.leads.full_name}</p>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--fg-muted)] flex-shrink-0">
                          {formatTime(apt.scheduled_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Quick actions */}
          <section>
            <h2 className="font-display text-[18px] text-[var(--fg-primary)] mb-3">Azioni rapide</h2>
            <div className="space-y-2">
              {[
                { href: '/crm/leads',          label: '+ Nuovo lead',          icon: '👤' },
                { href: '/admin/properties/new-ai', label: '+ Nuovo immobile', icon: '🏠' },
                { href: '/dashboard/agenda',    label: '+ Appuntamento',        icon: '📅' },
              ].map(action => (
                <Link key={action.href} href={action.href}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--fg-primary)]/20 hover:bg-[var(--bg-sunken)] transition-all text-[13px] font-medium text-[var(--fg-secondary)]">
                  <span>{action.icon}</span>
                  {action.label}
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}




