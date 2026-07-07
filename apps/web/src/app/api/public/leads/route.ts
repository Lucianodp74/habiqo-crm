import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}
import { getAnonClient } from "@/lib/habita/supabase-anon";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agencyId, fullName, email, phone, message, source } = body;

    if (!agencyId || !fullName || fullName.trim().length < 2) {
      return NextResponse.json({ error: "Dati non validi" }, { status: 400, headers: CORS_HEADERS });
    }
    if (!email?.trim() && !phone?.trim()) {
      return NextResponse.json({ error: "Email o telefono obbligatorio" }, { status: 400, headers: CORS_HEADERS });
    }

    const sourceMap: Record<string, { source: string; sourceDetail: string }> = {
      valuation: { source: "website", sourceDetail: "card-valutazione" },
      guide:     { source: "website", sourceDetail: "card-guida" },
      referral:  { source: "referral", sourceDetail: "card-referral" },
      contact:   { source: "website", sourceDetail: "card-contatto" },
    };
    const mapped = sourceMap[source] ?? { source: "website", sourceDetail: "habitami-card" };

    const supabase = getAnonClient();
    const { data, error } = await supabase.rpc("submit_public_lead", {
      p_agency_id: agencyId,
      p_property_id: null,
      p_full_name: fullName.trim(),
      p_email: email?.trim() || null,
      p_phone: phone?.trim() || null,
      p_message: message?.trim() || null,
      p_source: mapped.source,
      p_source_detail: mapped.sourceDetail,
    });

    if (error) {
      console.error("[api/public/leads]", error);
      return NextResponse.json({ error: "Errore server" }, { status: 500, headers: CORS_HEADERS });
    }

    return NextResponse.json({ ok: true, leadId: data }, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("[api/public/leads] unexpected:", err);
    return NextResponse.json({ error: "Errore interno" }, { status: 500, headers: CORS_HEADERS });
  }
}
