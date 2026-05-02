import { createClient } from "@/lib/supabase/server";

export type AgencyAgentOption = {
  id: string;
  name: string;
};

export async function listAgentsForAgency(): Promise<AgencyAgentOption[]> {
  const supabase = await createClient();

  const { data: members, error } = await supabase.from("agency_members").select("user_id");

  if (error || !members?.length) {
    if (error) console.error("agency_members:", error.message);
    return [];
  }

  const ids = members.map((m) => m.user_id);
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);

  if (pErr) {
    console.error("profiles:", pErr.message);
    return [];
  }

  return (profiles ?? []).map((p) => ({
    id: p.id,
    name: p.full_name?.trim() || "Agente",
  }));
}
