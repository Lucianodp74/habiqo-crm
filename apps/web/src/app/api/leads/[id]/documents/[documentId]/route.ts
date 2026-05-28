// app/api/leads/[id]/documents/[documentId]/route.ts
// Destinazione: apps/web/src/app/api/leads/[id]/documents/[documentId]/route.ts
// DELETE: elimina documento

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const BUCKET = 'lead-documents'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const { documentId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })

    const { data: doc, error: fetchError } = await supabase
      .from('lead_documents')
      .select('id, file_url, agency_id')
      .eq('id', documentId)
      .single()

    if (fetchError || !doc) return NextResponse.json({ error: 'Documento non trovato' }, { status: 404 })

    // Estrae il path dallo URL pubblico
    const url     = new URL(doc.file_url)
    const parts   = url.pathname.split('/storage/v1/object/public/lead-documents/')
    const filePath = parts[1] ?? ''

    if (filePath) {
      await supabase.storage.from(BUCKET).remove([filePath])
    }

    const { error: deleteError } = await supabase
      .from('lead_documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[lead-documents/delete]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
