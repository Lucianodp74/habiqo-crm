import { Sidebar } from "@/components/shared/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/dashboard");

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
      <main className="flex-1 min-w-0 bg-[var(--bg-canvas)]">{children}</main>
    </div>
  );
}
