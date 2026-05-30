export function MarketingFeatures() {
  return (
    <section id="funzionalita" className="py-16 px-6 lg:px-16 max-w-[1200px] mx-auto">

      <div className="text-center mb-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a67c52] mb-4">
          Ecosistema completo
        </p>
        <h2
          className="text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.02em] text-[#1a1a18] mb-4"
          style={{ fontWeight: 700 }}
        >
          Tutto quello che serve.{' '}
          <em style={{ fontStyle: 'italic', color: '#a67c52' }}>In una sola piattaforma.</em>
        </h2>
        <p
          className="text-[17px] text-[#6b6660] max-w-[520px] mx-auto leading-relaxed"
          style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}
        >
          Niente integrazioni fragili. Niente strumenti separati.
          Un sistema coerente, costruito per le agenzie italiane.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* CRM — dark, large */}
        <div className="rounded-2xl border p-7 bg-[#1a1a18] border-[#1a1a18] lg:col-span-2 hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.28)] transition-all duration-200">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-[rgba(255,255,255,0.08)] text-[#a67c52]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
            </svg>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3 text-[rgba(255,255,255,0.35)]" style={{ fontFamily: 'system-ui, sans-serif' }}>CRM Lead</p>
          <h3 className="text-[18px] leading-[1.3] tracking-[-0.01em] mb-3 text-white" style={{ fontWeight: 600 }}>
            Pipeline intelligente. Zero lead persi.
          </h3>
          <p className="text-[14px] leading-[1.6] text-[rgba(255,255,255,0.5)]" style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}>
            Kanban visuale, status automatici, note, task e follow-up per ogni lead. Tutto in un unico profilo strutturato.
          </p>
        </div>

        {/* Matching */}
        <div className="rounded-2xl border p-7 bg-white border-[#e8e5df] hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.10)] transition-all duration-200">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-[#f5f4f0] text-[#a67c52]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>
            </svg>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3 text-[#9a9490]" style={{ fontFamily: 'system-ui, sans-serif' }}>Matching AI</p>
          <h3 className="text-[18px] leading-[1.3] tracking-[-0.01em] mb-3 text-[#1a1a18]" style={{ fontWeight: 600 }}>
            Ogni immobile trova i lead compatibili.
          </h3>
          <p className="text-[14px] leading-[1.6] text-[#6b6660]" style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}>
            Il sistema confronta le preferenze di ogni lead con i nuovi immobili. Notifica email immediata.
          </p>
        </div>

        {/* AI Renovation */}
        <div className="rounded-2xl border p-7 bg-white border-[#e8e5df] hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.10)] transition-all duration-200">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-[#f5f4f0] text-[#a67c52]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3 text-[#9a9490]" style={{ fontFamily: 'system-ui, sans-serif' }}>AI Renovation</p>
          <h3 className="text-[18px] leading-[1.3] tracking-[-0.01em] mb-3 text-[#1a1a18]" style={{ fontWeight: 600 }}>
            Mostra il potenziale prima della ristrutturazione.
          </h3>
          <p className="text-[14px] leading-[1.6] text-[#6b6660]" style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}>
            Carica una foto, scegli lo stile. Render AI in secondi. Slider prima/dopo interattivo.
          </p>
        </div>

        {/* Agenda */}
        <div className="rounded-2xl border p-7 bg-white border-[#e8e5df] hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.10)] transition-all duration-200">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-[#f5f4f0] text-[#a67c52]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3 text-[#9a9490]" style={{ fontFamily: 'system-ui, sans-serif' }}>Agenda Team</p>
          <h3 className="text-[18px] leading-[1.3] tracking-[-0.01em] mb-3 text-[#1a1a18]" style={{ fontWeight: 600 }}>
            Tutto il team sincronizzato.
          </h3>
          <p className="text-[14px] leading-[1.6] text-[#6b6660]" style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}>
            Visite, chiamate e firme in un agenda condivisa. Collegata a lead e immobili.
          </p>
        </div>

        {/* Documenti + Habita — large */}
        <div className="rounded-2xl border p-7 bg-white border-[#e8e5df] lg:col-span-2 hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.10)] transition-all duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-[#f5f4f0] text-[#a67c52]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3 text-[#9a9490]" style={{ fontFamily: 'system-ui, sans-serif' }}>Documenti Lead</p>
              <h3 className="text-[18px] leading-[1.3] tracking-[-0.01em] mb-3 text-[#1a1a18]" style={{ fontWeight: 600 }}>
                Planimetrie, visure e contratti sempre al posto giusto.
              </h3>
              <p className="text-[14px] leading-[1.6] text-[#6b6660]" style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}>
                Upload drag and drop per ogni lead. Categorie intelligenti. Accessibile da tutto il team.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5 bg-[#f5f4f0] text-[#a67c52]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
                </svg>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3 text-[#9a9490]" style={{ fontFamily: 'system-ui, sans-serif' }}>Sito Habita</p>
              <h3 className="text-[18px] leading-[1.3] tracking-[-0.01em] mb-3 text-[#1a1a18]" style={{ fontWeight: 600 }}>
                Ogni agenzia ha il suo sito pubblico. Automatico.
              </h3>
              <p className="text-[14px] leading-[1.6] text-[#6b6660]" style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}>
                Immobili e render AI pubblicati automaticamente. Zero configurazione richiesta.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}


