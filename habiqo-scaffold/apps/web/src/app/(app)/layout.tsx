import { AppShell } from "@/components/shared/app-shell";
import { Sidebar } from "@/components/shared/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth: middleware redirects, but if it fails we don't render the app.
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <AppShell
      sidebar={
        <Sidebar
          userName={profile?.full_name ?? user.email ?? ""}
          avatarUrl={profile?.avatar_url ?? null}
        />
      }
    >
      {children}
    </AppShell>
  );
}
