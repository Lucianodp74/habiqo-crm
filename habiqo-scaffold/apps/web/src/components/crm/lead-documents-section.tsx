'use client'
// components/crm/lead-documents-section.tsx
// Destinazione: apps/web/src/components/crm/lead-documents-section.tsx

import { useState, useRef, useCallback, useEffect } from 'react'

// ── Tipi ────────────────────────────────────────────────────────

type LeadDocument = {
  id:                string
  file_name:         string
  file_url:          string
  file_type:         string
  document_category: string
  created_at:        string
}

interface Props {
  leadId: string
}

// ── Config ───────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'planimetria',      label: 'Planimetria'       },
  { value: 'visura',           label: 'Visura'            },
  { value: 'contratto',        label: 'Contratto'         },
  { value: 'documento_cliente', label: 'Documento cliente' },
  { value: 'ape',              label: 'APE'               },
  { value: 'incarico',         label: 'Incarico'          },
  { value: 'altro',            label: 'Altro'             },
]

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]

// ── File icon ────────────────────────────────────────────────────

function FileIcon({ fileType }: { fileType: string }) {
  if (fileType === 'application/pdf') {
    return (
      <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
        <span className="text-[9px] font-bold text-red-600 uppercase">PDF</span>
      </div>
    )
  }
  if (fileType.startsWith('image/')) {
    return (
      <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
      <span className="text-[9px] font-bold text-stone-500 uppercase">DOC</span>
    </div>
  )
}

// ── Componente principale ─────────────────────────────────────────

export function LeadDocumentsSection({ leadId }: Props) {
  const [documents,   setDocuments]  = useState<LeadDocument[]>([])
  const [loading,     setLoading]    = useState(true)
  const [uploading,   setUploading]  = useState(false)
  const [isDragOver,  setIsDragOver] = useState(false)
  const [category,    setCategory]   = useState('altro')
  const [error,       setError]      = useState<string | null>(null)
  const [deletingId,  setDeletingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Carica documenti ──────────────────────────────────────────
  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/leads/${leadId}/documents`)
      const data = await res.json() as { documents: LeadDocument[] }
      setDocuments(data.documents ?? [])
    } catch {
      setError('Errore caricamento documenti')
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => { loadDocuments() }, [loadDocuments])

  // ── Upload ────────────────────────────────────────────────────
  const uploadFile = useCallback(async (file: File) => {
    setError(null)
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Formato non supportato. Usa PDF, JPG, PNG, WEBP o DOCX.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File troppo grande. Max 20 MB.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)

      const res = await fetch(`/api/leads/${leadId}/documents`, {
        method: 'POST',
        body:   formData,
      })

      if (!res.ok) {
        const e = await res.json() as { error?: string }
        throw new Error(e.error ?? 'Errore upload')
      }

      await loadDocuments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore upload')
    } finally {
      setUploading(false)
    }
  }, [leadId, category, loadDocuments])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) uploadFile(file)
  }, [uploadFile])

  // ── Elimina ───────────────────────────────────────────────────
  const deleteDocument = async (docId: string) => {
    setDeletingId(docId)
    try {
      await fetch(`/api/leads/${leadId}/documents/${docId}`, { method: 'DELETE' })
      setDocuments(prev => prev.filter(d => d.id !== docId))
    } catch {
      setError('Errore eliminazione')
    } finally {
      setDeletingId(null)
    }
  }

  // ── Formato data ──────────────────────────────────────────────
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })

  const categoryLabel = (val: string) =>
    CATEGORIES.find(c => c.value === val)?.label ?? val

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6 transition-shadow duration-300 hover:shadow-[0_14px_44px_-24px_rgba(24,20,16,0.18)] animate-in-card [animation-delay:140ms]">
      <h2 className="font-display text-[20px] text-[var(--fg-primary)] mb-5">
        Documenti
      </h2>

      {/* Upload area */}
      <div className="mb-5 space-y-3">
        {/* Categoria */}
        <div>
          <label className="text-[11px] font-mono uppercase tracking-wide text-[var(--fg-muted)] block mb-1.5">
            Categoria documento
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 text-[13px] rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--fg-primary)] focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          className={[
            'flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150',
            isDragOver || uploading
              ? 'border-[var(--fg-primary)]/40 bg-[var(--bg-elevated)]'
              : 'border-[var(--border-subtle)] hover:border-[var(--fg-primary)]/30 hover:bg-[var(--bg-elevated)]',
          ].join(' ')}
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-[var(--fg-muted)]">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-[13px]">Caricamento...</span>
            </div>
          ) : (
            <>
              <svg className="w-6 h-6 text-[var(--fg-muted)] mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-[12px] text-[var(--fg-muted)]">
                Trascina o <span className="text-[var(--fg-primary)] font-medium">clicca</span> per caricare
              </p>
              <p className="text-[10px] text-[var(--fg-muted)] mt-0.5">PDF, JPG, PNG, DOCX · max 20 MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f) }}
          />
        </div>

        {error && (
          <p className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>
        )}
      </div>

      {/* Lista documenti */}
      {loading ? (
        <div className="space-y-2">
          {[1,2].map(i => (
            <div key={i} className="h-14 rounded-xl bg-[var(--bg-sunken)] animate-pulse" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <p className="text-[13px] text-[var(--fg-muted)] italic text-center py-4">
          Nessun documento caricato.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)] transition-colors group"
            >
              <FileIcon fileType={doc.file_type} />

              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[var(--fg-primary)] truncate">
                  {doc.file_name}
                </p>
                <p className="text-[11px] text-[var(--fg-muted)] mt-0.5">
                  {categoryLabel(doc.document_category)} · {formatDate(doc.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-sunken)] transition-colors"
                  title="Scarica"
                >
                  <svg className="w-4 h-4 text-[var(--fg-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  disabled={deletingId === doc.id}
                  className="p-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                  title="Elimina"
                >
                  {deletingId === doc.id ? (
                    <svg className="w-4 h-4 text-red-400 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
