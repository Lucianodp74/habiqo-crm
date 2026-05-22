import Link from "next/link";
import type { PublicAgency } from "@/lib/habita/tenant";

export function AgencyContact({ agency }: { agency: PublicAgency }) {
  return (
    <section className="border-t border-[var(--border-subtle)]">
      <div className="w-full px-8 md:px-16 py-14 max-w-4xl text-center">
        <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-4">
          Contatti
        </p>
        <h2 className="font-display text-4xl md:text-5xl text-[var(--fg-primary)] mb-6">
          Parliamone.
        </h2>
        <p className="text-lg text-[var(--fg-secondary)] mb-10 max-w-xl mx-auto leading-relaxed">
          Stai cercando casa, vuoi vendere o affittare un immobile?
          Siamo un'agenzia indipendente: parli con noi, non con un call center.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {agency.phone ? (
            <a
              href={`tel:${agency.phone}`}
              className="px-6 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Chiama {agency.phone}
            </a>
          ) : null}
          <Link
            href={`/${agency.slug}/immobili`}
            className="px-6 py-3 border border-[var(--border-subtle)] rounded-md text-sm font-medium hover:opacity-80 transition-opacity"
          >
            Vedi gli immobili
          </Link>
        </div>
      </div>
    </section>
  );
}
