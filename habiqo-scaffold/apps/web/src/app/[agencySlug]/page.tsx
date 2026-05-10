import { getAgencyBySlug } from "@/lib/habita/tenant";

type Params = Promise<{ agencySlug: string }>;

export default async function HabitaAgencyHomePage({
  params,
}: {
  params: Params;
}) {
  const { agencySlug } = await params;
  // Layout already enforced existence via notFound(); React.cache makes this
  // call free (deduplicated within the same request).
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) return null;

  return (
    <div className="container mx-auto px-6 py-12">
      <section className="max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
          Habita · {agency.slug}
        </p>
        <h2 className="font-display text-4xl mb-6 text-[var(--fg-primary)]">
          Benvenuti in {agency.name}
        </h2>
        {agency.description ? (
          <p className="text-lg leading-relaxed text-[var(--fg-secondary)]">
            {agency.description}
          </p>
        ) : (
          <p className="text-lg leading-relaxed text-[var(--fg-secondary)]">
            Sito ufficiale dell'agenzia.
          </p>
        )}

        <div className="mt-12 p-6 border border-dashed border-[var(--border-subtle)] rounded-lg">
          <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-2">
            Stub Fase 2
          </p>
          <p className="text-sm text-[var(--fg-secondary)]">
            Pagina segnaposto. La homepage completa con immobili in evidenza,
            hero, e CTA verrà costruita nella Fase 3.
          </p>
        </div>
      </section>
    </div>
  );
}
