'use client'

import { useState, useCallback, useEffect } from 'react'

// ── Tipi ────────────────────────────────────────────────────────

type Lead     = { id: string; full_name: string | null }
type Property = { id: string; title: string }

type Appointment = {
  id:           string
  title:        string
  type:         string
  scheduled_at: string
  duration_min: number
  notes:        string | null
  lead_id:      string | null
  property_id:  string | null
  created_by:   string
  leads:        { full_name: string | null } | null
  properties:   { title: string } | null
}

interface Props {
  leads:      Lead[]
  properties: Property[]
}

// ── Config ───────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: 'visit',   label: 'Visita immobile', icon: '🏠' },
  { value: 'call',    label: 'Telefonata',       icon: '📞' },
  { value: 'meeting', label: 'Incontro',         icon: '🤝' },
  { value: 'signing', label: 'Firma',            icon: '✍️' },
  { value: 'other',   label: 'Altro',            icon: '📅' },
]

const TYPE_COLORS: Record<string, string> = {
  visit:   'bg-blue-50 text-blue-700 border-blue-100',
  call:    'bg-green-50 text-green-700 border-green-100',
  meeting: 'bg-amber-50 text-amber-700 border-amber-100',
  signing: 'bg-purple-50 text-purple-700 border-purple-100',
  other:   'bg-stone-50 text-stone-600 border-stone-100',
}

function typeLabel(type: string) {
  return TYPE_OPTIONS.find(t => t.value === type)?.label ?? type
}

function typeIcon(type: string) {
  return TYPE_OPTIONS.find(t => t.value === type)?.icon ?? '📅'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
}

function isToday(iso: string) {
  const d = new Date(iso)
  const t = new Date()
  return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear()
}

function isPast(iso: string) {
  return new Date(iso) < new Date()
}

// ── Form di creazione ─────────────────────────────────────────────

