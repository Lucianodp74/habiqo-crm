// app/onboarding/page.tsx
import { OnboardingForm } from './onboarding-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Configura la tua agenzia · Habiquo' }

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Recupera i dati già esistenti
  const { data: member } = await supabase
    .from('agency_members')
    .select('agency_id, agencies(id, name, city, phone)')
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .limit(1)
    .maybeSingle()

  if (!member) redirect('/dashboard')

  const agency = member.agencies as unknown as { id: string; name: string; city: string | null; phone: string | null } | null

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent-deep)] mb-3">
            HABIQUO
          </p>
          <h1 className="font-display text-[28px] text-[var(--fg-primary)] leading-tight mb-2">
            Configura la tua agenzia
          </h1>
          <p className="text-[14px] text-[var(--fg-muted)]">
            Ci vorranno 30 secondi. Puoi modificare tutto dopo.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex-1 h-1 rounded-full bg-[var(--accent-deep)]" />
          <div className="flex-1 h-1 rounded-full bg-[var(--fg-primary)]" />
          <div className="flex-1 h-1 rounded-full bg-[var(--border-subtle)]" />
        </div>

        <OnboardingForm
          agencyId={agency?.id ?? ''}
          initialName={agency?.name ?? ''}
          initialCity={agency?.city ?? ''}
          initialPhone={agency?.phone ?? ''}
        />

      </div>
    </div>
  )
}

