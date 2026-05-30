// app/(marketing)/marketing-stats.tsx
// Sezione "Numeri reali" — dati aggiornabili manualmente

const STATS = [
  { value: '2',    label: 'Agenzie pilota attive',    desc: 'in beta privata' },
  { value: '847',  label: 'Lead gestiti',              desc: 'nella piattaforma' },
  { value: '12+',  label: 'Render AI generati',        desc: 'con AI Renovation' },
  { value: '24+',  label: 'Match automatici creati',   desc: 'lead ↔ immobili' },
]

export function MarketingStats() {
  return (
    <section className="py-20 px-6 lg:px-16 bg-[#1a1a18]">
      <div className="max-w-[1200px] mx-auto">

        <div className="text-center mb-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a67c52] mb-4">
            Dati reali
          </p>
          <h2
            className="text-[clamp(1.8rem,3.5vw,2.6rem)] leading-[1.08] tracking-[-0.02em] text-white"
            style={{ fontWeight: 700 }}
          >
            Costruito sul campo.{' '}
            <em style={{ fontStyle: 'italic', color: '#a67c52' }}>Non su un foglio di calcolo.</em>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(stat => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-7 text-center hover:border-[rgba(166,124,82,0.3)] transition-colors duration-200"
            >
              <p
                className="text-[clamp(2.2rem,4vw,3.2rem)] font-bold text-white leading-none mb-2"
                style={{ letterSpacing: '-0.02em' }}
              >
                {stat.value}
              </p>
              <p
                className="text-[13px] text-[rgba(255,255,255,0.7)] font-medium mb-1"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                {stat.label}
              </p>
              <p
                className="text-[11px] text-[rgba(255,255,255,0.3)] font-mono uppercase tracking-wider"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                {stat.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
