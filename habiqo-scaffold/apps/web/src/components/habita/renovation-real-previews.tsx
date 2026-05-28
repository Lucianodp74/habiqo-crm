import { createClient } from '@supabase/supabase-js'
import { BeforeAfterSlider } from '@/components/renovation/before-after-slider'

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ROOM_LABELS: Record<string, string> = {
  living_room:  'Soggiorno',
  bedroom:      'Camera da letto',
  kitchen:      'Cucina',
  bathroom:     'Bagno',
  office:       'Studio',
  dining_room:  'Sala da pranzo',
}

const STYLE_LABELS: Record<string, string> = {
  modern_italian:       'Modern Italian',
  mediterranean_luxury: 'Mediterranean Luxury',
  minimal_warm:         'Minimal Warm',
}

interface Props {
  agencyId: string
}

export async function RenovationRealPreviews({ agencyId }: Props) {
  const { data: previews, error } = await supabasePublic
    .from('renovation_previews')
    .select('id, before_image_url, after_image_url, room_type, style')
    .eq('agency_id', agencyId)
    .eq('status', 'completed')
    .not('after_image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3)

  if (error) console.error('[RenovationRealPreviews] Error:', error.message)
  if (!previews || previews.length === 0) return null

  const gridClass =
    previews.length === 1 ? 'max-w-lg mx-auto' :
    previews.length === 2 ? 'grid md:grid-cols-2 gap-6' :
    'grid md:grid-cols-3 gap-6'

  return (
    <section className="py-20 bg-[var(--bg-canvas)] border-t border-[var(--border-subtle)]">
      <div className="px-6 md:px-16 max-w-6xl mx-auto">

        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-4">
            AI Renovation Preview
          </p>
          <h2 className="font-display text-3xl md:text-5xl text-[var(--fg-primary)] leading-tight mb-4">
            Render AI reali.<br />
            <span className="italic text-[var(--accent-deep)]">Immobili nostri clienti.</span>
          </h2>
          <p className="text-sm md:text-base text-[var(--fg-secondary)] max-w-xl mx-auto leading-relaxed">
            Carica le foto del tuo immobile e scopri in pochi secondi come
            apparirebbe valorizzato con intelligenza artificiale.
          </p>
        </div>

        <div className={gridClass}>
          {previews.map((preview) => (
            <div key={preview.id} className="space-y-3">
              <BeforeAfterSlider
                beforeUrl={preview.before_image_url}
                afterUrl={preview.after_image_url!}
              />
              <p className="text-xs text-[var(--fg-muted)] text-center">
                {ROOM_LABELS[preview.room_type] ?? preview.room_type}
                {' - '}
                {STYLE_LABELS[preview.style] ?? preview.style}
              </p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-[var(--fg-secondary)] mb-4">
            Vuoi vedere il tuo immobile valorizzato con AI?
          </p>
          <a
            href="#contatti"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--fg-primary)] text-[var(--bg-canvas)] text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Richiedi il tuo render gratuito
          </a>
        </div>

      </div>
    </section>
  )
}

