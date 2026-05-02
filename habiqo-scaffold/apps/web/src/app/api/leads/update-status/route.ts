import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json();

  const { leadId, status } = body;

  const supabase = await createClient();

  const { error } = await supabase
    .from("leads")
    .update({
      status,
    })
    .eq("id", leadId);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
  });
}