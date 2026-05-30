// app/(marketing)/marketing-founder.tsx
// Sezione Founder Access — CTA esclusiva

export function MarketingFounder() {
  return (
    <section id="founder-access" className="py-16 px-6 lg:px-16">
      <div className="max-w-[1200px] mx-auto">

        {/* Main card */}
        <div
          className="rounded-3xl overflow-hidden relative"
          style={{ background: '#1a1a18' }}
        >
          {/* Background texture */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 70% 60% at 20% 50%, rgba(166,124,82,0.18), transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(166,124,82,0.08), transparent 50%)',
            }}
          />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-0">

            {/* Left: Copy */}
            <div className="p-10 lg:p-16">
              <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-[rgba(166,124,82,0.4)] bg-[rgba(166,124,82,0.08)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52] animate-pulse" />
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#a67c52]">
                  Founder Program · Posti limitati
                </span>
              </div>

              <h2
                className="text-[clamp(2rem,3.5vw,2.8rem)] leading-[1.08] tracking-[-0.02em] text-white mb-6"
                style={{ fontWeight: 700 }}
              >
                Stiamo selezionando le prime agenzie{' '}
                <em style={{ fontStyle: 'italic', color: '#a67c52' }}>Founder.</em>
              </h2>

              <p
                className="text-[16px] leading-[1.65] text-[rgba(255,255,255,0.55)] mb-8 max-w-[420px]"
                style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}
              >
                Le agenzie Founder accedono a Habiquo in anteprima assoluta.
                Onboarding personalizzato, accesso diretto al team,
                e condizioni riservate per sempre.
              </p>

              {/* Benefits */}
              <ul className="space-y-3 mb-10">
                {[
                  'Onboarding 1:1 con il team Habiquo',
                  'Accesso a tutte le funzionalità in anteprima',
                  'Condizioni founder riservate permanenti',
                  'Influenza diretta sulla roadmap del prodotto',
                ].map(benefit => (
                  <li key={benefit} className="flex items-start gap-3">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#a67c52]" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span
                      className="text-[14px] text-[rgba(255,255,255,0.65)]"
                      style={{ fontFamily: 'system-ui, sans-serif' }}
                    >
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>

              <a
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#a67c52] text-white text-[15px] font-semibold hover:bg-[#b8906a] transition-colors"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Richiedi accesso Founder
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>

              <p
                className="mt-4 text-[12px] text-[rgba(255,255,255,0.3)]"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Nessuna carta di credito richiesta · Demo gratuita
              </p>
            </div>

            {/* Right: Stats */}
            <div className="p-10 lg:p-16 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[rgba(255,255,255,0.06)]">
              <p
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-[rgba(255,255,255,0.3)] mb-8"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Cosa ottieni subito
              </p>

              <div className="space-y-6">
                {[
                  { icon: '🏠', title: 'CRM immobiliare completo', desc: 'Lead, pipeline, documenti e matching automatico.' },
                  { icon: '✨', title: 'AI Renovation illimitata', desc: 'Render fotorealistici in 30 secondi per ogni immobile.' },
                  { icon: '👥', title: 'Team illimitato', desc: 'Invita tutti gli agenti della tua agenzia.' },
                  { icon: '🌐', title: 'Sito Habita incluso', desc: 'Il tuo sito pubblico con immobili e AI renovation.' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-4">
                    <span className="text-2xl flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-[14px] font-semibold text-white mb-0.5">{item.title}</p>
                      <p
                        className="text-[13px] text-[rgba(255,255,255,0.4)]"
                        style={{ fontFamily: 'system-ui, sans-serif' }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}

