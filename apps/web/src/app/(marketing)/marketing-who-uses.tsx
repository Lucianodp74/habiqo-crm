// app/(marketing)/marketing-who-uses.tsx

const CARDS = [
  {
    icon: '🏠',
    title: 'Agenzie indipendenti',
    desc:  'Gestisci lead, immobili e documenti in un unico sistema. Smetti di usare Excel e WhatsApp come CRM.',
    tags:  ['CRM Lead', 'Documenti', 'Pipeline'],
  },
  {
    icon: '👥',
    title: 'Team immobiliari',
    desc:  'Agenda condivisa, matching automatico e collaborazione in tempo reale. Il team lavora come uno solo.',
    tags:  ['Agenda condivisa', 'Matching AI', 'Multi-agente'],
    featured: true,
  },
  {
    icon: '📈',
    title: 'Agenzie orientate alla crescita',
    desc:  'AI Renovation, automazioni intelligenti e processi scalabili. La piattaforma cresce con la tua agenzia.',
    tags:  ['AI Renovation', 'Automazioni', 'Scalabile'],
  },
]

export function MarketingWhoUses() {
  return (
    <section className="py-20 px-6 lg:px-16 bg-[#FAF9F6]">
      <div className="max-w-[1200px] mx-auto">

        <div className="text-center mb-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a67c52] mb-4">
            Per chi è Habiquo
          </p>
          <h2
            className="text-[clamp(1.8rem,3.5vw,2.6rem)] leading-[1.08] tracking-[-0.02em] text-[#1a1a18]"
            style={{ fontWeight: 700 }}
          >
            Una piattaforma. Tre profili di agenzia.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CARDS.map(card => (
            <div
              key={card.title}
              className={[
                'rounded-2xl p-7 border transition-all duration-200',
                card.featured
                  ? 'bg-[#1a1a18] border-[#1a1a18] shadow-[0_20px_60px_-20px_rgba(0,0,0,0.3)]'
                  : 'bg-white border-[#e8e5df] hover:border-[rgba(166,124,82,0.3)] hover:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.1)]',
              ].join(' ')}
            >
              <span className="text-3xl block mb-5">{card.icon}</span>

              <h3
                className={[
                  'text-[18px] font-semibold leading-[1.3] mb-3',
                  card.featured ? 'text-white' : 'text-[#1a1a18]',
                ].join(' ')}
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                {card.title}
              </h3>

              <p
                className={[
                  'text-[14px] leading-[1.6] mb-6',
                  card.featured ? 'text-[rgba(255,255,255,0.55)]' : 'text-[#6b6660]',
                ].join(' ')}
                style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}
              >
                {card.desc}
              </p>

              <div className="flex flex-wrap gap-2">
                {card.tags.map(tag => (
                  <span
                    key={tag}
                    className={[
                      'text-[11px] px-3 py-1 rounded-full border font-medium',
                      card.featured
                        ? 'border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.06)]'
                        : 'border-[#e8e5df] text-[#9a9490] bg-[#f5f4f0]',
                    ].join(' ')}
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
