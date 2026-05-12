import type { PublicAgency } from "@/lib/habita/tenant";

export function AgencyAbout({ agency }: { agency: PublicAgency }) {
  if (!agency.description) return null;

  const location = [agency.city, agency.region].filter(Boolean).join(", ");

  return (
    <section className="container mx-auto px-6 py-20 max-w-4xl">
      <div className="grid md:grid-cols-3 gap-12">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
            Chi siamo
          </p>
          <h2 className="font-display text-2xl text-[var(--fg-primary)]">
            L'agenzia
          </h2>
        </div>
        <div className="md:col-span-2">
          <p className="text-lg leading-relaxed text-[var(--fg-secondary)] whitespace-pre-line">
            {agency.description}
          </p>
          {location ? (
            <p className="mt-6 text-sm text-[var(--fg-secondary)]">
              <span className="text-[var(--fg-primary)] font-medium">
                Zona di operatività:
              </span>{" "}
              {location}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
