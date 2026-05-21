import { AppShell } from "@/components/shared/app-shell";
import { Sidebar } from "@/components/shared/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profileResult, membershipResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .single(),
    supabase
      .from("agency_members")
      .select("agencies(slug)")
      .eq("user_id", user.id)
      .limit(1)
      .single(),
  ]);

  const profile = profileResult.data;
  const agencySlug =
    (membershipResult.data?.agencies as { slug: string } | null)?.slug ?? null;

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
