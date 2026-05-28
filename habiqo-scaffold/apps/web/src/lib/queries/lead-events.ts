import { createClient } from "@/lib/supabase/server";

export type LeadTimelineEvent = {
  id: string;
  type: string;
  title: string;
  detail: string | null;
  occurredAt: string;
  actorName: string | null;
};

export async function listLeadEventsForLead(leadId: string): Promise<LeadTimelineEvent[]> {
  const supabase = await createClient();

  const { data: events, error } = await supabase
    .from("lead_events")
    .select("id, type, title, detail, occurred_at, actor_id")
    .eq("lead_id", leadId)
    .order("occurred_at", { ascending: false });

  if (error || !events?.length) {
    if (error) console.error("lead_events:", error.message);
    return [];
  }

  const actorIds = [...new Set(events.map((e) => e.actor_id).filter(Boolean))] as string[];

  const { data: profiles } = actorIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] as { id: string; full_name: string | null }[] };

  const nameById = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name?.trim() ?? null]),
  );

  return events.map((e) => ({
    id: e.id,
    type: e.type,
    title: e.title,
    detail: e.detail,
    occurredAt: e.occurred_at,
    actorName: e.actor_id ? (nameById[e.actor_id] ?? null) : null,
  }));
}
