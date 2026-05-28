// components/crm/lead-matching-properties.tsx
// Server Component — mostra immobili compatibili con le preferenze del lead
// Destinazione: apps/web/src/components/crm/lead-matching-properties.tsx

import Link from 'next/link'
import { getMatchingPropertiesForLead } from '@/lib/queries/lead-match'

interface Props {
  leadId: string
}

const LISTING_LABEL: Record<string, string> = {
  sale: 'Vendita',
  rent: 'Affitto',
}

function formatPrice(price: number | null, type: string): string {
  if (!price) return '—'
  const formatted = new Intl.NumberFormat('it-IT', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(price)
  return type === 'rent' ? `${formatted}/mese` : formatted
}

export async function LeadMatchingProperties({ leadId }: Props) {
  const properties = await getMatchingPropertiesForLead(leadId)

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6 transition-shadow duration-300 hover:shadow-[0_14px_44px_-24px_rgba(24,20,16,0.18)] animate-in-card [animation-delay:120ms]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-[20px] text-[var(--fg-primary)]">
          Immobili compatibili
        </h2>
        {properties.length > 0 && (
          <span className="text-[11px] font-mono uppercase tracking-wide text-[var(--fg-muted)] bg-[var(--bg-sunken)] px-2 py-1 rounded-full">
            {properties.length} trovati
          </span>
        )}
      </div>

      {properties.length === 0 ? (
        <p className="text-[13px] text-[var(--fg-muted)] italic">
          Nessun immobile compatibile. Aggiorna le preferenze di ricerca o aggiungi nuovi immobili.
        </p>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <Link
              key={p.id}
              href={`/admin/properties/${p.id}/photos`}
              className="flex items-center gap-4 p-3 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--fg-primary)]/30 hover:bg-[var(--bg-elevated)] transition-all duration-150 group"
            >
              {/* Cover photo */}
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--bg-sunken)] flex-shrink-0">
                {p.photos[0] ? (
                  <img
                    src={p.photos[0]}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--fg-muted)]">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--fg-primary)] truncate group-hover:text-[var(--fg-primary)] transition-colors">
                  {p.title}
                </p>
                <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                  {p.city ?? '—'}
                  {p.rooms ? ` · ${p.rooms} camere` : ''}
                  {p.sqm ? ` · ${p.sqm} mq` : ''}
                </p>
              </div>

              {/* Price + type */}
              <div className="text-right flex-shrink-0">
                <p className="text-[13px] font-semibold text-[var(--fg-primary)]">
                  {formatPrice(p.priceEur, p.listingType)}
                </p>
                <p className="text-[10px] text-[var(--fg-muted)] uppercase tracking-wide mt-0.5">
                  {LISTING_LABEL[p.listingType] ?? p.listingType}
                </p>
              </div>

              <svg className="w-4 h-4 text-[var(--fg-muted)] group-hover:text-[var(--fg-primary)] transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
