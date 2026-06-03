// lib/queries/lead-match.ts
// Matching lead <-> immobili basato su preferenze di ricerca

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
  id:              string
  fullName:        string
  email:           string | null
  phone:           string | null
  whatsapp:        string | null
  status:          string
  lastActivityAt:  string | null
  updatedAt:       string | null
  budgetMinEur:    number | null
  budgetMaxEur:    number | null
  preferredCity:   string | null
}

// ── Immobili compatibili con un lead ────────────────────────────

export async function getMatchingPropertiesForLead(
  leadId: string
): Promise<MatchingProperty[]> {
  const supabase = await createClient()

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

  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('agency_id, city, price_eur, rooms, sqm, listing_type')
    .eq('id', propertyId)
    .single()

  if (propError || !property) return []

  let query = supabase
    .from('leads')
    .select(
      'id, full_name, email, phone, whatsapp, status, last_activity_at, updated_at, budget_min_eur, budget_max_eur, preferred_city'
    )
    .eq('agency_id', property.agency_id)
    .not('status', 'in', '("won","lost")')
    .order('created_at', { ascending: false })
    .limit(10)

  if (property.city) {
    query = query.or(
      `preferred_city.is.null,preferred_city.ilike.${property.city}`
    )
  }

  if (property.listing_type) {
    query = query.or(
      `preferred_listing_type.is.null,preferred_listing_type.eq.${property.listing_type}`
    )
  }

  if (property.price_eur) {
    const price = Number(property.price_eur)
    query = query
      .or(`budget_max_eur.is.null,budget_max_eur.gte.${price}`)
      .or(`budget_min_eur.is.null,budget_min_eur.lte.${price}`)
  }

  const { data, error } = await query

  if (error || !data) return []

  return data.map((l) => ({
    id:             l.id,
    fullName:       l.full_name?.trim() || 'Senza nome',
    email:          l.email,
    phone:          l.phone,
    whatsapp:       l.whatsapp,
    status:         l.status ?? 'new',
    lastActivityAt: l.last_activity_at,
    updatedAt:      l.updated_at,
    budgetMinEur:   l.budget_min_eur ? Number(l.budget_min_eur) : null,
    budgetMaxEur:   l.budget_max_eur ? Number(l.budget_max_eur) : null,
    preferredCity:  l.preferred_city,
  }))
}
