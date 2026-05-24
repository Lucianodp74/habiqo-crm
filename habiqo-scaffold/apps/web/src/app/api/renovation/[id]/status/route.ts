import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const BUCKET = 'property-renovations'

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

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
      .select('status, after_image_url, error_message, replicate_prediction_id')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Preview non trovata' }, { status: 404 })
    }

    if (data.status === 'completed') {
      return NextResponse.json({ status: 'completed', afterImageUrl: data.after_image_url })
    }

    if (data.status === 'failed') {
      return NextResponse.json({ status: 'failed', error: data.error_message })
    }

    if (data.status === 'processing' && data.replicate_prediction_id) {
      const replicateRes = await fetch(
        `https://api.replicate.com/v1/predictions/${data.replicate_prediction_id}`,
        { headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` } }
      )

      if (replicateRes.ok) {
        const prediction = await replicateRes.json()
        console.log('[status] Replicate status:', prediction.status, 'id:', data.replicate_prediction_id)

        if (prediction.status === 'succeeded' && (Array.isArray(prediction.output) ? (Array.isArray(prediction.output) ? prediction.output[0] : prediction.output) : prediction.output)) {
          const imageRes = await fetch((Array.isArray(prediction.output) ? prediction.output[0] : prediction.output))
          const imageBuffer = await imageRes.arrayBuffer()
          const { data: { user: currentUser } } = await supabase.auth.getUser()
          const { data: member } = await supabase
            .from('agency_members')
            .select('agency_id')
            .eq('user_id', currentUser!.id)
            .limit(1)
            .maybeSingle()

          const afterPath = `${member?.agency_id ?? 'unknown'}/${Date.now()}-after.webp`

          await supabaseAdmin.storage
            .from(BUCKET)
            .upload(afterPath, imageBuffer, { contentType: 'image/webp', upsert: false })

          const { data: { publicUrl: afterImageUrl } } = supabaseAdmin.storage
            .from(BUCKET)
            .getPublicUrl(afterPath)

          await supabaseAdmin
            .from('renovation_previews')
            .update({ after_image_url: afterImageUrl, status: 'completed' })
            .eq('id', id)

          console.log('[status] Completed! afterImageUrl:', afterImageUrl)
          return NextResponse.json({ status: 'completed', afterImageUrl })
        }

        if (prediction.status === 'failed') {
          await supabaseAdmin
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


