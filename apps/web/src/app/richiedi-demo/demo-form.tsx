'use client'
// app/richiedi-demo/demo-form.tsx

import { useState, useTransition } from 'react'

const inputClass = `w-full h-11 px-4 text-[14px] rounded-xl border border-[#e8e5df]
  bg-white text-[#1a1a18] focus:outline-none focus:border-[#1a1a18]
  transition-colors placeholder:text-[#b8b4ae]`

const labelClass = 'block text-[11px] font-mono uppercase tracking-[0.16em] text-[#9a9490] mb-1.5'

export function DemoForm() {
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')
  const [isPending, start]  = useTransition()

  const [form, setForm] = useState({
    nome:     '',
    cognome:  '',
    agenzia:  '',
    email:    '',
    telefono: '',
    citta:    '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit() {
    if (!form.nome || !form.email || !form.agenzia) {
      setError('Compila i campi obbligatori: nome, email e agenzia.')
      return
    }
    setError('')
    start(async () => {
      try {
        const res = await fetch('/api/demo-request', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(form),
        })
        if (res.ok) {
          setSent(true)
        } else {
          setError('Errore nell\'invio. Riprova o scrivi a info@habiquo.it')
        }
      } catch {
        setError('Errore di connessione. Riprova tra qualche secondo.')
      }
    })
  }

  if (sent) {
    return (
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-full bg-[rgba(166,124,82,0.1)] flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a67c52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h3 className="text-[20px] font-bold text-[#1a1a18] mb-2">Richiesta inviata.</h3>
        <p className="text-[14px] text-[#6b6660]" style={{ fontFamily: 'system-ui, sans-serif' }}>
          Ti contatteremo entro 24 ore per organizzare la demo privata.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Nome *</label>
          <input name="nome" type="text" placeholder="Mario" value={form.nome} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Cognome</label>
          <input name="cognome" type="text" placeholder="Rossi" value={form.cognome} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Agenzia *</label>
        <input name="agenzia" type="text" placeholder="Immobiliare Rossi" value={form.agenzia} onChange={handleChange} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Email *</label>
        <input name="email" type="email" placeholder="mario@agenzia.it" value={form.email} onChange={handleChange} className={inputClass} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>Telefono</label>
          <input name="telefono" type="tel" placeholder="+39 333 1234567" value={form.telefono} onChange={handleChange} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Città</label>
          <input name="citta" type="text" placeholder="Milano" value={form.citta} onChange={handleChange} className={inputClass} />
        </div>
      </div>

      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 px-4 py-3 rounded-xl" style={{ fontFamily: 'system-ui, sans-serif' }}>
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={isPending}
        className="w-full h-12 bg-[#1a1a18] text-white text-[14px] font-semibold rounded-xl hover:bg-[#2d2d2a] transition-colors disabled:opacity-50 mt-2"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        {isPending ? 'Invio in corso...' : 'Richiedi una demo privata →'}
      </button>

      <p className="text-center text-[11px] text-[#b8b4ae]" style={{ fontFamily: 'system-ui, sans-serif' }}>
        Nessuna carta di credito. Accesso limitato a poche agenzie selezionate.
      </p>
    </div>
  )
}
