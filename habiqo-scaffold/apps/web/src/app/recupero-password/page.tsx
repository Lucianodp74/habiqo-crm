import { createClient } from "@/lib/supabase/server";
import { Button } from "@habiqo/ui";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = { title: "Recupero password" };

export default async function PasswordRecoveryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)]">
          Recupero password
        </p>
        <h1 className="font-display text-[36px] leading-tight mt-2">In arrivo</h1>
        <p className="text-[14px] text-[var(--fg-secondary)] mt-2">
          Questa sezione sarà collegata a Supabase reset password. Per ora, torna al login.
        </p>
        <div className="mt-6">
          <Link href="/login">
            <Button intent="primary" size="lg" fullWidth>
              Torna al login
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
