import { newLeadFormSchema } from "@/lib/crm/new-lead-schema";
import { type PipelineColumnId, columnIdToDbStatus } from "@/lib/crm/pipeline";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = newLeadFormSchema.safeParse(json);

  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors;
    const msg =
      Object.entries(first)
        .map(([k, v]) => (v?.[0] ? `${k}: ${v[0]}` : null))
        .filter(Boolean)
        .join("; ") || "Dati non validi";
    return NextResponse.json({ error: msg, issues: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { data: membership, error: memErr } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (memErr || !membership?.agency_id) {
    return NextResponse.json({ error: "Nessuna agenzia associata al profilo" }, { status: 403 });
  }

  const agencyId = membership.agency_id;
  const status = columnIdToDbStatus(data.status as PipelineColumnId);
  const city = data.preferred_city?.trim() || null;
  const zones = city ? [city] : [];

  const row: Record<string, unknown> = {
    agency_id: agencyId,
    full_name: data.full_name.trim(),
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    budget_min_eur: data.budget_min ?? null,
    budget_max_eur: data.budget_max ?? null,
    preferred_zones: zones,
    source: data.source,
    status,
    notes: data.notes?.trim() || null,
    temperature: "cold",
    source_detail: null,
  };

  if (city) {
    row.preferred_city = city;
  }

  const { data: inserted, error } = await supabase.from("leads").insert(row).select("id").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: inserted?.id });
}
