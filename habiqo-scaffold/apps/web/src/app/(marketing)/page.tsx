import Link from "next/link";
import { Button } from "@habiqo/ui";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-12 lg:px-12">
      <header className="flex items-center justify-between mb-24">
        <span className="font-display text-[20px]">HABIQO</span>
        <nav className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors"
          >
            Accedi
          </Link>
          <Link href="/register">
            <Button intent="primary" size="md">
              Inizia gratis
            </Button>
          </Link>
        </nav>
      </header>

      <section className="max-w-3xl">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)] mb-6">
          Per agenzie immobiliari italiane
        </p>
        <h1 className="font-display text-[64px] leading-[1.02] mb-6">
          L'intelligenza che <span className="italic text-[var(--accent-deep)]">chiude</span>{" "}
          la vendita.
        </h1>
        <p className="text-[17px] leading-relaxed text-[var(--fg-secondary)] max-w-xl mb-10">
          CRM, valutazione AI istantanea, voice AI in italiano e generazione contenuti.
          Un solo prodotto al posto di cinque. Conforme GDPR by design.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/register">
            <Button intent="primary" size="lg">
              Prova HABIQO gratis
            </Button>
          </Link>
          <Link href="/valutazione">
            <Button intent="secondary" size="lg">
              Valuta il tuo immobile
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
