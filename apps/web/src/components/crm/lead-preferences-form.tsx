'use client'

import { useState, useTransition } from 'react'
import { updateLead } from '@/lib/actions/leads'

interface Props {
  leadId: string
  initial: {
    preferredCity:         string | null
    preferredListingType:  string | null
    preferredRoomsMin:     number | null
    preferredSqmMin:       number | null
  }
}

const LISTING_TYPES = [
  { value: '',     label: 'Non specificato' },
  { value: 'sale', label: 'Acquisto'        },
  { value: 'rent', label: 'Affitto'         },
]

export function LeadPreferencesForm({ leadId, initial }: Props) {
  const [city,        setCity]        = useState(initial.preferredCity        ?? '')
  const [listingType, setListingType] = useState(initial.preferredListingType ?? '')
  const [roomsMin,    setRoomsMin]    = useState(String(initial.preferredRoomsMin ?? ''))
  const [sqmMin,      setSqmMin]      = useState(String(initial.preferredSqmMin   ?? ''))
  const [saved,       setSaved]       = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [isPending,   start]          = useTransition()

  function handleSave() {
    setError(null)
    setSaved(false)
    start(async () => {
      const result = await updateLead({
        id:                    leadId,
        preferredCity:         city.trim()    || null,
        preferredListingType:  listingType    || null,
        preferredRoomsMin:     roomsMin ? parseInt(roomsMin) : null,
        preferredSqmMin:       sqmMin   ? parseInt(sqmMin)   : null,
      })
      if (result.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        setError('error' in result ? (result as { error: { message?: string } }).error?.message ?? 'Errore salvataggio' : 'Errore salvataggio')
      }
    })
  }

  const inputClass = `w-full px-3 py-2 text-[13px] rounded-xl border border-[var(--border-subtle)]
    bg-[var(--bg-canvas)] text-[var(--fg-primary)] focus:outline-none
    focus:border-[var(--fg-primary)] transition-colors placeholder:text-[var(--fg-muted)]`

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6 transition-shadow duration-300 hover:shadow-[0_14px_44px_-24px_rgba(24,20,16,0.18)] animate-in-card [animation-delay:100ms]">
      <h2 className="font-display text-[20px] text-[var(--fg-primary)] mb-5">
        Preferenze di ricerca
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <div>
          <label className="text-[11px] font-mono uppercase tracking-wide text-[var(--fg-muted)] block mb-1.5">
            Città preferita
          </label>
          <input
            type="text"
            placeholder="es. Taranto"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase tracking-wide text-[var(--fg-muted)] block mb-1.5">
            Tipo operazione
          </label>
          <select
            value={listingType}
            onChange={(e) => setListingType(e.target.value)}
            className={inputClass}
          >
            {LISTING_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase tracking-wide text-[var(--fg-muted)] block mb-1.5">
            Camere minime
          </label>
          <input
            type="number"
            placeholder="es. 3"
            min={1}
            max={20}
            value={roomsMin}
            onChange={(e) => setRoomsMin(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-[11px] font-mono uppercase tracking-wide text-[var(--fg-muted)] block mb-1.5">
            Superficie minima (mq)
          </label>
          <input
            type="number"
            placeholder="es. 80"
            min={1}
            max={1000}
            value={sqmMin}
            onChange={(e) => setSqmMin(e.target.value)}
            className={inputClass}
          />
        </div>

      </div>

      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-5 py-2 bg-[var(--fg-primary)] text-[var(--bg-canvas)] text-[13px] font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? 'Salvataggio...' : 'Salva preferenze'}
        </button>

        {saved && (
          <span className="text-[12px] text-emerald-600 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Salvato
          </span>
        )}

        {error && (
          <span className="text-[12px] text-red-600">{error}</span>
        )}
      </div>
    </section>
  )
}
