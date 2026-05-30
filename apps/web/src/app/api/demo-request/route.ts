// app/api/demo-request/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, cognome, agenzia, email, telefono, citta } = body

    if (!nome || !email || !agenzia) {
      return NextResponse.json({ error: 'Campi obbligatori mancanti' }, { status: 400 })
    }

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e8e5df;">
        <div style="background:#1a1a18;padding:24px 32px;">
          <p style="color:#a67c52;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 4px;">HABIQUO · NUOVA RICHIESTA DEMO</p>
          <h2 style="color:#fff;font-size:20px;margin:0;">${nome} ${cognome || ''} — ${agenzia}</h2>
        </div>
        <div style="padding:28px 32px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px 0;color:#9a9490;font-size:12px;width:120px;">Nome</td><td style="padding:8px 0;color:#1a1a18;font-size:14px;font-weight:600;">${nome} ${cognome || ''}</td></tr>
            <tr><td style="padding:8px 0;color:#9a9490;font-size:12px;">Agenzia</td><td style="padding:8px 0;color:#1a1a18;font-size:14px;font-weight:600;">${agenzia}</td></tr>
            <tr><td style="padding:8px 0;color:#9a9490;font-size:12px;">Email</td><td style="padding:8px 0;color:#a67c52;font-size:14px;"><a href="mailto:${email}" style="color:#a67c52;">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#9a9490;font-size:12px;">Telefono</td><td style="padding:8px 0;color:#1a1a18;font-size:14px;">${telefono || '—'}</td></tr>
            <tr><td style="padding:8px 0;color:#9a9490;font-size:12px;">Città</td><td style="padding:8px 0;color:#1a1a18;font-size:14px;">${citta || '—'}</td></tr>
          </table>
          <div style="margin-top:24px;padding:16px;background:#f5f4f0;border-radius:8px;">
            <p style="margin:0;font-size:12px;color:#9a9490;">Ricevuto il ${new Date().toLocaleDateString('it-IT', { weekday:'long', day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })}</p>
          </div>
        </div>
      </div>
    `

    await resend.emails.send({
      from:    'Habiquo <noreply@habiquo.it>',
      to:      'lucianodelpriore@icloud.com',
      subject: `🏠 Nuova richiesta demo — ${agenzia} (${nome})`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[demo-request]', err)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }
}
