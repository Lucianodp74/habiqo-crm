// app/api/onboarding/agency/route.ts
// Salva i dati dell'agenzia durante l'onboarding

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const body = await request.json()
    const { agencyId, name, city, phone } = body

    if (!agencyId || !name?.trim()) {
      return NextResponse.json({ error: 'Dati non validi' }, { status: 400 })
    }

    // Verifica che l'utente sia owner di questa agenzia
    const { data: member } = await supabase
      .from('agency_members')
      .select('role')
      .eq('agency_id', agencyId)
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .maybeSingle()

    if (!member) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { error } = await supabase
      .from('agencies')
      .update({
        name:  name.trim(),
        city:  city?.trim() || null,
        phone: phone?.trim() || null,
      })
      .eq('id', agencyId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[onboarding/agency]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
