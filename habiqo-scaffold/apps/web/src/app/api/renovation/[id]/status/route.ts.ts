// app/api/renovation/[id]/status/route.ts
// Destinazione: apps/web/src/app/api/renovation/[id]/status/route.ts
// ─────────────────────────────────────────────────────────────────
// IMPORTANTE: crea la cartella [id] (con le parentesi quadre)
// nella struttura: app/api/renovation/[id]/status/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // ── Auth ──────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // ── Fetch status ──────────────────────────────────────────────
    // RLS garantisce che l'utente veda solo i preview della propria agenzia
    const { data, error } = await supabase
      .from('renovation_previews')
      .select('status, after_image_url, error_message')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Preview non trovata' }, { status: 404 })
    }

    return NextResponse.json({
      status:       data.status,
      afterImageUrl: data.after_image_url ?? null,
      error:        data.error_message   ?? null,
    })

  } catch (err) {
    console.error('[renovation/status] Error:', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
