// app/(app)/dashboard/agenda/page.tsx
// Pagina agenda condivisa del team

import { AgendaView } from '@/components/agenda/agenda-view'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AgendaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: member } = await supabase
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!member) redirect('/dashboard')

  const { data: leads } = await supabase
    .from('leads')
    .select('id, full_name')
    .eq('agency_id', member.agency_id)
    .not('status', 'in', '("won","lost")')
    .order('full_name')
    .limit(100)

  const { data: properties } = await supabase
    .from('properties')
    .select('id, title')
    .eq('agency_id', member.agency_id)
    .order('title')
    .limit(100)

  return (
    <div className="px-4 sm:px-8 py-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-muted)] mb-2">
          Team agenda
        </p>
        <h1 className="font-display text-[clamp(1.8rem,4vw,2.5rem)] text-[var(--fg-primary)] leading-tight">
          Agenda
        </h1>
        <p className="text-[13px] text-[var(--fg-muted)] mt-1">
          Appuntamenti condivisi con tutto il team.
        </p>
      </div>
      <AgendaView
        leads={leads ?? []}
        properties={properties ?? []}
      />
    </div>
  )
}
