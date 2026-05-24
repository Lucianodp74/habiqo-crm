// app/api/renovation/generate/route.ts
// Destinazione: apps/web/src/app/api/renovation/generate/route.ts
// ─────────────────────────────────────────────────────────────────

import { createClient }           from '@/lib/supabase/server'
import { startRenovationRender }  from '@/lib/replicate'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  let previewId: string | null = null

  try {
    // ── Auth ──────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // ── Legge body ────────────────────────────────────────────────
    const body = await request.json() as { previewId?: string }
    previewId  = body.previewId ?? null

    if (!previewId) {
      return NextResponse.json({ error: 'previewId mancante' }, { status: 400 })
    }

    // ── Fetch preview (RLS garantisce accesso solo alla propria agenzia) ──
    const { data: preview, error: fetchError } = await supabase
      .from('renovation_previews')
      .select('id, before_image_url, room_type, style, status')
      .eq('id', previewId)
      .single()

    if (fetchError || !preview) {
      return NextResponse.json({ error: 'Preview non trovata' }, { status: 404 })
    }

    // Evita doppio invio se già in processing/completed
    if (preview.status === 'processing' || preview.status === 'completed') {
      return NextResponse.json({ ok: true, alreadyStarted: true })
    }

    // ── Costruisce webhook URL ────────────────────────────────────
    // Il secret nel query param autentica la callback di Replicate
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL non configurata')
    }
    const webhookUrl = `${appUrl}/api/webhooks/replicate?secret=${process.env.REPLICATE_WEBHOOK_SECRET}`

    // ── Chiama Replicate API ──────────────────────────────────────
    const prediction = await startRenovationRender({
      imageUrl:   preview.before_image_url,
      roomType:   preview.room_type,
      style:      preview.style,
      webhookUrl,
    })

    // ── Aggiorna DB: salva prediction_id e imposta 'processing' ──
    const { error: updateError } = await supabase
      .from('renovation_previews')
      .update({
        replicate_prediction_id: prediction.id,
        status:                  'processing',
      })
      .eq('id', previewId)

    if (updateError) {
      console.error('[renovation/generate] DB update error:', updateError)
      // Non fatale: il webhook aggiornerà comunque il record
    }

    return NextResponse.json({ ok: true, predictionId: prediction.id })

  } catch (err) {
    console.error('[renovation/generate] Error:', err)

    // Marca come failed se abbiamo il previewId
    if (previewId) {
      try {
        const supabase = await createClient()
        await supabase
          .from('renovation_previews')
          .update({
            status:        'failed',
            error_message: 'Errore avvio generazione AI',
          })
          .eq('id', previewId)
      } catch {
        // Ignora errori secondari
      }
    }

    return NextResponse.json({ error: 'Errore avvio generazione AI' }, { status: 500 })
  }
}
