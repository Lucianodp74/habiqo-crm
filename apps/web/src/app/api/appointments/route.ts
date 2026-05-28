// app/api/appointments/route.ts
// POST: crea appuntamento   GET: lista appuntamenti agenzia

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VALID_TYPES = ['visit', 'call', 'meeting', 'signing', 'other']

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { data: member } = await supabase
      .from('agency_members')
      .select('agency_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    if (!member) return NextResponse.json({ error: 'Agenzia non trovata' }, { status: 403 })

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id, title, type, scheduled_at, duration_min, notes,
        lead_id, property_id, created_by, created_at,
        leads(full_name),
        properties(title)
      `)
      .eq('agency_id', member.agency_id)
      .order('scheduled_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ appointments: data ?? [] })
  } catch (err) {
    console.error('[appointments/GET]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { data: member } = await supabase
      .from('agency_members')
      .select('agency_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    if (!member) return NextResponse.json({ error: 'Agenzia non trovata' }, { status: 403 })

    const body = await request.json()
    const { title, type, scheduled_at, duration_min, notes, lead_id, property_id } = body

    if (!title?.trim()) return NextResponse.json({ error: 'Titolo obbligatorio' }, { status: 400 })
    if (!scheduled_at) return NextResponse.json({ error: 'Data obbligatoria' }, { status: 400 })
    if (!VALID_TYPES.includes(type)) return NextResponse.json({ error: 'Tipo non valido' }, { status: 400 })

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        agency_id:    member.agency_id,
        created_by:   user.id,
        title:        title.trim(),
        type,
        scheduled_at,
        duration_min: duration_min ?? 60,
        notes:        notes?.trim() || null,
        lead_id:      lead_id || null,
        property_id:  property_id || null,
      })
      .select('*')
      .single()

    if (error || !data) return NextResponse.json({ error: 'Errore creazione' }, { status: 500 })

    return NextResponse.json({ appointment: data })
  } catch (err) {
    console.error('[appointments/POST]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
