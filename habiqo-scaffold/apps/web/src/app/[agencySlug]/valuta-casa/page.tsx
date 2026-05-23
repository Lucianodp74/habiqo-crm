import { getAgencyBySlug } from "@/lib/habita/tenant";
import { notFound } from "next/navigation";
import { ValuationFlow } from "@/components/habita/valuation-flow";

type Params = Promise<{ agencySlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  return {
    title: `Valuta il tuo immobile — ${agency?.name ?? ""}`,
    description: `Scopri il valore del tuo immobile con una valutazione personalizzata da ${agency?.name ?? ""}`,
  };
}

export default async function ValutaCasaPage({ params }: { params: Params }) {
  const { agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) notFound();

  return (
    <div className="min-h-screen">

      {/* Hero section */}
      <section className="border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
        <div className="px-8 md:px-16 py-14 md:py-20">
          <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-4">
            {agency.name} · Valutazione gratuita
          </p>
          <h1 className="font-display text-4xl md:text-6xl text-[var(--fg-primary)] leading-tight mb-4">
            Quanto vale il<br />tuo immobile?
          </h1>
          <p className="text-base md:text-lg text-[var(--fg-secondary)] max-w-lg leading-relaxed">
            Rispondi a poche domande. Un nostro consulente ti
            contatterà con una valutazione reale, basata sul mercato locale.
          </p>
          <div className="flex flex-wrap gap-4 mt-8 text-sm text-[var(--fg-muted)]">
            {["✓ Gratuito e senza impegno", "✓ Risposta entro 24 ore", "✓ Valutazione locale"].map(s => (
              <span key={s}>{s}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Valuation flow */}
      <section className="bg-[var(--bg-canvas)]">
        <ValuationFlow agencyId={agency.id} agencyName={agency.name} />
      </section>

    </div>
  );
}
