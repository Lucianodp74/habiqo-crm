// lib/queries/dashboard.ts
// Query leggere per la dashboard KPI — tutto in parallelo

import { createClient } from '@/lib/supabase/server'

export type DashboardKpis = {
  activeLeads:       number
  publishedProps:    number
  newLeads30d:       number
  rendersCompleted:  number
  appointmentsToday: number
  leadsWithPrefs:    number
}

export type DashboardRecentLead = {
  id:         string
  full_name:  string | null
  status:     string
  source:     string
  created_at: string
  city:       string | null
}

export type DashboardRecentProperty = {
  id:           string
  title:        string
  city:         string | null
  price_eur:    number | null
  listing_type: string
  photos:       string[]
  published_at: string | null
}

export type DashboardAppointment = {
  id:           string
  title:        string
  type:         string
  scheduled_at: string
  leads:        { full_name: string | null } | null
}

export type DashboardLeadChartPoint = {
  date:  string
  count: number
}

export type DashboardData = {
  chartData:     DashboardLeadChartPoint[]
  kpis:          DashboardKpis
  recentLeads:   DashboardRecentLead[]
  recentProps:   DashboardRecentProperty[]
  appointments:  DashboardAppointment[]
  agencyName:    string
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: member } = await supabase
    .from('agency_members')
    .select('agency_id, agencies(name)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!member) return null

  const agencyId = member.agency_id
  const agencyName = (member.agencies as unknown as { name: string } | null)?.name ?? 'La tua agenzia'

  const now       = new Date()
  const today0    = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const today23   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString()
  const ago30d    = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    activeLeadsRes,
    publishedPropsRes,
    newLeads30dRes,
    rendersRes,
    appointmentsTodayRes,
    leadsWithPrefsRes,
    chartLeadsRes,
    recentLeadsRes,
    recentPropsRes,
    appointmentsRes,
  ] = await Promise.all([
    // Lead attivi
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .not('status', 'in', '("won","lost")'),

    // Immobili pubblicati
    supabase
      .from('properties')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('is_public', true),

    // Nuovi lead ultimi 30gg
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .gte('created_at', ago30d),

    // Render AI completati
    supabase
      .from('renovation_previews')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .eq('status', 'completed'),

    // Appuntamenti oggi
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .gte('scheduled_at', today0)
      .lte('scheduled_at', today23),

    // Lead con preferenze compilate
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('agency_id', agencyId)
      .not('preferred_city', 'is', null),

    // Lead per grafico (ultimi 30gg)
    supabase
      .from('leads')
      .select('created_at')
      .eq('agency_id', agencyId)
      .gte('created_at', ago30d)
      .order('created_at', { ascending: true }),

    // Ultimi 5 lead
    supabase
      .from('leads')
      .select('id, full_name, status, source, created_at, preferred_city')
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .limit(5),

    // Ultimi 5 immobili pubblicati
    supabase
      .from('properties')
      .select('id, title, city, price_eur, listing_type, photos, published_at')
      .eq('agency_id', agencyId)
      .eq('is_public', true)
      .order('published_at', { ascending: false })
      .limit(5),

    // Prossimi appuntamenti
    supabase
      .from('appointments')
      .select('id, title, type, scheduled_at, leads(full_name)')
      .eq('agency_id', agencyId)
      .gte('scheduled_at', today0)
      .order('scheduled_at', { ascending: true })
      .limit(5),
  ])

  // Genera chart data: conta lead per giorno
  const chartMap: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const key = d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
    chartMap[key] = 0
  }
  for (const lead of (chartLeadsRes.data ?? [])) {
    const d = new Date(lead.created_at ?? '')
    const key = d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })
    if (key in chartMap) if (typeof chartMap[key] === "number") chartMap[key]++
  }
  const chartData = Object.entries(chartMap).map(([date, count]) => ({ date, count }))

  return {
    kpis: {
      activeLeads:       activeLeadsRes.count      ?? 0,
      publishedProps:    publishedPropsRes.count   ?? 0,
      newLeads30d:       newLeads30dRes.count       ?? 0,
      rendersCompleted:  rendersRes.count           ?? 0,
      appointmentsToday: appointmentsTodayRes.count ?? 0,
      leadsWithPrefs:    leadsWithPrefsRes.count    ?? 0,
    },
    chartData,
    recentLeads:  (recentLeadsRes.data ?? []).map(l => ({
      id:         l.id,
      full_name:  l.full_name,
      status:     l.status ?? 'new',
      source:     l.source ?? 'manual',
      created_at: l.created_at ?? '',
      city:       l.preferred_city,
    })),
    recentProps:  (recentPropsRes.data ?? []).map(p => ({
      id:           p.id,
      title:        p.title,
      city:         p.city,
      price_eur:    p.price_eur ? Number(p.price_eur) : null,
      listing_type: p.listing_type,
      photos:       (p.photos as string[]) ?? [],
      published_at: p.published_at,
    })),
    appointments: (appointmentsRes.data ?? []) as unknown as DashboardAppointment[],
    agencyName,
  }
}







