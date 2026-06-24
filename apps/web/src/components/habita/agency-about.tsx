import type { PublicAgency } from "@/lib/habita/tenant";

export function AgencyAbout({ agency }: { agency: PublicAgency }) {
  return (
    <section id="sedi" className="border-b border-[var(--border-subtle)]">
      <div className="px-8 md:px-16 py-14">
        <div className="grid md:grid-cols-[280px_1fr] gap-12">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">Chi siamo</p>
            <h2 className="font-display text-3xl text-[var(--fg-primary)] leading-tight">
              Un&apos;agenzia indipendente.
            </h2>
          </div>
          <div>
            <p className="text-sm leading-relaxed text-[var(--fg-secondary)] mb-6">Siamo un'agenzia immobiliare indipendente. Lavoriamo su un numero limitato di immobili residenziali e commerciali per garantire attenzione, riservatezza e relazione diretta tra venditore, acquirente e agenzia. Non siamo parte di un network nazionale: niente franchising, niente quote, solo conoscenza diretta del territorio.</p>

            <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-4">Le nostre sedi</p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="border border-[var(--border-subtle)] rounded-lg p-5">
                <p className="text-sm font-medium text-[var(--fg-primary)] mb-1">San Giorgio Ionico</p>
                <p className="text-sm text-[var(--fg-secondary)]">Puglia</p>
              </div>
              <div className="border border-[var(--border-subtle)] rounded-lg p-5">
                <p className="text-sm font-medium text-[var(--fg-primary)] mb-1">Taranto</p>
                <p className="text-sm text-[var(--fg-secondary)]">Puglia</p>
              </div>
            </div>

            {agency.city && (
              <p className="text-sm text-[var(--fg-secondary)] mt-6">
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
