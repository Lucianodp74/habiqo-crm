import { columnIdToDbStatus, isPipelineColumnId } from "@/lib/crm/pipeline";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Accepts Kanban column ids and legacy DB value `in_negotiation`. */
function normalizeIncomingStatus(raw: string): string | null {
  if (raw === "in_negotiation") return "in_negotiation";
  if (isPipelineColumnId(raw)) return columnIdToDbStatus(raw);
  return null;
}

export async function POST(req: Request) {
  const body = await req.json();

  const { leadId, status: rawStatus } = body;

  if (typeof leadId !== "string" || typeof rawStatus !== "string") {
    return NextResponse.json({ error: "leadId e status richiesti" }, { status: 400 });
  }

  const status = normalizeIncomingStatus(rawStatus);
  if (!status) {
    return NextResponse.json({ error: "Stato non valido" }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: leadRow } = await supabase
    .from("leads")
    .select("agency_id, status")
    .eq("id", leadId)
    .single();

  if (!leadRow) {
    return NextResponse.json({ error: "Lead non trovato" }, { status: 404 });
  }

  const previousStatus = leadRow.status;

  const { error } = await supabase
    .from("leads")
    .update({
      status,
    })
    .eq("id", leadId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (previousStatus !== status) {
    await supabase.from("lead_events").insert({
      lead_id: leadId,
      agency_id: leadRow.agency_id,
      type: "status_change",
      title: "Stato aggiornato",
      detail: `${previousStatus} → ${status}`,
      actor_id: user?.id ?? null,
      occurred_at: new Date().toISOString(),
    });
  }

  return NextResponse.json({
    success: true,
  });
}
