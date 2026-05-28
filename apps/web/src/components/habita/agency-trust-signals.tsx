

const SIGNALS = [
  { label: "Immobili selezionati", text: "Solo proprietà valutate e curate personalmente." },
  { label: "Assistenza diretta", text: "Parli sempre con noi, non con un operatore." },
  { label: "Nessun franchising", text: "Agenzia indipendente, libera da network e quote." },
  { label: "Territorio", text: "Conoscenza diretta e quotidiana della zona." },
];

export function AgencyTrustSignals() {
  return (
    <section className="border-b border-[var(--border-subtle)]">
      <div className="px-8 md:px-16 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {SIGNALS.map((s) => (
            <div key={s.label}>
              <p className="text-[10px] uppercase tracking-widest text-[var(--accent-deep)] mb-2">
                {s.label}
              </p>
              <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
