import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (q.length < 2) {
      return NextResponse.json([]);
    }

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
      .from("properties")
      .select("id, title, city, internal_code, photos, listing_type, price_eur")
      .eq("agency_id", membership.agency_id)
      .or(`title.ilike.%${q}%,city.ilike.%${q}%,internal_code.ilike.%${q}%`)
      .limit(8);

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[api/properties/search]", err);
    return NextResponse.json([]);
  }
}
