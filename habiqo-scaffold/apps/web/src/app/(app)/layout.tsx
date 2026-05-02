import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/shared/sidebar";

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
    <div className="min-h-screen flex">
      <Sidebar
        userName={profile?.full_name ?? user.email ?? ""}
        avatarUrl={profile?.avatar_url ?? null}
      />
      <main className="flex-1 min-w-0 bg-[var(--bg-canvas)]">
        {children}
      </main>
    </div>
  );
}