function NewAppointmentForm({
  leads, properties, onCreated, onCancel,
}: {
  leads: Lead[]
  properties: Property[]
  onCreated: (apt: Appointment) => void
  onCancel: () => void
}) {
  const [title,       setTitle]      = useState('')
  const [type,        setType]       = useState('visit')
  const [date,        setDate]       = useState('')
  const [time,        setTime]       = useState('10:00')
  const [duration,    setDuration]   = useState('60')
  const [notes,       setNotes]      = useState('')
  const [leadId,      setLeadId]     = useState('')
  const [propertyId,  setPropertyId] = useState('')
  const [saving,      setSaving]     = useState(false)
  const [error,       setError]      = useState('')

  async function handleSubmit() {
    if (!title.trim()) { setError('Inserisci un titolo'); return }
    if (!date)         { setError('Inserisci una data');  return }

    setSaving(true)
    setError('')
    try {
      const scheduled_at = new Date(date + 'T' + time + ':00').toISOString()
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, type, scheduled_at,
          duration_min: parseInt(duration) || 60,
          notes:        notes.trim() || null,
          lead_id:      leadId     || null,
          property_id:  propertyId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Errore'); return }
      onCreated(data.appointment)
    } catch (_e) {
      setError('Errore di rete')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full px-3 py-2 text-[13px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--fg-primary)] focus:outline-none focus:border-[var(--fg-primary)] transition-colors'
  const labelClass = 'text-[11px] font-mono uppercase tracking-wide text-[var(--fg-muted)] block mb-1'

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 mb-6">
      <h2 className="font-display text-[18px] text-[var(--fg-primary)] mb-5">Nuovo appuntamento</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelClass}>Titolo *</label>
          <input type="text" placeholder="es. Visita trilocale Rossi" value={title}
            onChange={e => setTitle(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Tipo</label>
          <select value={type} onChange={e => setType(e.target.value)} className={inputClass}>
            {TYPE_OPTIONS.map(t => (
              <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Durata (minuti)</label>
          <select value={duration} onChange={e => setDuration(e.target.value)} className={inputClass}>
            <option value="30">30 minuti</option>
            <option value="60">1 ora</option>
            <option value="90">1 ora e mezza</option>
            <option value="120">2 ore</option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Data *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Orario</label>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Lead collegato</label>
          <select value={leadId} onChange={e => setLeadId(e.target.value)} className={inputClass}>
            <option value="">Nessuno</option>
            {leads.map(l => (
              <option key={l.id} value={l.id}>{l.full_name ?? 'Senza nome'}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Immobile collegato</label>
          <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className={inputClass}>
            <option value="">Nessuno</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className={labelClass}>Note</label>
          <textarea rows={2} placeholder="Note aggiuntive..." value={notes}
            onChange={e => setNotes(e.target.value)}
            className={inputClass + ' resize-none'} />
        </div>
      </div>

      {error && <p className="text-[12px] text-red-600 mt-3">{error}</p>}

      <div className="flex gap-3 mt-5">
        <button onClick={handleSubmit} disabled={saving}
          className="px-5 py-2 bg-[var(--fg-primary)] text-[var(--bg-canvas)] text-[13px] font-medium rounded-xl hover:opacity-90 disabled:opacity-50">
          {saving ? 'Salvataggio...' : 'Salva appuntamento'}
        </button>
        <button onClick={onCancel}
          className="px-5 py-2 border border-[var(--border-subtle)] text-[var(--fg-secondary)] text-[13px] rounded-xl hover:bg-[var(--bg-elevated)]">
          Annulla
        </button>
      </div>
    </div>
  )
}

// ── Card appuntamento ─────────────────────────────────────────────

function AppointmentCard({
  apt, onDelete,
}: {
  apt: Appointment
  onDelete: (id: string) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const past = isPast(apt.scheduled_at)
  const today = isToday(apt.scheduled_at)

  async function handleDelete() {
    if (!confirm('Eliminare questo appuntamento?')) return
    setDeleting(true)
    await fetch('/api/appointments/' + apt.id, { method: 'DELETE' })
    onDelete(apt.id)
  }

  return (
    <div className={[
      'flex gap-4 p-4 rounded-xl border transition-colors group',
      past ? 'border-[var(--border-subtle)] opacity-60' : 'border-[var(--border-subtle)] hover:border-[var(--fg-primary)]/20 hover:bg-[var(--bg-elevated)]',
    ].join(' ')}>
      {/* Time column */}
      <div className="flex-shrink-0 text-center w-14">
        <p className={['text-[13px] font-semibold', today ? 'text-[var(--accent-deep)]' : 'text-[var(--fg-primary)]'].join(' ')}>
          {formatTime(apt.scheduled_at)}
        </p>
        <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">
          {apt.duration_min}min
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <span className={['text-[10px] font-medium px-2 py-0.5 rounded-full border', TYPE_COLORS[apt.type] ?? TYPE_COLORS.other].join(' ')}>
            {typeIcon(apt.type)} {typeLabel(apt.type)}
          </span>
          {today && <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[var(--accent-deep)]/10 text-[var(--accent-deep)]">Oggi</span>}
        </div>

        <p className="text-[14px] font-medium text-[var(--fg-primary)] truncate">{apt.title}</p>

        <div className="flex flex-wrap gap-3 mt-1.5">
          {apt.leads?.full_name && (
            <span className="text-[11px] text-[var(--fg-muted)]">
              👤 {apt.leads.full_name}
            </span>
          )}
          {apt.properties?.title && (
            <span className="text-[11px] text-[var(--fg-muted)]">
              🏠 {apt.properties.title}
            </span>
          )}
        </div>

        {apt.notes && (
          <p className="text-[12px] text-[var(--fg-muted)] mt-1.5 line-clamp-1">{apt.notes}</p>
        )}
      </div>

      {/* Delete */}
      <button onClick={handleDelete} disabled={deleting}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50 self-start">
        <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  )
}

// ── Componente principale ─────────────────────────────────────────

export function AgendaView({ leads, properties }: Props) {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showForm,     setShowForm]     = useState(false)
  const [filter,       setFilter]       = useState<'all' | 'upcoming' | 'today'>('upcoming')

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/appointments')
      const d = await r.json()
      setAppointments(d.appointments ?? [])
    } catch (_e) {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  function handleCreated(apt: Appointment) {
    setAppointments(prev => [...prev, apt].sort(
      (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
    ))
    setShowForm(false)
  }

  function handleDelete(id: string) {
    setAppointments(prev => prev.filter(a => a.id !== id))
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const filtered = appointments.filter(apt => {
    const d = new Date(apt.scheduled_at)
    if (filter === 'today')    return d >= startOfToday && d <= endOfToday
    if (filter === 'upcoming') return d >= startOfToday
    return true
  })

  // Raggruppa per giorno
  const grouped = filtered.reduce<Record<string, Appointment[]>>((acc, apt) => {
    const key = new Date(apt.scheduled_at).toDateString()
    if (!acc[key]) acc[key] = []
    acc[key].push(apt)
    return acc
  }, {})

  const todayCount    = appointments.filter(a => isToday(a.scheduled_at)).length
  const upcomingCount = appointments.filter(a => new Date(a.scheduled_at) >= startOfToday).length

  return (
    <div>
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2">
          {(['upcoming', 'today', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={[
                'px-3 py-1.5 text-[12px] font-medium rounded-full transition-colors',
                filter === f
                  ? 'bg-[var(--fg-primary)] text-[var(--bg-canvas)]'
                  : 'border border-[var(--border-subtle)] text-[var(--fg-secondary)] hover:border-[var(--fg-primary)]/30',
              ].join(' ')}>
              {f === 'upcoming' ? `Prossimi (${upcomingCount})` : f === 'today' ? `Oggi (${todayCount})` : 'Tutti'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="px-4 py-2 bg-[var(--fg-primary)] text-[var(--bg-canvas)] text-[13px] font-medium rounded-xl hover:opacity-90">
          + Nuovo appuntamento
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <NewAppointmentForm
          leads={leads}
          properties={properties}
          onCreated={handleCreated}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-[var(--bg-sunken)] animate-pulse" />)}
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl">
          <p className="text-3xl mb-3">📅</p>
          <p className="text-[14px] font-medium text-[var(--fg-primary)] mb-1">Nessun appuntamento</p>
          <p className="text-[13px] text-[var(--fg-muted)]">
            {filter === 'today' ? 'Nessun appuntamento per oggi.' : 'Crea il primo appuntamento del team.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([dateKey, apts]) => {
            const d = new Date(dateKey)
            const isT = isToday(d.toISOString())
            return (
              <div key={dateKey}>
                <div className="flex items-center gap-3 mb-3">
                  <p className={['text-[13px] font-semibold', isT ? 'text-[var(--accent-deep)]' : 'text-[var(--fg-secondary)]'].join(' ')}>
                    {isT ? 'Oggi' : formatDate(d.toISOString())}
                  </p>
                  <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                  <span className="text-[11px] text-[var(--fg-muted)]">{apts.length} appuntament{apts.length === 1 ? 'o' : 'i'}</span>
                </div>
                <div className="space-y-2">
                  {apts.map(apt => (
                    <AppointmentCard key={apt.id} apt={apt} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
