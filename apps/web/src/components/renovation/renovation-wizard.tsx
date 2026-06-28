'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { BeforeAfterSlider } from './before-after-slider'
import { createRenovationLead } from '@/lib/actions/create-renovation-lead'
import { addRenovationToGallery } from '@/lib/actions/add-renovation-to-gallery'

// ── Config ────────────────────────────────────────────────────────

const ROOM_TYPES = [
  { value: 'living_room',  label: 'Soggiorno'       },
  { value: 'bedroom',      label: 'Camera'          },
  { value: 'kitchen',      label: 'Cucina'          },
  { value: 'bathroom',     label: 'Bagno'           },
  { value: 'office',       label: 'Studio'          },
  { value: 'dining_room',  label: 'Sala da pranzo'  },
] as const

const STYLES = [
  {
    value: 'modern_italian',
    label: 'Modern Italian',
    desc:  'Marmo, linee pulite, neutri caldi',
  },
  {
    value: 'mediterranean_luxury',
    label: 'Mediterranean',
    desc:  'Terracotta, archi, materiali naturali',
  },
  {
    value: 'minimal_warm',
    label: 'Minimal Warm',
    desc:  'Legno, lino, minimalismo caldo',
  },
] as const

const ALLOWED_TYPES   = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES  = 10 * 1024 * 1024

// ── Types ─────────────────────────────────────────────────────────

type Step = 'configure' | 'generating' | 'done' | 'error'

interface StatusResponse {
  status:        string
  afterImageUrl?: string
  error?:        string
}

interface UploadResponse {
  previewId:      string
  beforeImageUrl: string
}

interface Props {
  propertyId?: string
}

// ── Component ─────────────────────────────────────────────────────

