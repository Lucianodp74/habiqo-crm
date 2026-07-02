import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const { data: membership, error: memberError } = await supabase
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin", "agent"])
      .limit(1)
      .single();

    if (memberError || !membership) {
      return NextResponse.json({ error: "Nessuna agenzia trovata" }, { status: 403 });
    }

    const parseBudget = (v: unknown): number | null => {
      if (v == null || v === "") return null;
      const n = parseInt(String(v), 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          agency_id:      membership.agency_id,
          full_name:      body.full_name,
          email:          body.email ?? null,
          phone:          body.phone ?? null,
          budget_min_eur: parseBudget(body.budget_min),
          budget_max_eur: parseBudget(body.budget_max),
          preferred_city: body.preferred_city ?? null,
          source:         body.source,
          status:         body.status || "new",
          notes:          body.notes ?? null,
          assigned_to:    body.assigned_to ?? null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[api/leads POST]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/leads POST] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}