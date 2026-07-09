import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return NextResponse.json([]);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json([], { status: 401 });

    const { data: membership } = await supabase
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (!membership) return NextResponse.json([]);

    const { data } = await supabase
      .from("leads")
      .select("id, full_name, phone")
      .eq("agency_id", membership.agency_id)
      .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`)
      .limit(8);

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[api/leads/search]", err);
    return NextResponse.json([]);
  }
}