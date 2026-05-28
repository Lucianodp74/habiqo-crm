/**
 * Habiquo Analytics — lead source performance query.
 * Used by the Portal Performance Dashboard.
 */
import { createClient } from "@/lib/supabase/server";

export interface SourceStats {
  source: string;
  sourceDetail: string;
  displayName: string;
  totalLeads: number;
  inNegotiation: number;
  won: number;
  lost: number;
  conversionRate: number; // percentage 0-100
}

/** Maps source + source_detail to a human-readable portal name. */
function getDisplayName(source: string, sourceDetail: string): string {
  if (source === "portal" && sourceDetail === "immobiliare.it") return "Immobiliare.it";
  if (source === "idealista") return "Idealista";
  if (source === "portal" && sourceDetail === "casa.it") return "Casa.it";
  if (source === "portal" && sourceDetail === "idealista.it") return "Idealista";
  if (source === "website") return "Sito web";
  if (source === "facebook") return "Facebook";
  if (source === "whatsapp") return "WhatsApp";
  if (source === "referral") return "Referral";
  if (source === "manual") return "Manuale";
  if (source === "valuation") return "Valutazione";
  return sourceDetail || source;
}

export async function getLeadSourceStats(): Promise<SourceStats[] | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership?.agency_id) return null;

  const { data: leads, error } = await supabase
    .from("leads")
    .select("source, source_detail, status")
    .eq("agency_id", membership.agency_id);

  if (error || !leads) return null;

  // Group by source + source_detail
  const grouped = new Map<string, SourceStats>();

  for (const lead of leads) {
    const src = lead.source ?? "website";
    const detail = lead.source_detail ?? "";
    const key = `${src}::${detail}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        source: src,
        sourceDetail: detail,
        displayName: getDisplayName(src, detail),
        totalLeads: 0,
        inNegotiation: 0,
        won: 0,
        lost: 0,
        conversionRate: 0,
      });
    }

    const stats = grouped.get(key)!;
    stats.totalLeads++;

    const status = lead.status ?? "";
    if (status === "in_negotiation" || status === "negotiation") stats.inNegotiation++;
    if (status === "won") stats.won++;
    if (status === "lost") stats.lost++;
  }

  const result = Array.from(grouped.values()).map((s) => ({
    ...s,
    conversionRate:
      s.totalLeads > 0 ? Math.round((s.won / s.totalLeads) * 100) : 0,
  }));

  return result.sort((a, b) => b.totalLeads - a.totalLeads);
}

export async function getLeadTotals(): Promise<{
  total: number;
  won: number;
  thisMonth: number;
} | null> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership?.agency_id) return null;

  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const { data: leads } = await supabase
    .from("leads")
    .select("status, created_at")
    .eq("agency_id", membership.agency_id);

  if (!leads) return null;

  return {
    total: leads.length,
    won: leads.filter((l) => l.status === "won").length,
    thisMonth: leads.filter(
      (l) => new Date(l.created_at) >= firstOfMonth
    ).length,
  };
}
