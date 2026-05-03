import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("leads")
      .insert([
        {
          agency_id: "00000000-0000-0000-0000-000000000001",
          full_name: body.full_name,
          email: body.email,
          phone: body.phone,
          budget_min: body.budget_min,
          budget_max: body.budget_max,
          preferred_city: body.preferred_city,
          source: body.source,
          status: body.status || "new",
          notes: body.notes,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
