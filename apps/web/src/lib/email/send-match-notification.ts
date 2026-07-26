// lib/email/send-match-notification.ts
// Invia email di riepilogo all'owner quando un nuovo immobile matcha i lead

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { resend, EMAIL_FROM } from './resend-client'

const LISTING_LABEL: Record<string, string> = {
  sale: 'Vendita',
  rent: 'Affitto',
}

function formatPrice(price: number | null, type: string): string {
  if (!price) return 'N/D'
  const fmt = new Intl.NumberFormat('it-IT', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(price)
  return type === 'rent' ? fmt + '/mese' : fmt
}

// Normalizza un numero italiano (con o senza prefisso, con o senza spazi/simboli)
// nel formato richiesto da wa.me: solo cifre, con prefisso internazionale 39.
function toWhatsAppNumber(raw: string | null): string | null {
  if (!raw) return null
  let digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null

  if (digits.startsWith('0039')) digits = digits.slice(2)

  if (digits.startsWith('39') && digits.length >= 11) return digits
  if (digits.startsWith('3') && digits.length === 10) return '39' + digits

  // Formato non riconosciuto con certezza: meglio non generare un link che potrebbe
  // essere sbagliato piuttosto che rischiare un invio al numero errato.
  return null
}

function buildWhatsAppMessage(opts: {
  leadName: string
  propertyTitle: string
  propertyCity: string | null
  priceFormatted: string
  propertyUrl: string
}): string {
  const cityPart = opts.propertyCity ? ` a ${opts.propertyCity}` : ''
  return `Ciao ${opts.leadName}, ho un immobile che potrebbe interessarti: ${opts.propertyTitle}${cityPart}, ${opts.priceFormatted}. Ecco il link: ${opts.propertyUrl}`
}

function buildEmailHtml(opts: {
  ownerName:     string
  propertyTitle: string
  propertyCity:  string | null
  priceEur:      number | null
  listingType:   string
  rooms:         number | null
  sqm:           number | null
  matchCount:    number
  leads:         { id: string; name: string; city: string | null; budget: string; whatsappUrl: string | null }[]
  appUrl:        string
}): string {
  const leadsHtml = opts.leads.map(lead => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ede8;">
        <a href="${opts.appUrl}/crm/leads/${lead.id}" style="color:#a67c52;text-decoration:none;font-weight:600;">${lead.name}</a>
      </td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ede8;color:#78716c;font-size:13px;">${lead.city ?? 'N/D'}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ede8;color:#78716c;font-size:13px;">${lead.budget}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f0ede8;text-align:center;">
        ${lead.whatsappUrl
          ? `<a href="${lead.whatsappUrl}" style="display:inline-block;padding:6px 12px;background:#25D366;color:#ffffff;text-decoration:none;font-size:12px;font-weight:600;border-radius:6px;">WhatsApp</a>`
          : `<span style="color:#a8a29e;font-size:11px;">Nessun numero</span>`}
      </td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:32px 16px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">
        <tr><td style="background:#1a1a18;padding:24px 32px;">
          <p style="margin:0;color:#a67c52;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">HABIQUO CRM &middot; MATCHING</p>
          <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;font-weight:700;">
            ${opts.matchCount} lead compatibil${opts.matchCount === 1 ? 'e' : 'i'} trovati
          </h1>
        </td></tr>
        <tr><td style="padding:28px 32px;">
          <p style="margin:0 0 20px;color:#44403c;font-size:15px;line-height:1.6;">
            Ciao <strong>${opts.ownerName}</strong>,<br/>
            il nuovo immobile <strong>${opts.propertyTitle}</strong> e compatibile con ${opts.matchCount} lead nel tuo CRM.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f8f6;border-radius:10px;border:1px solid #e8e5df;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;">
              <p style="margin:0 0 2px;color:#a67c52;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">Immobile pubblicato</p>
              <p style="margin:0;color:#1a1a18;font-size:16px;font-weight:700;">${opts.propertyTitle}</p>
              <p style="margin:4px 0 0;color:#78716c;font-size:13px;">
                ${opts.propertyCity ?? 'N/D'} &middot; ${formatPrice(opts.priceEur, opts.listingType)} &middot; ${LISTING_LABEL[opts.listingType] ?? opts.listingType}
                ${opts.rooms ? ` &middot; ${opts.rooms} cam &middot; ${opts.sqm ?? '?'} mq` : ''}
              </p>
            </td></tr>
          </table>
          <p style="margin:0 0 12px;color:#44403c;font-size:14px;font-weight:600;">Lead compatibili:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e5df;border-radius:10px;overflow:hidden;margin-bottom:24px;">
            <tr style="background:#f9f8f6;">
              <th style="padding:8px 12px;text-align:left;color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Lead</th>
              <th style="padding:8px 12px;text-align:left;color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Citta</th>
              <th style="padding:8px 12px;text-align:left;color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Budget</th>
              <th style="padding:8px 12px;text-align:center;color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Contatta</th>
            </tr>
            ${leadsHtml}
          </table>
          <table cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background:#1a1a18;">
            <a href="${opts.appUrl}/crm/leads" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
              Vai ai lead nel CRM
            </a>
          </td></tr></table>
        </td></tr>
        <tr><td style="padding:16px 32px 24px;border-top:1px solid #f0ede8;">
          <p style="margin:0;color:#a8a29e;font-size:11px;">Notifica automatica di <strong>Habiquo CRM</strong> &middot; Smart living. Smart real estate.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export type PropertyForMatch = {
  id:           string
  title:        string
  city:         string | null
  price_eur:    number | null
  rooms:        number | null
  sqm:          number | null
  listing_type: string
}

export async function sendMatchNotificationForProperty(
  property: PropertyForMatch,
  agencyId: string,
  appUrl:   string,
): Promise<void> {
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // 1. Lead compatibili (aggiunto "phone" rispetto alla versione precedente)
    let query = admin
      .from('leads')
      .select('id, full_name, preferred_city, budget_min_eur, budget_max_eur, phone')
      .eq('agency_id', agencyId)
      .not('status', 'in', '("won","lost")')

    if (property.city)         query = query.or(`preferred_city.is.null,preferred_city.ilike.${property.city}`)
    if (property.listing_type) query = query.or(`preferred_listing_type.is.null,preferred_listing_type.eq.${property.listing_type}`)
    if (property.price_eur) {
      const p = Number(property.price_eur)
      query = query
        .or(`budget_max_eur.is.null,budget_max_eur.gte.${p}`)
        .or(`budget_min_eur.is.null,budget_min_eur.lte.${p}`)
    }

    const { data: leads, error: leadsErr } = await query
    console.log('[match] leads found:', leads?.length ?? 0, 'error:', leadsErr?.message)

    if (!leads || leads.length === 0) return

    // 2. Email owner
    const { data: ownerMember } = await admin
      .from('agency_members')
      .select('user_id')
      .eq('agency_id', agencyId)
      .eq('role', 'owner')
      .limit(1)
      .maybeSingle()

    if (!ownerMember) { console.log('[match] no owner'); return }

    const { data: { user: ownerUser }, error: authErr } = await admin.auth.admin.getUserById(ownerMember.user_id)
    console.log('[match] owner email:', ownerUser?.email, 'authErr:', authErr?.message)

    if (!ownerUser?.email) return

    const { data: ownerProfile } = await admin
      .from('profiles')
      .select('full_name')
      .eq('id', ownerMember.user_id)
      .maybeSingle()

    const ownerName = ownerProfile?.full_name?.trim() || ownerUser.email

    // 3. Invia email (ogni lead con numero valido riceve un pulsante WhatsApp
    //    con messaggio precompilato; l'agente vede, eventualmente personalizza, e invia lui stesso)
    const propertyUrl = `${appUrl}/admin/properties`
    const priceFormattedForMsg = formatPrice(property.price_eur, property.listing_type)

    const leadsForEmail = leads.map(l => {
      const name = l.full_name?.trim() || 'Senza nome'
      const waNumber = toWhatsAppNumber(l.phone)
      const waUrl = waNumber
        ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
            buildWhatsAppMessage({
              leadName: name,
              propertyTitle: property.title,
              propertyCity: property.city,
              priceFormatted: priceFormattedForMsg,
              propertyUrl,
            })
          )}`
        : null

      return {
        id:     l.id,
        name,
        city:   l.preferred_city,
        budget: l.budget_max_eur
          ? new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(l.budget_max_eur)
          : 'N/D',
        whatsappUrl: waUrl,
      }
    })

    const result = await resend.emails.send({
      from:    EMAIL_FROM,
      to:      ownerUser.email,
      subject: `${leads.length} lead compatibili con "${property.title}" - Habiquo`,
      html:    buildEmailHtml({
        ownerName,
        propertyTitle: property.title,
        propertyCity:  property.city,
        priceEur:      property.price_eur,
        listingType:   property.listing_type,
        rooms:         property.rooms,
        sqm:           property.sqm,
        matchCount:    leads.length,
        leads:         leadsForEmail,
        appUrl,
      }),
    })

    console.log('[match] email result:', JSON.stringify(result))
  } catch (err) {
    console.error('[match] Error:', err)
  }
}
