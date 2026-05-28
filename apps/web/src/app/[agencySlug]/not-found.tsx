import Link from "next/link";

export default function HabitaAgencyNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--bg-canvas)]">
      <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
        404
      </p>
      <h1 className="font-display text-3xl mb-4 text-[var(--fg-primary)]">
        Agenzia non trovata
      </h1>
      <p className="text-[var(--fg-secondary)] mb-8 max-w-md text-center">
        Non esiste un'agenzia pubblica con questo URL, oppure è temporaneamente
        non disponibile.
      </p>
      <Link
        href="/"
        className="text-sm text-[var(--accent-deep)] underline underline-offset-4 hover:opacity-80"
      >
        Torna alla home
      </Link>
    </div>
  );
}