export function RenovationWizard({ propertyId }: Props) {
  const [step,            setStep]           = useState<Step>('configure')
  const [isSavingToGallery, setIsSavingToGallery] = useState(false)
  const [gallerySaved,      setGallerySaved]      = useState(false)
  const [galleryError,      setGalleryError]      = useState<string | null>(null)
  const [file,            setFile]           = useState<File | null>(null)
  const [previewUrl,      setPreviewUrl]     = useState<string | null>(null)
  const [roomType,        setRoomType]       = useState('living_room')
  const [style,           setStyle]          = useState('modern_italian')
  const [isLoading,       setIsLoading]      = useState(false)
  const [isDragOver,      setIsDragOver]     = useState(false)
  const [previewId,       setPreviewId]      = useState<string | null>(null)
  const [beforeImageUrl,  setBeforeImageUrl] = useState<string | null>(null)
  const [afterImageUrl,   setAfterImageUrl]  = useState<string | null>(null)
  const [error,           setError]          = useState<string | null>(null)
  const [elapsed,         setElapsed]        = useState(0)

  // Lead form
  const [leadName,        setLeadName]       = useState('')
  const [leadPhone,       setLeadPhone]      = useState('')
  const [leadEmail,       setLeadEmail]      = useState('')
  const [leadSaving,      setLeadSaving]     = useState(false)
  const [leadSaved,       setLeadSaved]      = useState(false)
  const [leadError,       setLeadError]      = useState<string | null>(null)

  const inputRef  = useRef<HTMLInputElement>(null)
  const pollCount = useRef(0)

  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  useEffect(() => {
    if (step !== 'generating') { setElapsed(0); return }
    const t = setInterval(() => setElapsed((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [step])

  useEffect(() => {
    if (step !== 'generating' || !previewId) return
    pollCount.current = 0

    const interval = setInterval(async () => {
      pollCount.current += 1
      if (pollCount.current > 120) {
        clearInterval(interval)
        setError('Timeout: la generazione ha impiegato troppo. Riprova.')
        setStep('error')
        return
      }
      try {
        const res  = await fetch(`/api/renovation/${previewId}/status`)
        if (!res.ok) return
        const data = (await res.json()) as StatusResponse
        if (data.status === 'completed' && data.afterImageUrl) {
          clearInterval(interval)
          setAfterImageUrl(data.afterImageUrl)
          setStep('done')
        } else if (data.status === 'failed') {
          clearInterval(interval)
          setError(data.error ?? 'Generazione fallita. Riprova.')
          setStep('error')
        }
      } catch { /* network blip */ }
    }, 3_000)

    return () => clearInterval(interval)
  }, [step, previewId])

  const acceptFile = useCallback((f: File) => {
    setError(null)
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError('Formato non supportato. Usa JPG, PNG o WEBP.')
      return
    }
    if (f.size > MAX_SIZE_BYTES) {
      setError('Il file è troppo grande. Massimo 10 MB.')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(URL.createObjectURL(f))
    setFile(f)
  }, [previewUrl])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) acceptFile(f)
  }, [acceptFile])

  const handleGenerate = async () => {
    if (!file) return
    setIsLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('roomType', roomType)
      formData.append('style', style)
      if (propertyId) formData.append('propertyId', propertyId)

      const uploadRes = await fetch('/api/renovation/upload', { method: 'POST', body: formData })
      if (!uploadRes.ok) {
        const e = (await uploadRes.json()) as { error?: string }
        throw new Error(e.error ?? 'Errore durante il caricamento')
      }
      const { previewId: id, beforeImageUrl: bUrl } = (await uploadRes.json()) as UploadResponse
      setPreviewId(id)
      setBeforeImageUrl(bUrl)

      const genRes = await fetch('/api/renovation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewId: id }),
      })
      if (!genRes.ok) {
        const e = (await genRes.json()) as { error?: string }
        throw new Error(e.error ?? 'Errore avvio generazione AI')
      }
      setStep('generating')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveLead = async () => {
    if (!previewId) return
    setLeadSaving(true)
    setLeadError(null)
    const result = await createRenovationLead({
      previewId,
      fullName: leadName,
      phone:    leadPhone,
      email:    leadEmail || undefined,
    })
    setLeadSaving(false)
    if (result.ok) {
      setLeadSaved(true)
    } else {
      setLeadError(result.error)
    }
  }

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setStep('configure')
    setFile(null)
    setPreviewUrl(null)
    setPreviewId(null)
    setBeforeImageUrl(null)
    setAfterImageUrl(null)
    setError(null)
    setLeadName('')
    setLeadPhone('')
    setLeadEmail('')
    setLeadSaved(false)
    setLeadError(null)
    setIsLoading(false)
  }

  const elapsedStr     = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
  const selectedStyle  = STYLES.find((s) => s.value === style)

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* ── STEP: configure ────────────────────────────────────── */}
      {step === 'configure' && (
        <div className="space-y-6">
          {!file ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={onDrop}
              className={[
                'flex flex-col items-center justify-center min-h-56 rounded-2xl',
                'border-2 border-dashed cursor-pointer transition-all duration-200',
                isDragOver
                  ? 'border-stone-400 bg-stone-100'
                  : 'border-stone-200 bg-stone-50 hover:border-stone-300 hover:bg-white',
              ].join(' ')}
            >
              <svg className="w-10 h-10 text-stone-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm font-medium text-stone-600">Trascina la foto qui</p>
              <p className="text-xs text-stone-400 mt-1">o clicca per selezionare · JPG, PNG, WEBP · max 10 MB</p>
              <input ref={inputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) acceptFile(f) }} />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden bg-stone-100" style={{ aspectRatio: '16/9' }}>
              <img src={previewUrl!} alt="Anteprima" className="w-full h-full object-cover" />
              <button
                onClick={() => { setFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); setError(null) }}
                className="absolute top-3 right-3 text-xs font-medium px-3 py-1.5 rounded-full text-stone-700 transition-colors"
                style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)' }}
              >
                Cambia foto
              </button>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-stone-700 mb-3">Tipo di stanza</p>
            <div className="flex flex-wrap gap-2">
              {ROOM_TYPES.map((rt) => (
                <button key={rt.value} onClick={() => setRoomType(rt.value)}
                  className={['px-4 py-2 rounded-full text-sm font-medium border transition-all duration-150',
                    roomType === rt.value ? 'bg-stone-900 text-white border-stone-900' : 'text-stone-600 border-stone-200 bg-white hover:border-stone-400',
                  ].join(' ')}>
                  {rt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-stone-700 mb-3">Stile di valorizzazione</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {STYLES.map((s) => (
                <button key={s.value} onClick={() => setStyle(s.value)}
                  className={['p-4 rounded-xl text-left border transition-all duration-150',
                    style === s.value ? 'border-stone-900 bg-stone-50 shadow-sm' : 'border-stone-100 bg-white hover:border-stone-300',
                  ].join(' ')}>
                  {style === s.value && <div className="w-2 h-2 rounded-full bg-stone-900 mb-3" />}
                  <p className="font-medium text-stone-900 text-sm">{s.label}</p>
                  <p className="text-stone-400 text-xs mt-1 leading-relaxed">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-red-50 rounded-xl border border-red-100">
              <svg className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button onClick={handleGenerate} disabled={!file || isLoading}
            className={['w-full py-4 rounded-xl text-sm font-medium tracking-wide transition-all duration-150',
              !file || isLoading ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99]',
            ].join(' ')}>
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Caricamento...
              </span>
            ) : 'Genera Render AI →'}
          </button>
        </div>
      )}

      {/* ── STEP: generating ───────────────────────────────────── */}
      {step === 'generating' && (
        <div className="text-center py-10 space-y-6">
          {beforeImageUrl && (
            <div className="relative rounded-2xl overflow-hidden mx-auto" style={{ aspectRatio: '16/9' }}>
              <img src={beforeImageUrl} alt="Originale" className="w-full h-full object-cover"
                style={{ filter: 'blur(8px)', transform: 'scale(1.05)' }} />
              <div className="absolute inset-0 bg-stone-900/50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                <p className="text-white text-sm font-medium">Generazione AI in corso...</p>
              </div>
            </div>
          )}
          <div>
            <p className="font-medium text-stone-900">{selectedStyle?.label ?? 'Stile selezionato'} · Stima ~45 sec</p>
            <p className="text-sm text-stone-400 mt-1">Elaborazione in corso · {elapsedStr}</p>
          </div>
          <p className="text-xs text-stone-300 max-w-xs mx-auto">
            Non chiudere questa finestra. Il render verrà salvato automaticamente.
          </p>
        </div>
      )}

      {/* ── STEP: done ─────────────────────────────────────────── */}
      {step === 'done' && beforeImageUrl && afterImageUrl && (
        <div className="space-y-6">
          <BeforeAfterSlider beforeUrl={beforeImageUrl} afterUrl={afterImageUrl} />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-emerald-700">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Render completato
            </div>
            <div className="flex items-center gap-4">
              <a href={afterImageUrl} download="render-ai.webp" target="_blank" rel="noreferrer"
                className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
                Scarica
              </a>
              {propertyId && afterImageUrl && (
                <button
                  type="button"
                  disabled={isSavingToGallery || gallerySaved}
                  onClick={() => {
                    setIsSavingToGallery(true)
                    setGalleryError(null)
                    addRenovationToGallery({ propertyId, afterImageUrl }).then((result) => {
                      setIsSavingToGallery(false)
                      if (!result.ok) {
                        setGalleryError(result.error.message)
                        return
                      }
                      setGallerySaved(true)
                    })
                  }}
                  className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  {gallerySaved ? 'Aggiunto alla galleria âœ“' : isSavingToGallery ? 'Aggiungoâ€¦' : 'Aggiungi alla galleria'}
                </button>
              )}
              <button onClick={handleReset}
                className="text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors">
                Nuovo render
              </button>
            </div>
            {galleryError && (
              <p className="mt-2 text-xs text-red-600">{galleryError}</p>
            )}
          </div>

          {/* ── Form contatto lead ──────────────────────────────── */}
          <div className="border border-stone-100 rounded-2xl p-5 bg-stone-50">
            {!leadSaved ? (
              <>
                <p className="text-sm font-medium text-stone-800 mb-1">Salva il contatto nel CRM</p>
                <p className="text-xs text-stone-400 mb-4">Opzionale — collega questo render a un lead.</p>

                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nome e cognome *"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-stone-400 transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="Telefono *"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-stone-400 transition-colors"
                  />
                  <input
                    type="email"
                    placeholder="Email (opzionale)"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-stone-400 transition-colors"
                  />

                  {leadError && (
                    <p className="text-xs text-red-600">{leadError}</p>
                  )}

                  <button
                    onClick={handleSaveLead}
                    disabled={leadSaving || !leadName.trim() || !leadPhone.trim()}
                    className={['w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                      leadSaving || !leadName.trim() || !leadPhone.trim()
                        ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        : 'bg-stone-900 text-white hover:bg-stone-800',
                    ].join(' ')}>
                    {leadSaving ? 'Salvataggio...' : 'Salva lead nel CRM'}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Lead salvato nel CRM
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── STEP: error ────────────────────────────────────────── */}
      {step === 'error' && (
        <div className="text-center py-12 space-y-4">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-stone-900">Qualcosa è andato storto</p>
            <p className="text-sm text-stone-500 mt-1 max-w-sm mx-auto leading-relaxed">{error}</p>
          </div>
          <div className="flex items-center gap-3 justify-center pt-2">
            <button onClick={() => { setStep('configure'); setError(null) }}
              className="px-6 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors">
              Riprova
            </button>
            <button onClick={handleReset}
              className="px-6 py-2.5 text-stone-600 text-sm font-medium rounded-xl border border-stone-200 hover:border-stone-300 transition-colors">
              Ricomincia
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

