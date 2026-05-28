import type { PublicAgency } from "@/lib/habita/tenant";

export function AgencyAbout({ agency }: { agency: PublicAgency }) {

  return (
    <section className="border-b border-[var(--border-subtle)]">
      <div className="px-8 md:px-16 py-14">
        <div className="grid md:grid-cols-[280px_1fr] gap-12">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">Chi siamo</p>
            <h2 className="font-display text-3xl text-[var(--fg-primary)] leading-tight">
              Un&apos;agenzia indipendente.
            </h2>
          </div>
          <div>
            <p className="text-sm leading-relaxed text-[var(--fg-secondary)] mb-4">Siamo un'agenzia immobiliare indipendente. Lavoriamo su un numero limitato di immobili residenziali e commerciali per garantire attenzione, riservatezza e relazione diretta tra venditore, acquirente e agenzia. Non siamo parte di un network nazionale: niente franchising, niente quote, solo conoscenza diretta del territorio.</p>
            {agency.city && (
              <p className="text-sm text-[var(--fg-secondary)]">
                <strong className="text-[var(--fg-primary)] font-medium">Operiamo a:</strong>{" "}
                {agency.city}{agency.region ? `, ${agency.region}` : ""}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
