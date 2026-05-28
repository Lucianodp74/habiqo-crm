import type { PublicProperty } from "@/lib/habita/properties";
import { PropertyCard } from "./property-card";

type Props = {
  agencySlug: string;
  properties: PublicProperty[];
};

export function PropertyGrid({ agencySlug, properties }: Props) {
  if (properties.length === 0) {
    return (
      <div className="p-12 border border-dashed border-[var(--border-subtle)] rounded-lg text-center">
        <p className="text-[var(--fg-secondary)]">
          Nessun immobile pubblicato al momento.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          agencySlug={agencySlug}
          property={property}
        />
      ))}
    </div>
  );
}
