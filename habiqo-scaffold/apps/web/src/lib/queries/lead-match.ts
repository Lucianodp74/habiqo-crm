// lib/queries/lead-match.ts
// Destinazione: apps/web/src/lib/queries/lead-match.ts
// Matching semplice lead <-> immobili basato su preferenze

import { createClient } from '@/lib/supabase/server'

// ── Tipi ────────────────────────────────────────────────────────

export type MatchingProperty = {
  id:          string
  title:       string
  city:        string | null
  priceEur:    number | null
  rooms:       number | null
  sqm:         number | null
  listingType: string
  photos:      string[]
}

export type MatchingLead = {
  id:       string
  fullName: string
  email:    string | null
  phone:    string | null
  status:   string
}

// ── Immobili compatibili con un lead ────────────────────────────

export async function getMatchingPropertiesForLead(
  leadId: string
): Promise<MatchingProperty[]> {
  const supabase = await createClient()

  // Recupera le preferenze del lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select(`
      agency_id,
      budget_min_eur,
      budget_max_eur,
      preferred_city,
      preferred_listing_type,
      preferred_rooms_min,
      preferred_sqm_min
    `)
    .eq('id', leadId)
    .single()

  if (leadError || !lead) return []

  // Costruisce la query in modo dinamico
  let query = supabase
    .from('properties')
    .select('id, title, city, price_eur, rooms, sqm, listing_type, photos')
    .eq('agency_id', lead.agency_id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (lead.preferred_city) {
    query = query.ilike('city', lead.preferred_city)
  }
  if (lead.budget_max_eur) {
    query = query.lte('price_eur', lead.budget_max_eur)
  }
  if (lead.budget_min_eur) {
    query = query.gte('price_eur', lead.budget_min_eur)
  }
  if (lead.preferred_listing_type) {
    query = query.eq('listing_type', lead.preferred_listing_type)
  }
  if (lead.preferred_rooms_min) {
    query = query.gte('rooms', lead.preferred_rooms_min)
  }
  if (lead.preferred_sqm_min) {
    query = query.gte('sqm', lead.preferred_sqm_min)
  }

  const { data, error } = await query

  if (error || !data) return []

  return data.map((p) => ({
    id:          p.id,
    title:       p.title,
    city:        p.city,
    priceEur:    p.price_eur ? Number(p.price_eur) : null,
    rooms:       p.rooms,
    sqm:         p.sqm,
    listingType: p.listing_type,
    photos:      (p.photos as string[]) ?? [],
  }))
}

// ── Lead compatibili con un immobile ────────────────────────────

export async function getMatchingLeadsForProperty(
  propertyId: string
): Promise<MatchingLead[]> {
  const supabase = await createClient()

  // Recupera i dati dell'immobile
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('agency_id, city, price_eur, rooms, sqm, listing_type')
    .eq('id', propertyId)
    .single()

  if (propError || !property) return []

  // Trova i lead compatibili
  let query = supabase
    .from('leads')
    .select('id, full_name, email, phone, status')
    .eq('agency_id', property.agency_id)
    .not('status', 'in', '("won","lost")')
    .order('created_at', { ascending: false })
    .limit(10)

  // Match su città
  if (property.city) {
    query = query.or(
      `preferred_city.is.null,preferred_city.ilike.${property.city}`
    )
  }

  // Match su listing_type
  if (property.listing_type) {
    query = query.or(
      `preferred_listing_type.is.null,preferred_listing_type.eq.${property.listing_type}`
    )
  }

  // Match su budget
  if (property.price_eur) {
    const price = Number(property.price_eur)
    query = query
      .or(`budget_max_eur.is.null,budget_max_eur.gte.${price}`)
      .or(`budget_min_eur.is.null,budget_min_eur.lte.${price}`)
  }

  const { data, error } = await query

  if (error || !data) return []

  return data.map((l) => ({
    id:       l.id,
    fullName: l.full_name?.trim() || 'Senza nome',
    email:    l.email,
    phone:    l.phone,
    status:   l.status ?? 'new',
  }))
}
