import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json([], { status: 401 });

  const { data: myMembership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .single();

  if (!myMembership) return NextResponse.json([]);

  const { data: members } = await supabase
    .from("agency_members")
    .select("user_id, profiles(full_name)")
    .eq("agency_id", myMembership.agency_id);

  const result = (members ?? []).map((m) => ({
    user_id: m.user_id,
    full_name: (m.profiles as { full_name: string | null } | null)?.full_name ?? null,
  }));

  return NextResponse.json(result);
}