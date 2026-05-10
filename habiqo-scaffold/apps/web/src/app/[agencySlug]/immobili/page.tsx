import { getAgencyBySlug } from "@/lib/habita/tenant";

type Params = Promise<{ agencySlug: string }>;

export default async function HabitaListingsPage({
  params,
}: {
  params: Params;
}) {
  const { agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) return null;

  return (
    <div className="container mx-auto px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
        Habita · {agency.slug}
      </p>
      <h2 className="font-display text-4xl mb-6 text-[var(--fg-primary)]">
        Immobili in vendita
      </h2>

      <div className="p-6 border border-dashed border-[var(--border-subtle)] rounded-lg max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-2">
          Stub Fase 2
        </p>
        <p className="text-sm text-[var(--fg-secondary)]">
          La griglia degli immobili pubblici verrà costruita nella Fase 4.
        </p>
      </div>
    </div>
  );
}
