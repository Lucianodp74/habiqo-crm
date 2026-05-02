import { createClient } from "@/lib/supabase/server";

export async function listLeadsForAgency() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("SUPABASE ERROR:", error.message);
    return [];
  }

  return (data || []).map((lead) => ({
    id: lead.id,

    fullName: lead.full_name || "Senza nome",

    status: lead.status || "new",

    temperature: lead.temperature || "warm",

    aiScore: lead.ai_score || null,

    lastActivityAt: lead.created_at || null,
  }));
}