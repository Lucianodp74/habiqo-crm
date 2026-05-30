// app/(marketing)/marketing-problem.tsx

const BEFORE = [
  'Excel e fogli sparsi per i lead',
  'WhatsApp personali per comunicare',
  'Lead dimenticati senza follow-up',
  'Agenda non condivisa col team',
  'Documenti distribuiti ovunque',
  'Nessuna automazione, tutto manuale',
]

const AFTER = [
  'CRM centralizzato per tutto il team',
  'Matching automatico lead-immobili',
  'Agenda condivisa e sincronizzata',
  'Documenti sempre disponibili',
  'Follow-up automatici',
  'AI Renovation integrata',
]

export function MarketingProblem() {
  return (
    <section className="py-24 px-6 lg:px-16 bg-[#FAF9F6]">
      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="mb-14 max-w-[640px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a67c52] mb-4">
            Il problema
          </p>
          <h2
            className="text-[clamp(1.8rem,3.5vw,2.6rem)] leading-[1.1] tracking-[-0.02em] text-[#1a1a18]"
            style={{ fontWeight: 700 }}
          >
            Ogni agenzia cerca più lead.{' '}
            <em style={{ fontStyle: 'italic', color: '#a67c52' }}>
              Poche riescono a gestirli bene.
            </em>
          </h2>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">

          {/* Before */}
          <div className="rounded-2xl border border-[#e8e5df] bg-white p-8">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#b8b4ae] mb-6"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              Come lavorano oggi le agenzie
            </p>
            <ul className="space-y-4">
              {BEFORE.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="w-5 h-5 rounded-full border border-[#e8e5df] bg-[#f5f4f0] flex items-center justify-center flex-shrink-0 mt-0.5"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 2l6 6M8 2L2 8" stroke="#c8c4be" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </span>
                  <span
                    className="text-[14px] text-[#9a9490] leading-[1.5]"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{ background: '#1a1a18' }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 80% 60% at 10% 20%, rgba(166,124,82,0.15), transparent 60%)',
              }}
            />
            <div className="relative">
              <p
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a67c52] mb-6"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Con Habiquo
              </p>
              <ul className="space-y-4">
                {AFTER.map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-[rgba(166,124,82,0.2)] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 2.5" stroke="#a67c52" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    <span
                      className="text-[14px] text-[rgba(255,255,255,0.8)] leading-[1.5]"
                      style={{ fontFamily: 'system-ui, sans-serif' }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* Micro-copy */}
        <p
          className="text-center text-[14px] text-[#9a9490]"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          Un'unica piattaforma.{' '}
          <span className="text-[#1a1a18] font-medium">Nessun passaggio perso.</span>
        </p>

      </div>
    </section>
  )
}
