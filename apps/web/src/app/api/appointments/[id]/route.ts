// app/api/appointments/[id]/route.ts
// DELETE: elimina appuntamento   PATCH: modifica appuntamento

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VALID_TYPES = ['visit', 'call', 'meeting', 'signing', 'other']

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[appointments/DELETE]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.title?.trim())                  updates.title        = body.title.trim()
    if (body.type && VALID_TYPES.includes(body.type)) updates.type = body.type
    if (body.scheduled_at)                   updates.scheduled_at = body.scheduled_at
    if (body.duration_min)                   updates.duration_min = body.duration_min
    if ('notes' in body)                     updates.notes        = body.notes || null
    if ('lead_id' in body)                   updates.lead_id      = body.lead_id || null
    if ('property_id' in body)               updates.property_id  = body.property_id || null

    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) return NextResponse.json({ error: 'Errore aggiornamento' }, { status: 500 })

    return NextResponse.json({ appointment: data })
  } catch (err) {
    console.error('[appointments/PATCH]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
