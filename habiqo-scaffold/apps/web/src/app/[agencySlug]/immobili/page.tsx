import { getAgencyBySlug } from "@/lib/habita/tenant";
import { listPublicProperties } from "@/lib/habita/properties";
import { PropertyGrid } from "@/components/habita/property-grid";

type Params = Promise<{ agencySlug: string }>;

export default async function HabitaListingsPage({
  params,
}: {
  params: Params;
}) {
  const { agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) return null;

  const properties = await listPublicProperties(agency.id);

  return (
    <div className="container mx-auto px-6 py-16 max-w-6xl">
      <div className="mb-12">
        <h1 className="font-display text-5xl md:text-6xl text-[var(--fg-primary)] mb-4 leading-tight">
          Immobili
        </h1>
        <p className="text-lg text-[var(--fg-secondary)] max-w-2xl">
          {properties.length > 0
            ? `${properties.length} immobili attualmente disponibili.`
            : "Stiamo aggiornando il portafoglio. Torna a trovarci presto."}
        </p>
      </div>

      <PropertyGrid agencySlug={agency.slug} properties={properties} />
    </div>
  );
}
