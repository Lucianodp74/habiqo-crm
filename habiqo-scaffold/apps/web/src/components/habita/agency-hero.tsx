import Link from "next/link";
import type { PublicAgency } from "@/lib/habita/tenant";

export function AgencyHero({ agency }: { agency: PublicAgency }) {
  return (
    <section className="border-b border-[var(--border-subtle)]">
      <div className="container mx-auto px-6 py-16 md:py-24 max-w-4xl">
        <h1 className="font-display text-5xl md:text-7xl leading-tight text-[var(--fg-primary)] mb-6">
          {agency.name}
        </h1>
        {agency.tagline ? (
          <p className="font-display italic text-xl md:text-2xl text-[var(--fg-secondary)] mb-10 max-w-2xl leading-snug">
            {agency.tagline}
          </p>
        ) : (
          <p className="font-display italic text-xl md:text-2xl text-[var(--fg-secondary)] mb-10 max-w-2xl leading-snug">
            Tecnologia moderna, relazione diretta.
          </p>
        )}
        <div className="flex flex-wrap gap-3 mb-5">
          <Link
            href={`/${agency.slug}/immobili`}
            className="px-6 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Scopri gli immobili
          </Link>
          {agency.phone ? (
            <a
              href={`tel:${agency.phone}`}
              className="px-6 py-3 border border-[var(--border-subtle)] rounded-md text-sm font-medium hover:opacity-80 transition-opacity"
            >
              {agency.phone}
            </a>
          ) : null}
        </div>
        <p className="text-xs tracking-widest uppercase text-[var(--fg-secondary)] opacity-50">
          Tecnologia Habiquo
        </p>
      </div>
    </section>
  );
}
