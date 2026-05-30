// app/(marketing)/marketing-founder-story.tsx
// Sezione fondatore — sopra il footer

export function MarketingFounderStory() {
  return (
    <section className="py-16 px-6 lg:px-16 bg-[#FAF9F6] border-t border-[#e8e5df]">
      <div className="max-w-[1200px] mx-auto">
        <div className="max-w-[680px]">

          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a67c52] mb-5">
            Dal fondatore
          </p>

          <blockquote
            className="text-[clamp(1.1rem,2.2vw,1.4rem)] leading-[1.6] text-[#1a1a18] mb-6"
            style={{ fontStyle: 'italic' }}
          >
            "Le prime agenzie che si uniscono a Habiquo non sono semplici clienti.
            Sono partner. Le seguo personalmente durante tutto l'onboarding,
            ascolto ogni esigenza e costruisco insieme a loro le funzionalità
            che mancano al mercato immobiliare italiano."
          </blockquote>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#e8e5df] flex items-center justify-center flex-shrink-0">
              <span className="text-[14px] font-bold text-[#6b6660]">L</span>
            </div>
            <div>
              <p
                className="text-[14px] font-semibold text-[#1a1a18]"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Luciano Del Priore
              </p>
              <p
                className="text-[12px] text-[#9a9490]"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Fondatore, HABIQUO
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#e8e5df]">
            <p
              className="text-[14px] text-[#6b6660] mb-5"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              Parla direttamente con chi sta costruendo la piattaforma.
              Nessun commerciale, nessun funnel automatico. Solo una conversazione vera
              sul tuo modo di lavorare e su come Habiquo può aiutarti.
            </p>
            <a
              href="/richiedi-demo"
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#1a1a18] hover:text-[#a67c52] transition-colors"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              Parliamo →
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}
