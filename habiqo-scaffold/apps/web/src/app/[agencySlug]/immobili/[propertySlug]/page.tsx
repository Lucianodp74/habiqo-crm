import { getAgencyBySlug } from "@/lib/habita/tenant";

type Params = Promise<{ agencySlug: string; propertySlug: string }>;

export default async function HabitaPropertyPage({
  params,
}: {
  params: Params;
}) {
  const { agencySlug, propertySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) return null;

  return (
    <div className="container mx-auto px-6 py-12">
      <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
        Habita · {agency.slug} · {propertySlug}
      </p>
      <h2 className="font-display text-4xl mb-6 text-[var(--fg-primary)]">
        Dettaglio immobile
      </h2>

      <div className="p-6 border border-dashed border-[var(--border-subtle)] rounded-lg max-w-2xl">
        <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-2">
          Stub Fase 2
        </p>
        <p className="text-sm text-[var(--fg-secondary)]">
          La pagina con gallery, caratteristiche, e form contatto verrà
          costruita nella Fase 5.
        </p>
        <p className="text-xs mt-3 text-[var(--fg-secondary)]">
          Slug richiesto:{" "}
          <code className="px-1.5 py-0.5 bg-[var(--bg-elevated)] rounded">
            {propertySlug}
          </code>
        </p>
      </div>
    </div>
  );
}
