import { columnIdToDbStatus, isPipelineColumnId } from "@/lib/crm/pipeline";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function normalizeIncomingStatus(raw: string): string | null {
  if (raw === "in_negotiation") return "in_negotiation";
  if (isPipelineColumnId(raw)) return columnIdToDbStatus(raw);
  return null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leadId = body?.leadId;
    const rawStatus = body?.status;

    if (typeof leadId !== "string")
      return NextResponse.json({ error: "leadId richiesto" }, { status: 400 });
    if (typeof rawStatus !== "string")
      return NextResponse.json({ error: "status richiesto" }, { status: 400 });
    if (!isUuid(leadId))
      return NextResponse.json({ error: "Identificativo lead non valido" }, { status: 400 });

    const status = normalizeIncomingStatus(rawStatus);
    if (!status)
      return NextResponse.json({ error: "Stato non valido" }, { status: 400 });

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });

    // Passa p_user_id esplicitamente — auth.uid() è NULL nei contesti SECURITY DEFINER
    const { error } = await supabase.rpc("update_lead_status_with_event", {
      p_lead_id: leadId,
      p_new_status: status,
      p_user_id: user.id,
    });

    if (error) {
      console.error("[update-status]", error);
      return NextResponse.json(
        { error: error.message || "Accesso negato" },
        { status: 403 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[update-status] unexpected:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
