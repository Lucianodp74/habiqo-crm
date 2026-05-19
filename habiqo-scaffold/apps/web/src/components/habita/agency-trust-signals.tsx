const SIGNALS = [
  {
    label: "Immobili selezionati",
    desc: "Solo proprietà valutate e curate personalmente.",
  },
  {
    label: "Assistenza diretta",
    desc: "Parli sempre con noi, non con un operatore.",
  },
  {
    label: "Nessun franchising",
    desc: "Agenzia indipendente, libera da network e quote.",
  },
  {
    label: "Territorio",
    desc: "Conoscenza diretta e quotidiana della zona.",
  },
];

export function AgencyTrustSignals() {
  return (
    <section className="border-b border-[var(--border-subtle)]">
      <div className="container mx-auto px-6 py-12 max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {SIGNALS.map((s) => (
            <div key={s.label}>
              <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-2">
                {s.label}
              </p>
              <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
