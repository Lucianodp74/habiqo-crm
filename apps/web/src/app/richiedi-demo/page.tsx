// app/richiedi-demo/page.tsx
import Link from 'next/link'
import { DemoForm } from './demo-form'

export const metadata = {
  title: 'Richiedi una demo privata · HABIQUO',
  description: 'Scopri HABIQUO in una demo personalizzata. CRM AI per agenzie immobiliari italiane.',
}

export default function RichiediDemoPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6]">

      {/* Minimal nav */}
      <header className="px-6 lg:px-16 h-16 flex items-center justify-between border-b border-[#e8e5df]">
        <Link href="/" className="font-display text-[18px] font-bold text-[#1a1a18] hover:opacity-70 transition-opacity">
          HABIQUO
        </Link>
        <Link href="/" className="text-[13px] text-[#6b6660] hover:text-[#1a1a18] transition-colors" style={{ fontFamily: 'system-ui, sans-serif' }}>
          ← Torna alla home
        </Link>
      </header>

      <div className="max-w-[1100px] mx-auto px-6 lg:px-16 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">

          {/* Left: Copy */}
          <div className="lg:sticky lg:top-24">
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a67c52] animate-pulse" />
              <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a67c52]">
                Founder Program · Posti limitati
              </span>
            </div>

            <h1
              className="text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.02em] text-[#1a1a18] mb-6"
              style={{ fontWeight: 700 }}
            >
              Prenota la tua{' '}
              <em style={{ fontStyle: 'italic', color: '#a67c52' }}>demo privata.</em>
            </h1>

            <p
              className="text-[16px] leading-[1.65] text-[#6b6660] mb-10"
              style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}
            >
              Ti mostriamo Habiquo in una sessione personalizzata.
              Nessun discorso commerciale — solo il prodotto, adattato
              al tuo modo di lavorare.
            </p>

            <ul className="space-y-4 mb-10">
              {[
                { icon: '⏱', text: 'Demo di 30 minuti, via video call' },
                { icon: '🎯', text: 'Personalizzata sulla tua agenzia' },
                { icon: '🔓', text: 'Accesso immediato dopo la demo' },
                { icon: '🤝', text: 'Onboarding 1:1 con il team Habiquo' },
              ].map(item => (
                <li key={item.text} className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <span
                    className="text-[14px] text-[#44403c]"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                  >
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>

            <div className="p-5 rounded-2xl border border-[#e8e5df] bg-white">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[#9a9490] mb-3">Incluso nel Founder Program</p>
              <div className="grid grid-cols-2 gap-2">
                {['CRM completo', 'AI Renovation', 'Agenda team', 'Sito Habita', 'Matching AI', 'Documenti lead'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-[#a67c52] flex-shrink-0" viewBox="0 0 14 14" fill="none">
                      <path d="M2.5 7l3 3L11.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[12px] text-[#6b6660]" style={{ fontFamily: 'system-ui, sans-serif' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] shadow-[0_8px_40px_-16px_rgba(0,0,0,0.1)] p-8">
            <h2 className="text-[20px] font-bold text-[#1a1a18] mb-2" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Compila il form
            </h2>
            <p className="text-[13px] text-[#9a9490] mb-7" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Ti risponderemo entro 24 ore.
            </p>
            <DemoForm />
          </div>

        </div>
      </div>
    </div>
  )
}
