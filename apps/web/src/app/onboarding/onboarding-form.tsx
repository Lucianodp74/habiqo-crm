'use client'
// app/onboarding/onboarding-form.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  agencyId:    string
  initialName:  string
  initialCity:  string
  initialPhone: string
}

async function saveAgency(agencyId: string, data: {
  name:  string
  city:  string
  phone: string
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch('/api/onboarding/agency', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agencyId, ...data }),
  })
  if (!res.ok) {
    const j = await res.json()
    return { ok: false, error: j.error ?? 'Errore salvataggio' }
  }
  return { ok: true }
}

export function OnboardingForm({ agencyId, initialName, initialCity, initialPhone }: Props) {
  const [name,  setName]  = useState(initialName)
  const [city,  setCity]  = useState(initialCity)
  const [phone, setPhone] = useState(initialPhone)
  const [error, setError] = useState('')
  const [isPending, start] = useTransition()
  const router = useRouter()

  function handleSubmit() {
    if (!name.trim()) { setError('Inserisci il nome dell\'agenzia'); return }
    setError('')
    start(async () => {
      const result = await saveAgency(agencyId, {
        name:  name.trim(),
        city:  city.trim(),
        phone: phone.trim(),
      })
      if (result.ok) {
        router.push('/dashboard')
      } else {
        setError(result.error ?? 'Errore')
      }
    })
  }

  const inputClass = `w-full h-11 px-4 text-[14px] rounded-xl border border-[var(--border-subtle)]
    bg-[var(--bg-elevated)] text-[var(--fg-primary)] focus:outline-none
    focus:border-[var(--fg-primary)] transition-colors placeholder:text-[var(--fg-muted)]`

  const labelClass = 'block text-[11px] font-mono uppercase tracking-[0.16em] text-[var(--fg-muted)] mb-1.5'

  return (
    <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-5">

      <div>
        <label className={labelClass}>Nome agenzia *</label>
        <input
          type="text"
          placeholder="Immobiliare Rossi"
          value={name}
          onChange={e => setName(e.target.value)}
          className={inputClass}
          autoFocus
        />
      </div>

      <div>
        <label className={labelClass}>Città</label>
        <input
          type="text"
          placeholder="Milano"
          value={city}
          onChange={e => setCity(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Telefono</label>
        <input
          type="tel"
          placeholder="+39 02 1234567"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full h-11 bg-[var(--fg-primary)] text-[var(--bg-canvas)] text-[14px] font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isPending ? 'Salvataggio...' : 'Inizia a usare Habiquo →'}
      </button>

      <button
        onClick={() => router.push('/dashboard')}
        disabled={isPending}
        className="w-full text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg-secondary)] transition-colors"
      >
        Salta per ora
      </button>

    </div>
  )
}
