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

  const { error } = await supabase
    .from("leads")
    .update({
      status,
    })
    .eq("id", leadId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
  });
}
