/**
 * HABIQUO · lib/queries/opportunita.ts
 *
 * Query parallele per "Opportunità del Giorno".
 * Nessuna migration. Nessuna dipendenza esterna.
 * Tutto server-side, tutto in parallelo.
 */

import { computeStaleness } from "@/lib/funnel/staleness";
import { createClient } from "@/lib/supabase/server";

// ─── Types ────────────────────────────────────────────────────────

export type LeadUrgente = {
  id: string;
  fullName: string;
  status: string;
  phone: string | null;
  whatsapp: string | null;
  lastActivityAt: string | null;
  updatedAt: string | null;
  daysSince: number;
};

export type AppuntamentoDaConfermare = {
  id: string;
  title: string;
  scheduledAt: string;
  leadName: string | null;
  leadId: string | null;
};

export type ImmobileDaProporre = {
  propertyId: string;
  propertyTitle: string;
  propertyCity: string | null;
  matchCount: number;
  topLeadId: string | null;
  topLeadName: string | null;
  topLeadPhone: string | null;
  topLeadWhatsapp: string | null;
  topLeadStatus: string | null;
};

export type OpportunitaData = {
  leadUrgenti: LeadUrgente[];
  appuntamentiDaConfermare: AppuntamentoDaConfermare[];
  immobiliDaProporre: ImmobileDaProporre[];
};

// ─── Main query ───────────────────────────────────────────────────

export async function getOpportunitaDelGiorno(): Promise<OpportunitaData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Resolve agency — priorità owner
  const { data: memberships } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id);

  if (!memberships?.length) return null;

  const roleOrder = ["owner", "admin", "agent", "viewer"];
  const sorted = [...memberships].sort(
    (a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role),
  );
  const agencyId = sorted[0]?.agency_id;
  if (!agencyId) return null;

  const now = new Date();
  const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // 3 query in parallelo
  const [leadsRes, appuntamentiRes, matchesRes] = await Promise.all([
    // Lead attivi con dati per calcolo staleness
    supabase
      .from("leads")
      .select("id, full_name, status, phone, whatsapp, last_activity_at, updated_at")
      .eq("agency_id", agencyId)
      .not("status", "in", '("won","lost")')
      .order("last_activity_at", { ascending: true, nullsFirst: true })
      .limit(30),

    // Appuntamenti nelle prossime 24 ore
    supabase
      .from("appointments")
      .select("id, title, scheduled_at, leads(id, full_name)")
      .eq("agency_id", agencyId)
      .gte("scheduled_at", now.toISOString())
      .lte("scheduled_at", next24h)
      .order("scheduled_at", { ascending: true })
      .limit(5),

    // Immobili pubblicati negli ultimi 7 giorni con property_matches
    supabase
      .from("property_matches")
      .select(
        "property_id, lead_id, similarity, properties(id, title, city), leads(id, full_name, phone, whatsapp, status)",
      )
      .eq("agency_id", agencyId)
      .gte("computed_at", ago7d)
      .order("similarity", { ascending: false })
      .limit(20),
  ]);

  // ── Lead urgenti ─────────────────────────────────────────────────
  const leadUrgenti: LeadUrgente[] = (leadsRes.data ?? [])
    .map((row) => {
      const s = computeStaleness(
        row.status ?? "new",
        row.last_activity_at,
        row.updated_at,
        null,
      );
      return {
        id: row.id,
        fullName: row.full_name?.trim() || "Senza nome",
        status: row.status ?? "new",
        phone: row.phone,
        whatsapp: row.whatsapp,
        lastActivityAt: row.last_activity_at,
        updatedAt: row.updated_at,
        daysSince: s.daysSinceActivity,
        isStale: s.isStale,
        level: s.level,
      };
    })
    .filter((l) => l.isStale && (l.level === "stale" || l.level === "critical"))
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 4)
    .map(({ isStale: _is, level: _lv, ...rest }) => rest);

  // ── Appuntamenti da confermare ───────────────────────────────────
  const appuntamentiDaConfermare: AppuntamentoDaConfermare[] = (
    appuntamentiRes.data ?? []
  ).map((apt) => {
    const lead = apt.leads as unknown as { id: string; full_name: string | null } | { id: string; full_name: string | null }[] | null;
    const leadObj = Array.isArray(lead) ? lead[0] ?? null : lead;
    return {
      id: apt.id,
      title: apt.title,
      scheduledAt: apt.scheduled_at,
      leadName: leadObj?.full_name ?? null,
      leadId: leadObj?.id ?? null,
    };
  });

  // ── Immobili da proporre ─────────────────────────────────────────
  // Raggruppa per property_id, prendi il lead con similarity più alta
  const propMap = new Map<
    string,
    {
      propertyId: string;
      propertyTitle: string;
      propertyCity: string | null;
      matchCount: number;
      topSimilarity: number;
      topLeadId: string | null;
      topLeadName: string | null;
      topLeadPhone: string | null;
      topLeadWhatsapp: string | null;
      topLeadStatus: string | null;
    }
  >();

  for (const row of matchesRes.data ?? []) {
    const prop = (row.properties as unknown as { id: string; title: string; city: string | null } | { id: string; title: string; city: string | null }[] | null);
    const propObj = Array.isArray(prop) ? prop[0] ?? null : prop;
    const leadRaw = row.leads as unknown as {
      id: string;
      full_name: string | null;
      phone: string | null;
      whatsapp: string | null;
      status: string | null;
    } | {
      id: string;
      full_name: string | null;
      phone: string | null;
      whatsapp: string | null;
      status: string | null;
    }[] | null;
    const lead = Array.isArray(leadRaw) ? leadRaw[0] ?? null : leadRaw;
    if (!propObj || !lead) continue;

    const existing = propMap.get(propObj.id);
    if (!existing) {
      propMap.set(propObj.id, {
        propertyId: propObj.id,
        propertyTitle: propObj.title,
        propertyCity: propObj.city,
        matchCount: 1,
        topSimilarity: row.similarity ?? 0,
        topLeadId: lead.id,
        topLeadName: lead.full_name,
        topLeadPhone: lead.phone,
        topLeadWhatsapp: lead.whatsapp,
        topLeadStatus: lead.status,
      });
    } else {
      existing.matchCount++;
      if ((row.similarity ?? 0) > existing.topSimilarity) {
        existing.topSimilarity = row.similarity ?? 0;
        existing.topLeadId = lead.id;
        existing.topLeadName = lead.full_name;
        existing.topLeadPhone = lead.phone;
        existing.topLeadWhatsapp = lead.whatsapp;
        existing.topLeadStatus = lead.status;
      }
    }
  }

  const immobiliDaProporre: ImmobileDaProporre[] = Array.from(propMap.values())
    .sort((a, b) => b.matchCount - a.matchCount)
    .slice(0, 3)
    .map(({ topSimilarity: _, ...rest }) => rest);

  return { leadUrgenti, appuntamentiDaConfermare, immobiliDaProporre };
}
