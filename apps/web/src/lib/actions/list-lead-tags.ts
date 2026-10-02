"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Distinct tags currently in use across the agency's leads, for the
 * campaign audience builder's tag picker. `leads.tags` is a free-text
 * array (no tag catalog table exists), so this is computed from live
 * data rather than a lookup table.
 */
export async function listLeadTagsForAgency(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id);

  const agencyIds = (memberships ?? []).map((m) => m.agency_id);
  if (agencyIds.length === 0) return [];

  const { data: leads } = await supabase
    .from("leads")
    .select("tags")
    .in("agency_id", agencyIds)
    .not("tags", "is", null);

  const tagSet = new Set<string>();
  for (const row of leads ?? []) {
    for (const tag of (row.tags as string[] | null) ?? []) {
      const trimmed = tag.trim();
      if (trimmed) tagSet.add(trimmed);
    }
  }

  return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "it"));
}
