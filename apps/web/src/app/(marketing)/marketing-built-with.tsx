// app/(marketing)/marketing-built-with.tsx

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
    label: 'Documenti lead',
    desc:  'Planimetrie, visure, APE e contratti caricati direttamente nel profilo del cliente.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
      </svg>
    ),
    label: 'Matching automatico',
    desc:  'Il sistema abbina ogni nuovo immobile ai lead compatibili e notifica l\'agente in automatico.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    label: 'Agenda condivisa',
    desc:  'Visite, chiamate e firme in una sola agenda visibile a tutto il team in tempo reale.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    label: 'AI Renovation',
    desc:  'Render fotorealistici in 30 secondi per mostrare il potenziale di ogni immobile prima di ristrutturare.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
      </svg>
    ),
    label: 'Sito Habita',
    desc:  'Ogni agenzia ha il suo sito pubblico con immobili e render AI pubblicati automaticamente.',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <path d="M3 9h18M9 21V9"/>
      </svg>
    ),
    label: 'Dashboard operativa',
    desc:  'KPI, grafici, lead recenti e appuntamenti del giorno in una vista unificata per tutta l\'agenzia.',
  },
]

export function MarketingBuiltWith() {
  return (
    <section className="py-20 px-6 lg:px-16 bg-[#f5f4f0]">
      <div className="max-w-[1200px] mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

          {/* Left: Copy */}
          <div className="lg:sticky lg:top-24">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a67c52] mb-4">
              Come è nato
            </p>
            <h2
              className="text-[clamp(1.8rem,3.5vw,2.6rem)] leading-[1.1] tracking-[-0.02em] text-[#1a1a18] mb-6"
              style={{ fontWeight: 700 }}
            >
              Costruito insieme alle prime agenzie.
            </h2>
            <p
              className="text-[16px] leading-[1.65] text-[#6b6660] mb-8"
              style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}
            >
              Le funzionalità di Habiquo nascono dalle richieste reali
              degli agenti immobiliari. Non da un foglio di specifiche.
              Da conversazioni vere, problemi concreti, flussi di lavoro
              reali del mercato italiano.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full border border-[rgba(166,124,82,0.3)] bg-white">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52] animate-pulse" />
              <span
                className="text-[12px] text-[#a67c52] font-medium"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Beta privata attiva · Agenzie selezionate
              </span>
            </div>
          </div>

          {/* Right: Feature list */}
          <div className="space-y-4">
            {FEATURES.map(f => (
              <div
                key={f.label}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-[#e8e5df] hover:border-[rgba(166,124,82,0.3)] hover:shadow-[0_4px_20px_-8px_rgba(0,0,0,0.1)] transition-all duration-200"
              >
                <div className="w-9 h-9 rounded-xl bg-[#f5f4f0] flex items-center justify-center flex-shrink-0 text-[#a67c52]">
                  {f.icon}
                </div>
                <div>
                  <p
                    className="text-[14px] font-semibold text-[#1a1a18] mb-1"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    {f.label}
                  </p>
                  <p
                    className="text-[13px] text-[#6b6660] leading-[1.5]"
                    style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}
                  >
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
