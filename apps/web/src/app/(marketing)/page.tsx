import Link from 'next/link'
import { MarketingNav } from './marketing-nav'

export const metadata = {
  title: 'HABIQUO · Il CRM AI per agenzie immobiliari italiane',
  description: 'CRM, matching automatico, AI renovation e agenda team. La piattaforma proptech che le migliori agenzie italiane useranno domani.',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]" style={{ fontFamily: 'var(--font-display, serif)' }}>

      <MarketingNav />

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section id="hero" className="pt-32 pb-20 px-6 lg:px-16 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52]" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a67c52]">
                Founder Access · Accesso limitato
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-[clamp(2.4rem,5vw,3.8rem)] leading-[1.06] tracking-[-0.02em] text-[#1a1a18] mb-6"
              style={{ fontWeight: 700 }}
            >
              Il sistema operativo delle agenzie immobiliari{' '}
              <span style={{ fontStyle: 'italic', color: '#a67c52' }}>italiane.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-[18px] leading-[1.6] text-[#6b6660] max-w-[480px] mb-10" style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}>
              CRM, matching automatico lead–immobili, AI renovation e agenda team.
              Tutto in un'unica piattaforma. Senza Excel, senza frammentazione.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-14">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#1a1a18] text-white text-[14px] font-semibold hover:bg-[#2d2d2a] transition-colors"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Richiedi demo privata
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <a
                href="#funzionalita"
                className="text-[14px] text-[#6b6660] hover:text-[#1a1a18] transition-colors underline underline-offset-4"
                style={{ fontFamily: 'system-ui, sans-serif' }}
              >
                Vedi come funziona
              </a>
            </div>

            {/* Social proof mini */}
            <div className="flex items-center gap-6 pt-8 border-t border-[#e8e5df]">
              {[
                { value: '2', label: 'agenzie in beta privata' },
                { value: '100%', label: 'agency-scoped e sicuro' },
                { value: 'AI', label: 'integrata nativamente' },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-[20px] font-bold text-[#1a1a18] leading-none mb-1">{stat.value}</p>
                  <p className="text-[11px] text-[#9a9490]" style={{ fontFamily: 'system-ui, sans-serif' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Dashboard Screenshot */}
          <div className="relative">
            {/* Glow behind */}
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(166,124,82,0.12), transparent 70%)',
                filter: 'blur(24px)',
                transform: 'scale(1.1)',
              }}
            />

            {/* Browser chrome */}
            <div className="relative rounded-2xl overflow-hidden shadow-[0_32px_80px_-20px_rgba(0,0,0,0.22)] border border-[rgba(0,0,0,0.08)]">
              {/* Browser bar */}
              <div className="flex items-center gap-1.5 px-4 py-3 bg-[#f0ede8] border-b border-[rgba(0,0,0,0.06)]">
                <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                <div className="flex-1 mx-4">
                  <div className="h-5 bg-[rgba(0,0,0,0.06)] rounded-md flex items-center px-3">
                    <span className="text-[10px] text-[#9a9490]" style={{ fontFamily: 'system-ui, sans-serif' }}>habiquo.it/dashboard</span>
                  </div>
                </div>
              </div>

              {/* Screenshot placeholder */}
              <div
                className="w-full bg-[#f5f4f0] flex items-center justify-center"
                style={{ aspectRatio: '16/10', minHeight: '320px' }}
              >
                <img src="https://jwivrcofmxnpgkdolnuo.supabase.co/storage/v1/object/public/landing/dashboard%20per%20landing.png" alt="Dashboard Habiquo" className="w-full h-full object-cover object-top" />
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[rgba(0,0,0,0.06)] px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#9a9490] mb-1" style={{ fontFamily: 'system-ui, sans-serif' }}>Lead attivi</p>
              <p className="text-[22px] font-bold text-[#1a1a18] leading-none">847</p>
            </div>

            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[rgba(0,0,0,0.06)] px-4 py-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#9a9490] mb-1" style={{ fontFamily: 'system-ui, sans-serif' }}>Match trovati</p>
              <p className="text-[22px] font-bold text-[#a67c52] leading-none">12</p>
            </div>
          </div>

        </div>
      </section>

      {/* ── PLACEHOLDER SEZIONI FUTURE ─────────────────────────── */}
      <div id="funzionalita" />
      <div id="ai-renovation" />
      <div id="dashboard" />
      <div id="founder-access" />

    </div>
  )
}

