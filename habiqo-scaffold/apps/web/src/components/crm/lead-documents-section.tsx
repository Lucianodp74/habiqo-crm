'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

type LeadDocument = {
  id: string
  file_name: string
  file_url: string
  file_type: string
  document_category: string
  created_at: string
}

interface Props {
  leadId: string
}

const CATEGORIES = [
  { value: 'planimetria',       label: 'Planimetria'       },
  { value: 'visura',            label: 'Visura'            },
  { value: 'contratto',         label: 'Contratto'         },
  { value: 'documento_cliente', label: 'Documento cliente' },
  { value: 'ape',               label: 'APE'               },
  { value: 'incarico',          label: 'Incarico'          },
  { value: 'altro',             label: 'Altro'             },
]

export function LeadDocumentsSection({ leadId }: Props) {
  const [docs,      setDocs]      = useState<LeadDocument[]>([])
  const [loading,   setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const [category,  setCategory]  = useState('altro')
  const [error,     setError]     = useState('')
  const [deleting,  setDeleting]  = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const loadDocs = useCallback(async () => {
    try {
      const r = await fetch('/api/leads/' + leadId + '/documents')
      const j = await r.json()
      setDocs(j.documents ?? [])
    } catch (_e) {
      setError('Errore caricamento')
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => { void loadDocs() }, [loadDocs])

  async function uploadFile(file: File) {
    setError('')
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('category', category)
      const r = await fetch('/api/leads/' + leadId + '/documents', { method: 'POST', body: fd })
      if (!r.ok) {
        const j = await r.json()
        setError(j.error ?? 'Errore upload')
      } else {
        await loadDocs()
      }
    } catch (_e) {
      setError('Errore upload')
    } finally {
      setUploading(false)
    }
  }

  async function deleteDoc(id: string) {
    setDeleting(id)
    try {
      await fetch('/api/leads/' + leadId + '/documents/' + id, { method: 'DELETE' })
      setDocs(prev => prev.filter(d => d.id !== id))
    } catch (_e) {
      setError('Errore eliminazione')
    } finally {
      setDeleting('')
    }
  }

  const catLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label ?? v

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6 animate-in-card [animation-delay:140ms]">
      <h2 className="font-display text-[20px] text-[var(--fg-primary)] mb-5">Documenti</h2>

      <div className="mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wide text-[var(--fg-muted)] block mb-1">Categoria</label>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-3 py-2 text-[13px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--fg-primary)] focus:outline-none"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-[var(--fg-primary)] text-[var(--bg-canvas)] text-[13px] rounded-xl hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? 'Caricamento...' : '+ Carica file'}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={e => { const f = e.target.files?.[0]; if (f) void uploadFile(f) }}
        />
      </div>

      {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map(i => <div key={i} className="h-12 rounded-xl bg-[var(--bg-sunken)] animate-pulse" />)}
        </div>
      ) : docs.length === 0 ? (
        <p className="text-[13px] text-[var(--fg-muted)] italic">Nessun documento caricato.</p>
      ) : (
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] group hover:bg-[var(--bg-elevated)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-sunken)] flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] font-bold text-[var(--fg-muted)] uppercase">
                  {doc.file_type === 'application/pdf' ? 'PDF' : doc.file_type.startsWith('image/') ? 'IMG' : 'DOC'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--fg-primary)] truncate">{doc.file_name}</p>
                <p className="text-[11px] text-[var(--fg-muted)]">{catLabel(doc.document_category)} - {formatDate(doc.created_at)}</p>
              </div>
              <a href={doc.file_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-[var(--bg-sunken)] opacity-0 group-hover:opacity-100">
                <svg className="w-4 h-4 text-[var(--fg-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </a>
              <button
                onClick={() => void deleteDoc(doc.id)}
                disabled={deleting === doc.id}
                className="p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 disabled:opacity-50"
              >
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
