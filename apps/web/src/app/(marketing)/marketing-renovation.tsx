// app/(marketing)/marketing-renovation.tsx
// Sezione AI Renovation con render reali dal DB

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { RenovationSliderShowcase } from './renovation-slider-showcase'

async function getShowcaseRenders() {
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    const { data } = await admin
      .from('renovation_previews')
      .select('id, before_image_url, after_image_url, style')
      .eq('status', 'completed')
      .not('before_image_url', 'is', null)
      .not('after_image_url', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3)
    return data ?? []
  } catch {
    return []
  }
}

export async function MarketingRenovation() {
  const renders = await getShowcaseRenders()

  return (
    <section id="ai-renovation" className="py-28 bg-[#111110]">
      <div className="px-6 lg:px-16 max-w-[1200px] mx-auto">

        {/* Header */}
        <div className="mb-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#a67c52] mb-4">
            AI Renovation
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-end">
            <h2
              className="text-[clamp(2rem,4vw,3rem)] leading-[1.08] tracking-[-0.02em] text-white"
              style={{ fontWeight: 700 }}
            >
              Mostra il potenziale.{' '}
              <em style={{ fontStyle: 'italic', color: '#a67c52' }}>Prima ancora di ristrutturare.</em>
            </h2>
            <p
              className="text-[16px] leading-[1.65] text-[rgba(255,255,255,0.5)] lg:text-right"
              style={{ fontFamily: 'system-ui, sans-serif', fontWeight: 400 }}
            >
              Carica una foto dell'immobile, scegli lo stile e in pochi secondi
              l'AI genera un render fotorealistico. Il cliente vede il dopo,
              tu chiudi prima.
            </p>
          </div>
        </div>

        {/* Slider o fallback */}
        {renders.length > 0 ? (
          <RenovationSliderShowcase renders={renders} />
        ) : (
          <div className="rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-16 text-center">
            <p className="text-[rgba(255,255,255,0.3)] text-[14px]" style={{ fontFamily: 'system-ui, sans-serif' }}>
              Genera il primo render AI per vederlo qui
            </p>
          </div>
        )}

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 mt-12">
          {[
            '⚡ Render in 30 secondi',
            '🎨 Multipli stili: moderno, classico, minimal',
            '📱 Slider prima/dopo mobile-friendly',
            '🔗 Genera lead automaticamente',
          ].map(pill => (
            <span
              key={pill}
              className="inline-flex items-center px-4 py-2 rounded-full border border-[rgba(255,255,255,0.1)] text-[13px] text-[rgba(255,255,255,0.6)]"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {pill}
            </span>
          ))}
        </div>

      </div>
    </section>
  )
}

