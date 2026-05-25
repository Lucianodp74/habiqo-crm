// app/api/webhooks/replicate/route.ts
// Destinazione: apps/web/src/app/api/webhooks/replicate/route.ts
// ─────────────────────────────────────────────────────────────────
// USA service_role key — bypassa RLS per aggiornare il record
// chiamato direttamente da Replicate (nessuna session utente)

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ── Client admin (service_role) ───────────────────────────────────
// Non usare createClient da @/lib/supabase/server qui:
// questa route non ha una session utente (è una callback esterna)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

const BUCKET = 'property-renovations'

// ── Types ─────────────────────────────────────────────────────────

interface ReplicateWebhookBody {
  id:      string
  status:  'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  output?: string[]
  error?:  string
}

// ── Handler ───────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // ── Verifica webhook secret ───────────────────────────────────
    const secret = request.nextUrl.searchParams.get('secret')
    if (!secret || secret !== process.env.REPLICATE_WEBHOOK_SECRET) {
      console.warn('[webhook/replicate] Secret non valido')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ── Legge payload ─────────────────────────────────────────────
    const body = await request.json() as ReplicateWebhookBody
    const { id: predictionId, status, output, error: replicateError } = body

    if (!predictionId) {
      return NextResponse.json({ error: 'Missing prediction ID' }, { status: 400 })
    }

    // ── Trova il preview record via replicate_prediction_id ───────
    const { data: preview, error: findError } = await supabaseAdmin
      .from('renovation_previews')
      .select('id, agency_id')
      .eq('replicate_prediction_id', predictionId)
      .single()

    if (findError || !preview) {
      // Possibile se il record non è ancora stato aggiornato con il prediction_id.
      // Replicate può fare retry del webhook — log e rispondi 200 per non bloccare.
      console.warn('[webhook/replicate] Preview non trovata per predictionId:', predictionId)
      return NextResponse.json({ ok: true })
    }

    // ── Gestisce gli stati ────────────────────────────────────────

    if (status === 'succeeded' && output?.[0]) {
      // 1. Scarica immagine generata da Replicate
      const imageRes = await fetch(output[0])
      if (!imageRes.ok) {
        throw new Error(`Errore download immagine generata: ${imageRes.status}`)
      }
      const imageBuffer  = await imageRes.arrayBuffer()
      const afterFilename = `${preview.agency_id}/${Date.now()}-after.webp`

      // 2. Upload su Supabase Storage
      const { error: storageError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(afterFilename, imageBuffer, {
          contentType: 'image/webp',
          upsert:      false,
        })

      if (storageError) {
        throw new Error(`Errore storage after image: ${storageError.message}`)
      }

      const { data: { publicUrl: afterImageUrl } } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(afterFilename)

      // 3. Aggiorna record DB
      const { error: updateError } = await supabaseAdmin
        .from('renovation_previews')
        .update({
          after_image_url: afterImageUrl,
          status:          'completed',
        })
        .eq('id', preview.id)

      if (updateError) {
        throw new Error(`Errore DB update completed: ${updateError.message}`)
      }

      console.log('[webhook/replicate] Completed:', preview.id)

    } else if (status === 'failed' || status === 'canceled') {
      await supabaseAdmin
        .from('renovation_previews')
        .update({
          status:        'failed',
          error_message: replicateError ?? 'Generazione fallita o annullata',
        })
        .eq('id', preview.id)

      console.log('[webhook/replicate] Failed:', preview.id, replicateError)
    }

    // Status 'starting' e 'processing' non richiedono azioni
    // (webhook_events_filter = ['completed'] li esclude già da Replicate)

    return NextResponse.json({ ok: true })

  } catch (err) {
    console.error('[webhook/replicate] Error:', err)
    // Risponde 500 così Replicate riproverà il webhook (ha retry automatici)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

