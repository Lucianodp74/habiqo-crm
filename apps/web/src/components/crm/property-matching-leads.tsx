// components/crm/property-matching-leads.tsx
// Server Component — mostra lead compatibili con un immobile
// Destinazione: apps/web/src/components/crm/property-matching-leads.tsx

import Link from 'next/link'
import { getMatchingLeadsForProperty } from '@/lib/queries/lead-match'

interface Props {
  propertyId: string
}

const STATUS_LABEL: Record<string, string> = {
  new:            'Nuovo',
  qualified:      'Qualificato',
  visit_scheduled: 'Visita',
  in_negotiation: 'Trattativa',
  won:            'Vinto',
  lost:           'Perso',
}

const STATUS_COLOR: Record<string, string> = {
  new:             'bg-blue-50 text-blue-700',
  qualified:       'bg-emerald-50 text-emerald-700',
  visit_scheduled: 'bg-amber-50 text-amber-700',
  in_negotiation:  'bg-purple-50 text-purple-700',
  won:             'bg-green-50 text-green-700',
  lost:            'bg-red-50 text-red-700',
}

export async function PropertyMatchingLeads({ propertyId }: Props) {
  const leads = await getMatchingLeadsForProperty(propertyId)

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            Lead compatibili
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Lead con preferenze di ricerca compatibili con questo immobile.
          </p>
        </div>
        {leads.length > 0 && (
          <span className="text-xs font-mono uppercase tracking-wide text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
            {leads.length} lead
          </span>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="border border-neutral-100 rounded-2xl p-6 text-center">
          <p className="text-sm text-neutral-400 italic">
            Nessun lead compatibile trovato. Assicurati che i lead abbiano le preferenze di ricerca compilate.
          </p>
          <Link
            href="/crm/leads"
            className="inline-block mt-3 text-xs text-neutral-600 hover:text-neutral-900 underline transition-colors"
          >
            Vai ai lead →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <Link
              key={lead.id}
              href={`/crm/leads/${lead.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border border-neutral-100 hover:border-neutral-300 hover:bg-stone-50 transition-all duration-150 group"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-neutral-600">
                  {lead.fullName.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">
                  {lead.fullName}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5 truncate">
                  {lead.email ?? lead.phone ?? '—'}
                </p>
              </div>

              {/* Status */}
              <span className={`text-[10px] font-medium px-2 py-1 rounded-full flex-shrink-0 ${STATUS_COLOR[lead.status] ?? 'bg-neutral-100 text-neutral-600'}`}>
                {STATUS_LABEL[lead.status] ?? lead.status}
              </span>

              <svg className="w-4 h-4 text-neutral-300 group-hover:text-neutral-600 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
