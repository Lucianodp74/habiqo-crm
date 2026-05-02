import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Registrati" };

export default async function RegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Left: editorial brand panel */}
      <aside
        className="hidden lg:flex flex-col justify-between p-12 relative"
        style={{
          background: "linear-gradient(135deg, var(--color-onyx-900) 0%, var(--color-onyx-950) 100%)",
        }}
      >
        <Link href="/" className="font-display text-[22px] text-[var(--color-brass-soft)]">
          HABIQO
        </Link>
        <blockquote className="max-w-md">
          <p className="font-display text-[24px] leading-snug text-[var(--color-surface)] mb-4">
            "Il nostro team usa HABIQO per anticipare le obiezioni e portare più trattative fino al rogito."
          </p>
          <footer className="font-mono text-[11px] tracking-[0.16em] uppercase text-[var(--color-brass-soft)]">
            Luca Conti · Conti Real Estate, Roma
          </footer>
        </blockquote>
        <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-[var(--color-onyx-400)]">
          Smart living. Smart real estate.
        </p>
      </aside>

      {/* Right: form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-[36px] leading-tight mb-2">Crea il tuo account</h1>
          <p className="text-[14px] text-[var(--fg-secondary)] mb-8">
            Attiva la dashboard premium e inizia a gestire lead e immobili con l’AI.
          </p>
          <RegisterForm />
          <p className="text-[12.5px] text-[var(--fg-muted)] mt-6">
            Hai già un account?{" "}
            <Link href="/login" className="text-[var(--accent-deep)] underline">
              Accedi
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

