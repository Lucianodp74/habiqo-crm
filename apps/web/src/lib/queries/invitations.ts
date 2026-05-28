import { createClient } from "@/lib/supabase/server";

export type InvitationData = {
  id: string;
  email: string;
  role: "agent" | "owner";
  token: string;
  agency_id: string;
  agency_name: string;
  expires_at: string;
};

export async function getInvitationByToken(
  token: string
): Promise<InvitationData | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("agency_invitations")
    .select(
      "id, email, role, token, agency_id, status, expires_at, agencies ( name )"
    )
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    email: data.email,
    role: data.role as "agent" | "owner",
    token: data.token,
    agency_id: data.agency_id,
    agency_name: (data.agencies as unknown as { name: string } | null)?.name ?? "Agenzia",
    expires_at: data.expires_at,
  };
}
