import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TYPES  = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024
const BUCKET         = 'property-renovations'

const VALID_ROOM_TYPES = [
  'living_room', 'bedroom', 'kitchen', 'bathroom', 'office', 'dining_room',
]
const VALID_STYLES = [
  'modern_italian', 'mediterranean_luxury', 'minimal_warm',
]

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { data: member, error: memberError } = await supabase
      .from('agency_members')
      .select('agency_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (memberError || !member) {
      return NextResponse.json({ error: 'Agenzia non trovata' }, { status: 403 })
    }

    const formData   = await request.formData()
    const file       = formData.get('file')       as File   | null
    const roomType   = formData.get('roomType')   as string | null
    const style      = formData.get('style')      as string | null
    const propertyId = formData.get('propertyId') as string | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'File immagine mancante' }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Immagine troppo grande. Max 10 MB.' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Formato non supportato. Usa JPG, PNG o WEBP.' }, { status: 400 })
    }
    if (!roomType || !VALID_ROOM_TYPES.includes(roomType)) {
      return NextResponse.json({ error: 'Tipo di stanza non valido' }, { status: 400 })
    }
    if (!style || !VALID_STYLES.includes(style)) {
      return NextResponse.json({ error: 'Stile non valido' }, { status: 400 })
    }

    const ext      = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const filename = `${member.agency_id}/${Date.now()}-before.${ext}`
    const buffer   = await file.arrayBuffer()

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, buffer, { contentType: file.type, upsert: false })

    if (storageError) {
      console.error('[renovation/upload] Storage error:', storageError)
      return NextResponse.json({ error: 'Errore salvataggio immagine' }, { status: 500 })
    }

    const { data: { publicUrl: beforeImageUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename)

    const { data: preview, error: dbError } = await supabase
      .from('renovation_previews')
      .insert({
        agency_id:        member.agency_id,
        property_id:      propertyId || null,
        before_image_url: beforeImageUrl,
        room_type:        roomType,
        style,
        status:           'pending',
      })
      .select('id')
      .single()

    if (dbError || !preview) {
      console.error('[renovation/upload] DB error:', dbError)
      return NextResponse.json({ error: 'Errore salvataggio dati' }, { status: 500 })
    }

    return NextResponse.json({ previewId: preview.id, beforeImageUrl })

  } catch (err) {
    console.error('[renovation/upload] Unexpected error:', err)
    return NextResponse.json({ error: 'Errore interno del server' }, { status: 500 })
  }
}