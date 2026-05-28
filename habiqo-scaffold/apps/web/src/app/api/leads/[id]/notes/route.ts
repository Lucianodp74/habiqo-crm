import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: Request, context: RouteContext) {
  const { id: leadId } = await context.params;
  const body = await req.json();
  const text = typeof body?.text === "string" ? body.text.trim() : "";

  if (!text || text.length > 8000) {
    return NextResponse.json({ error: "Nota non valida" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { data: lead, error: leadErr } = await supabase
    .from("leads")
    .select("agency_id")
    .eq("id", leadId)
    .single();

  if (leadErr || !lead) {
    return NextResponse.json({ error: "Lead non trovato" }, { status: 404 });
  }

  const { error } = await supabase.from("lead_events").insert({
    lead_id: leadId,
    agency_id: lead.agency_id,
    type: "note",
    title: "Nota",
    detail: text,
    actor_id: user.id,
    occurred_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
