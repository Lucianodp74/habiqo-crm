// components/crm/property-matching-leads.tsx
// Server Component — lead compatibili con un immobile + WhatsApp outreach

import Link from 'next/link'
import { getMatchingLeadsForProperty } from '@/lib/queries/lead-match'
import { computeStaleness, buildWhatsAppLink, whatsappTemplate } from '@/lib/funnel/staleness'

interface Props {
  propertyId:   string
  propertyCity: string | null
  priceEur:     number | null
  rooms:        number | null
  sqm:          number | null
  listingType:  string
}

// ── Punteggio compatibilità (JS puro, 0-5) ──────────────────────

function compatibilityScore(
  lead: {
    preferredCity:   string | null
    budgetMinEur:    number | null
    budgetMaxEur:    number | null
  },
  property: {
    propertyCity: string | null
    priceEur:     number | null
    listingType:  string
    rooms:        number | null
    sqm:          number | null
  }
): number {
  let score = 0

  // Città — +1 se corrisponde o non specificata
  if (!lead.preferredCity || !property.propertyCity) {
    score++ // non penalizzare se non compilato
  } else if (lead.preferredCity.toLowerCase() === property.propertyCity.toLowerCase()) {
    score++
  }

  // Budget — +1 se il prezzo è nel range
  if (!lead.budgetMinEur && !lead.budgetMaxEur) {
    score++ // non penalizzare se non compilato
  } else if (property.priceEur !== null) {
    const inMin = !lead.budgetMinEur || property.priceEur >= lead.budgetMinEur
    const inMax = !lead.budgetMaxEur || property.priceEur <= lead.budgetMaxEur
    if (inMin && inMax) score++
  }

  // Tipo operazione — sempre +1 (già filtrato dalla query)
  score++

  // Camere — +1 se non specificato (già filtrato)
  score++

  // Superficie — +1 se non specificato (già filtrato)
  score++

  return Math.min(score, 5)
}

// ── Barra punteggio ──────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Compatibilità ${score} su 5`}>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-4 h-1.5 rounded-full ${
              i <= score ? 'bg-[var(--color-brass)]' : 'bg-[var(--border-subtle)]'
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] font-mono text-[var(--fg-muted)]">{score}/5</span>
    </div>
  )
}

// ── Status badge ─────────────────────────────────────────────────

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

// ── Formato budget ────────────────────────────────────────────────

function formatBudget(min: number | null, max: number | null): string {
  const fmt = (v: number) =>
    new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(v)

  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (max) return `fino a ${fmt(max)}`
  if (min) return `da ${fmt(min)}`
  return 'Budget non specificato'
}

// ── Componente principale ─────────────────────────────────────────

export async function PropertyMatchingLeads({
  propertyId,
  propertyCity,
  priceEur,
  rooms,
  sqm,
  listingType,
}: Props) {
  const leads = await getMatchingLeadsForProperty(propertyId)

  if (leads.length === 0) {
    return (
      <section className="mt-10">
        <h2 className="text-[18px] font-display text-[var(--fg-primary)] mb-2">
          Lead compatibili
        </h2>
        <div className="rounded-2xl border border-dashed border-[var(--border-subtle)] p-6 text-center">
          <p className="text-[13px] text-[var(--fg-muted)] italic mb-3">
            Nessun lead compatibile trovato. Assicurati che i lead abbiano le preferenze di ricerca compilate.
          </p>
          <Link
            href="/crm/leads"
            className="text-[12px] text-[var(--accent-deep)] hover:underline"
          >
            Vai ai lead →
          </Link>
        </div>
      </section>
    )
  }

  // Ordina per punteggio decrescente
  const leadsWithScore = leads
    .map((lead) => ({
      ...lead,
      score: compatibilityScore(lead, { propertyCity, priceEur, listingType, rooms, sqm }),
    }))
    .sort((a, b) => b.score - a.score)

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-[18px] font-display text-[var(--fg-primary)]">
            Lead compatibili
          </h2>
          <p className="text-[12px] text-[var(--fg-muted)] mt-0.5">
            Lead con preferenze di ricerca compatibili con questo immobile.
          </p>
        </div>
        <span className="text-[11px] font-mono text-[var(--fg-muted)] bg-[var(--bg-sunken)] px-2 py-1 rounded-full">
          {leads.length} lead
        </span>
      </div>

      <div className="space-y-3">
        {leadsWithScore.map((lead) => {
          const staleness = computeStaleness(
            lead.status,
            lead.lastActivityAt,
            lead.updatedAt,
            null,
          )

          const message = whatsappTemplate(
            lead.status,
            lead.fullName,
            'Agente',
            '',
          )
          const waHref = buildWhatsAppLink(lead.phone, lead.whatsapp, message)

          return (
            <div
              key={lead.id}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 hover:border-[var(--color-brass)]/30 transition-colors"
            >
              {/* Top row — avatar, nome, status */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[var(--bg-sunken)] flex items-center justify-center flex-shrink-0">
                  <span className="text-[13px] font-semibold text-[var(--fg-secondary)]">
                    {lead.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[14px] font-semibold text-[var(--fg-primary)] truncate">
                      {lead.fullName}
                    </p>
                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                        STATUS_COLOR[lead.status] ?? 'bg-stone-50 text-stone-600'
                      }`}
                    >
                      {STATUS_LABEL[lead.status] ?? lead.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                    {lead.preferredCity ?? 'Città non specificata'}
                    {' · '}
                    {formatBudget(lead.budgetMinEur, lead.budgetMaxEur)}
                  </p>
                </div>
              </div>

              {/* Middle row — punteggio + inattività */}
              <div className="flex items-center gap-4 mb-3 pl-12">
                <ScoreBar score={lead.score} />
                <span className="text-[11px] text-[var(--fg-muted)]">
                  {staleness.isStale ? (
                    <span className="text-orange-600 font-medium">
                      inattivo {staleness.daysSinceActivity}gg
                    </span>
                  ) : (
                    <span>attivo {staleness.label}</span>
                  )}
                </span>
              </div>

              {/* Bottom row — azioni */}
              <div className="flex items-center gap-2 pl-12">
                <Link
                  href={`/crm/leads/${lead.id}`}
                  className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--fg-secondary)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1.5 rounded-lg hover:bg-[var(--bg-sunken)] transition-colors"
                >
                  Apri scheda
                </Link>

                {waHref ? (
                  <a
                    href={waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.533 5.856L.057 23.214a.75.75 0 0 0 .93.93l5.356-1.476A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.535-5.21-1.463l-.373-.223-3.876 1.068 1.068-3.877-.222-.372A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    WhatsApp
                  </a>
                ) : (
                  <span className="text-[11px] text-[var(--fg-muted)] px-3 py-1.5">
                    No numero
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
