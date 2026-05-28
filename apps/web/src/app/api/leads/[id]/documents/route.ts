// app/api/leads/[id]/documents/route.ts
// Destinazione: apps/web/src/app/api/leads/[id]/documents/route.ts
// POST: upload documento   GET: lista documenti

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const BUCKET = 'lead-documents'
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]
const VALID_CATEGORIES = [
  'planimetria', 'visura', 'contratto',
  'documento_cliente', 'ape', 'incarico', 'altro',
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params
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

    const formData  = await request.formData()
    const file      = formData.get('file')     as File   | null
    const category  = formData.get('category') as string | null

    if (!file || file.size === 0) return NextResponse.json({ error: 'File mancante' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Max 20 MB' }, { status: 400 })
    if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: 'Formato non supportato' }, { status: 400 })
    if (!category || !VALID_CATEGORIES.includes(category)) return NextResponse.json({ error: 'Categoria non valida' }, { status: 400 })

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path     = `${member.agency_id}/${leadId}/${Date.now()}-${safeName}`
    const buffer   = await file.arrayBuffer()

    const { error: storageError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false })
    if (storageError) return NextResponse.json({ error: 'Errore upload' }, { status: 500 })

    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path)

    const { data: doc, error: dbError } = await supabase
      .from('lead_documents')
      .insert({
        lead_id:           leadId,
        agency_id:         member.agency_id,
        file_name:         file.name,
        file_url:          publicUrl,
        file_type:         file.type,
        document_category: category,
      })
      .select('*')
      .single()

    if (dbError || !doc) return NextResponse.json({ error: 'Errore DB' }, { status: 500 })

    return NextResponse.json({ document: doc })
  } catch (err) {
    console.error('[lead-documents/upload]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { data, error } = await supabase
      .from('lead_documents')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ documents: data ?? [] })
  } catch (err) {
    console.error('[lead-documents/get]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}

