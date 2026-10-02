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

    // La nota iniziale viene salvata anche in `leads.notes`, ma quel campo
    // non viene mai letto/mostrato nella scheda lead: l'unico posto in cui
    // le note sono visibili è la timeline attività (lead_events, type
    // "note"), alimentata dal box "Aggiungi nota". Senza questo inserimento
    // la nota scritta in creazione risultava salvata ma invisibile.
    const initialNote = typeof body.notes === "string" ? body.notes.trim() : "";
    if (initialNote) {
      const { error: noteError } = await supabase.from("lead_events").insert({
        lead_id: data.id,
        agency_id: membership.agency_id,
        type: "note",
        title: "Nota",
        detail: initialNote,
        actor_id: user.id,
        occurred_at: new Date().toISOString(),
      });
      if (noteError) {
        // Il lead è comunque creato correttamente: logghiamo soltanto,
        // senza far fallire la risposta per un problema sulla nota.
        console.error("[api/leads POST] initial note insert failed", noteError);
      }
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/leads POST] unexpected:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}