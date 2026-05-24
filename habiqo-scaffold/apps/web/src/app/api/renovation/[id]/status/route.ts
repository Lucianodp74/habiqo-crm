import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const BUCKET = 'property-renovations'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { data, error } = await supabase
      .from('renovation_previews')
      .select('status, after_image_url, error_message, replicate_prediction_id, agency_id')
      .eq('id', id)
      .single()

    if (error || !data) return NextResponse.json({ error: 'Preview non trovata' }, { status: 404 })

    if (data.status === 'completed') return NextResponse.json({ status: 'completed', afterImageUrl: data.after_image_url })
    if (data.status === 'failed') return NextResponse.json({ status: 'failed', error: data.error_message })

    if (data.status === 'processing' && data.replicate_prediction_id) {
      const replicateRes = await fetch(
        `https://api.replicate.com/v1/predictions/${data.replicate_prediction_id}`,
        { headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` } }
      )

      if (replicateRes.ok) {
        const prediction = await replicateRes.json()
        console.log('[status] Replicate status:', prediction.status, 'id:', data.replicate_prediction_id)

        if (prediction.status === 'succeeded' && prediction.output) {
          const outputUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output

          const imageRes = await fetch(outputUrl)
          const imageBuffer = await imageRes.arrayBuffer()
          const afterPath = `${data.agency_id}/${Date.now()}-after.webp`

          const { error: storageError } = await supabase.storage
            .from(BUCKET)
            .upload(afterPath, imageBuffer, { contentType: 'image/webp', upsert: false })

          if (storageError) {
            console.error('[status] Storage error:', storageError.message)
            return NextResponse.json({ status: 'processing', afterImageUrl: null })
          }

          const { data: { publicUrl: afterImageUrl } } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(afterPath)

          await supabase
            .from('renovation_previews')
            .update({ after_image_url: afterImageUrl, status: 'completed' })
            .eq('id', id)

          console.log('[status] Completed! afterImageUrl:', afterImageUrl)
          return NextResponse.json({ status: 'completed', afterImageUrl })
        }

        if (prediction.status === 'failed') {
          await supabase
            .from('renovation_previews')
            .update({ status: 'failed', error_message: prediction.error ?? 'Generazione fallita' })
            .eq('id', id)
          return NextResponse.json({ status: 'failed', error: prediction.error })
        }
      }
    }

    return NextResponse.json({ status: data.status, afterImageUrl: null })

  } catch (err) {
    console.error('[status] Error:', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
