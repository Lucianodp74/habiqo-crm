import { AppShell } from "@/components/shared/app-shell";
import { Sidebar } from "@/components/shared/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  // Fetch agency slug for the public site link in sidebar
  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  let agencySlug: string | null = null;
  if (membership?.agency_id) {
    const { data: agency } = await supabase
      .from("agencies")
      .select("slug")
      .eq("id", membership.agency_id)
      .single();
    agencySlug = agency?.slug ?? null;
  }

  return (
    <AppShell
      sidebar={
        <Sidebar
          userName={profile?.full_name ?? user.email ?? ""}
          avatarUrl={profile?.avatar_url ?? null}
          agencySlug={agencySlug}
        />
      }
    >
      {children}
    </AppShell>
  );
}
