import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('renovation_previews')
      .select('status, after_image_url, error_message')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Preview non trovata' }, { status: 404 })
    }

    return NextResponse.json({
      status:        data.status,
      afterImageUrl: data.after_image_url ?? null,
      error:         data.error_message   ?? null,
    })

  } catch (err) {
    console.error('[renovation/status] Error:', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
