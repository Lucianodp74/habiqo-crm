// app/(marketing)/marketing-screenshots.tsx
// Sezione "Dentro Habiquo" con screenshot reali alternati

const BASE = 'https://jwivrcofmxnpgkdolnuo.supabase.co/storage/v1/object/public/landing'

const SCREENS = [
  {
    id:      'pipeline',
    label:   'CRM Lead',
    title:   'Pipeline visuale. Zero lead dimenticati.',
    desc:    'Kanban drag & drop con tutte le fasi della trattativa. Ogni lead ha il suo profilo completo con storico, documenti e preferenze di ricerca.',
    benefit: 'Le agenzie che usano Habiquo non perdono più nessun lead.',
    src:     `${BASE}/Immagine%202026-05-30%20101242.png`,
    side:    'left',
  },
  {
    id:      'lead',
    label:   'Profilo Lead',
    title:   'Ogni lead. Una scheda operativa completa.',
    desc:    'Budget, preferenze, storico attività, documenti caricati, probabilità di conversione AI. Tutto in un\'unica vista strutturata per il tuo team.',
    benefit: 'Il tuo agente arriva alla chiamata preparato.',
    src:     `${BASE}/leads.png`,
    side:    'right',
  },
  {
    id:      'documenti',
    label:   'Documenti & AI Insight',
    title:   'Documenti del lead + insight AI in tempo reale.',
    desc:    'Carica planimetrie, visure e contratti direttamente nel profilo lead. Il motore AI analizza la timeline e suggerisce la prossima azione più efficace.',
    benefit: 'Meno dimenticanze, più conversioni.',
    src:     `${BASE}/documenti.png`,
    side:    'left',
  },
  {
    id:      'immobili',
    label:   'Gestione Immobili',
    title:   'Tutti gli immobili. Pubblicati ovunque in un click.',
    desc:    'Crea immobili con AI, gestisci le foto e pubblica su Immobiliare.it, Idealista e il tuo sito Habita con un solo click.',
    benefit: 'Da bozza a pubblicato in meno di 2 minuti.',
    src:     `${BASE}/immobili.png`,
    side:    'right',
  },
  {
    id:      'agenda',
    label:   'Agenda Team',
    title:   'Un\'agenda condivisa per tutto il team.',
    desc:    'Visite, chiamate, firme e incontri in un\'unica agenda. Collega ogni appuntamento al lead e all\'immobile. Il team lavora sincronizzato.',
    benefit: 'Nessun appuntamento perso, nessuna sovrapposizione.',
    src:     `${BASE}/agenda.png`,
    side:    'left',
  },
]

function Screenshot({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative">
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(166,124,82,0.1), transparent 70%)',
          filter: 'blur(20px)',
          transform: 'scale(1.05)',
        }}
      />
      <div className="relative rounded-2xl overflow-hidden border border-[rgba(0,0,0,0.07)] shadow-[0_24px_60px_-16px_rgba(0,0,0,0.18)]">
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-[#f0ede8] border-b border-[rgba(0,0,0,0.06)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          <div className="flex-1 mx-3">
            <div className="h-4 bg-[rgba(0,0,0,0.05)] rounded flex items-center px-2">
              <span className="text-[9px] text-[#9a9490]" style={{ fontFamily: 'system-ui, sans-serif' }}>habiquo.it</span>
            </div>
          </div>
        </div>
        <img src={src} alt={alt} className="w-full h-auto object-cover object-top" />
      </div>
    </div>
  )
}

export function MarketingScreenshots() {
  return (
    <section id="dashboard" className="py-20 px-6 lg:px-16 bg-[#FAF9F6]">
      <div className="max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="text-center mb-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a67c52] mb-4">
            Dentro Habiquo
          </p>
          <h2
            className="text-[clamp(1.8rem,3.5vw,2.8rem)] leading-[1.08] tracking-[-0.02em] text-[#1a1a18]"
            style={{ fontWeight: 700 }}
          >
            Ogni funzione. Progettata per{' '}
            <em style={{ fontStyle: 'italic', color: '#a67c52' }}>l'agenzia italiana.</em>
          </h2>
        </div>

        {/* Alternating rows */}
        <div className="space-y-28">
          {SCREENS.map(screen => (
            <div
              key={screen.id}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
                screen.side === 'right' ? 'lg:grid-flow-dense' : ''
              }`}
            >
              {/* Screenshot */}
              <div className={screen.side === 'right' ? 'lg:col-start-2' : ''}>
                <Screenshot src={screen.src} alt={screen.title} />
              </div>

              {/* Text */}
              <div className={screen.side === 'right' ? 'lg:col-start-1 lg:row-start-1' : ''}>
                <p
                  className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a67c52] mb-4"
                  style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                  {screen.label}
                </p>
                <h3
                  className="text-[clamp(1.4rem,2.5vw,2rem)] leading-[1.15] tracking-[-0.015em] text-[#1a1a18] mb-4"
                  style={{ fontWeight: 700 }}
                >
                  {screen.title}
                </h3>
                <p
                  className="text-[15px] leading-[1.65] text-[#6b6660] mb-6"
                  style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}
                >
                  {screen.desc}
                </p>
                <div className="flex items-start gap-2.5 p-4 rounded-xl bg-[rgba(166,124,82,0.06)] border border-[rgba(166,124,82,0.15)]">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-[#a67c52]" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <p
                    className="text-[13px] text-[#a67c52] font-medium"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    {screen.benefit}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

