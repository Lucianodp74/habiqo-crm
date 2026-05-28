// lib/email/send-match-notification.ts
// Invia email agli agenti quando un nuovo immobile matcha i loro lead

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { resend, EMAIL_FROM } from './resend-client'

const LISTING_LABEL: Record<string, string> = {
  sale: 'Vendita',
  rent: 'Affitto',
}

function formatPrice(price: number | null, type: string): string {
  if (!price) return 'N/D'
  const formatted = new Intl.NumberFormat('it-IT', {
    style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
  }).format(price)
  return type === 'rent' ? formatted + '/mese' : formatted
}

function buildEmailHtml(opts: {
  agentName:    string
  propertyTitle: string
  propertyCity:  string | null
  priceEur:     number | null
  listingType:  string
  rooms:        number | null
  sqm:          number | null
  leadName:     string
  propertyUrl:  string
}): string {
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Nuovo immobile compatibile</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f0;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:#1a1a18;padding:24px 32px;">
              <p style="margin:0;color:#a67c52;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;">
                HABIQUO CRM
              </p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">
                🏠 Nuovo immobile compatibile
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px;color:#44403c;font-size:15px;line-height:1.6;">
                Ciao <strong>${opts.agentName}</strong>,<br/>
                è stato pubblicato un nuovo immobile compatibile con il lead <strong>${opts.leadName}</strong>.
              </p>

              <!-- Property card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f8f6;border-radius:12px;border:1px solid #e8e5df;margin-bottom:24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 4px;color:#a67c52;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;font-weight:600;">
                      Immobile
                    </p>
                    <h2 style="margin:0 0 16px;color:#1a1a18;font-size:18px;font-weight:700;">
                      ${opts.propertyTitle}
                    </h2>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:24px;padding-bottom:8px;">
                          <p style="margin:0;color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Città</p>
                          <p style="margin:4px 0 0;color:#1a1a18;font-size:14px;font-weight:600;">${opts.propertyCity ?? 'N/D'}</p>
                        </td>
                        <td style="padding-right:24px;padding-bottom:8px;">
                          <p style="margin:0;color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Prezzo</p>
                          <p style="margin:4px 0 0;color:#1a1a18;font-size:14px;font-weight:600;">${formatPrice(opts.priceEur, opts.listingType)}</p>
                        </td>
                        <td style="padding-right:24px;padding-bottom:8px;">
                          <p style="margin:0;color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Tipo</p>
                          <p style="margin:4px 0 0;color:#1a1a18;font-size:14px;font-weight:600;">${LISTING_LABEL[opts.listingType] ?? opts.listingType}</p>
                        </td>
                        ${opts.rooms ? `
                        <td style="padding-bottom:8px;">
                          <p style="margin:0;color:#78716c;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Camere</p>
                          <p style="margin:4px 0 0;color:#1a1a18;font-size:14px;font-weight:600;">${opts.rooms} cam · ${opts.sqm ?? '?'} mq</p>
                        </td>` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px;background:#1a1a18;">
                    <a href="${opts.propertyUrl}"
                       style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.02em;">
                      Vedi il lead nel CRM →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #f0ede8;">
              <p style="margin:0;color:#a8a29e;font-size:11px;line-height:1.6;">
                Questa notifica è stata inviata automaticamente da <strong>Habiquo CRM</strong>.<br/>
                Smart living. Smart real estate.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export async function sendMatchNotificationForProperty(
  propertyId: string,
  agencyId:   string,
  appUrl:     string,
): Promise<void> {
  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // Recupera i dati dell'immobile
    const { data: property } = await supabaseAdmin
      .from('properties')
      .select('id, title, city, price_eur, rooms, sqm, listing_type')
      .eq('id', propertyId)
      .single()

    if (!property) return

    // Trova lead compatibili con le loro info
    let query = supabaseAdmin
      .from('leads')
      .select('id, full_name, assigned_to, agency_id, budget_min_eur, budget_max_eur, preferred_city, preferred_listing_type, preferred_rooms_min, preferred_sqm_min')
      .eq('agency_id', agencyId)
      .not('status', 'in', '("won","lost")')

    if (property.city)          query = query.or(`preferred_city.is.null,preferred_city.ilike.${property.city}`)
    if (property.listing_type)  query = query.or(`preferred_listing_type.is.null,preferred_listing_type.eq.${property.listing_type}`)
    if (property.price_eur) {
      const price = Number(property.price_eur)
      query = query
        .or(`budget_max_eur.is.null,budget_max_eur.gte.${price}`)
        .or(`budget_min_eur.is.null,budget_min_eur.lte.${price}`)
    }

    const { data: matchingLeads } = await query

    if (!matchingLeads || matchingLeads.length === 0) return

    // Per ogni lead, ottieni l'email dell'agente assegnato (o owner agenzia)
    const agentIds = [...new Set(
      matchingLeads
        .map(l => l.assigned_to)
        .filter(Boolean) as string[]
    )]

    // Se nessun lead ha un agente assegnato, notifica l'owner dell'agenzia
    if (agentIds.length === 0) {
      const { data: owner } = await supabaseAdmin
        .from('agency_members')
        .select('user_id')
        .eq('agency_id', agencyId)
        .eq('role', 'owner')
        .limit(1)
        .maybeSingle()

      if (owner) agentIds.push(owner.user_id)
    }

    if (agentIds.length === 0) return

    // Ottieni email e nome degli agenti
    const agentEmails: Record<string, { email: string; name: string }> = {}

    for (const userId of agentIds) {
      try {
        const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (user?.email) {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('full_name')
            .eq('id', userId)
            .maybeSingle()

          agentEmails[userId] = {
            email: user.email,
            name:  profile?.full_name?.trim() || user.email,
          }
        }
      } catch (_e) {
        // skip
      }
    }

    // Invia email per ogni coppia lead-agente
    const sent = new Set<string>()

    for (const lead of matchingLeads) {
      const agentId = lead.assigned_to
      if (!agentId) continue

      const agent = agentEmails[agentId]
      if (!agent) continue

      const key = `${agentId}:${propertyId}`
      if (sent.has(key)) continue
      sent.add(key)

      const leadUrl = `${appUrl}/crm/leads/${lead.id}`

      await resend.emails.send({
        from:    EMAIL_FROM,
        to:      agent.email,
        subject: `🏠 Nuovo immobile compatibile con ${lead.full_name ?? 'un lead'} - Habiquo`,
        html:    buildEmailHtml({
          agentName:     agent.name,
          propertyTitle: property.title,
          propertyCity:  property.city,
          priceEur:      property.price_eur ? Number(property.price_eur) : null,
          listingType:   property.listing_type,
          rooms:         property.rooms,
          sqm:           property.sqm,
          leadName:      lead.full_name ?? 'Lead senza nome',
          propertyUrl:   leadUrl,
        }),
      })
    }

    console.log(`[match-notification] Sent ${sent.size} emails for property ${propertyId}`)
  } catch (err) {
    console.error('[match-notification] Error:', err)
    // Non bloccare il flusso principale
  }
}
