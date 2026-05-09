import { createClient } from "@/lib/supabase/server";

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

export type TeamMember = {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  role: "owner" | "agent";
  joinedAt: string;
};

export type PendingInvitation = {
  id: string;
  email: string;
  role: "owner" | "agent";
  token: string;
  inviteUrl: string;
  expiresAt: string;
  createdAt: string;
};

export type TeamData = {
  agencyId: string;
  isOwner: boolean;
  members: TeamMember[];
  pendingInvitations: PendingInvitation[];
};

// ────────────────────────────────────────────────────────────────
// Helper: build invite URL
// ────────────────────────────────────────────────────────────────

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be set in production environments",
    );
  }
  return "http://localhost:3000";
}

// ────────────────────────────────────────────────────────────────
// Main query: load all team data for the current owner's agency.
// Returns null if the user is not authenticated or not an owner.
// The page is responsible for redirecting in that case.
// ────────────────────────────────────────────────────────────────

export async function getTeamData(): Promise<TeamData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Find the agency where the current user is owner
  const { data: ownerMembership, error: ownerError } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (ownerError) {
    console.error("getTeamData owner check:", ownerError.message);
    return null;
  }

  if (!ownerMembership) return null;

  const agencyId = ownerMembership.agency_id;

  // Load members of this agency. We do two queries (members + profiles)
  // to mirror the pattern used in agency-members.ts. RLS already scopes
  // visibility to the user's agency.
  const { data: rawMembers, error: membersError } = await supabase
    .from("agency_members")
    .select("user_id, role, joined_at")
    .eq("agency_id", agencyId)
    .order("joined_at", { ascending: true });

  if (membersError) {
    console.error("getTeamData members:", membersError.message);
    return null;
  }

  const memberIds = (rawMembers ?? []).map((m) => m.user_id);

  let profilesById: Record<
    string,
    { full_name: string | null; avatar_url: string | null }
  > = {};

  if (memberIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", memberIds);

    if (profilesError) {
      console.error("getTeamData profiles:", profilesError.message);
    } else if (profiles) {
      profilesById = Object.fromEntries(
        profiles.map((p) => [
          p.id,
          { full_name: p.full_name, avatar_url: p.avatar_url },
        ]),
      );
    }
  }

  const members: TeamMember[] = (rawMembers ?? []).map((m) => {
    const profile = profilesById[m.user_id];
    return {
      userId: m.user_id,
      fullName: profile?.full_name?.trim() || "Membro senza nome",
      avatarUrl: profile?.avatar_url ?? null,
      role: m.role,
      joinedAt: m.joined_at,
    };
  });

  // Load pending invitations
  const { data: rawInvites, error: invitesError } = await supabase
    .from("agency_invitations")
    .select("id, email, role, token, expires_at, created_at")
    .eq("agency_id", agencyId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (invitesError) {
    console.error("getTeamData invites:", invitesError.message);
  }

  const baseUrl = getAppUrl();
  const pendingInvitations: PendingInvitation[] = (rawInvites ?? []).map(
    (inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      token: inv.token,
      inviteUrl: `${baseUrl}/accept-invite?token=${inv.token}`,
      expiresAt: inv.expires_at,
      createdAt: inv.created_at,
    }),
  );

  return {
    agencyId,
    isOwner: true,
    members,
    pendingInvitations,
  };
}
