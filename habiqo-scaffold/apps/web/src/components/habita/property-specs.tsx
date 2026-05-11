import type { PublicProperty } from "@/lib/habita/properties";

type Props = {
  property: PublicProperty;
};

type Spec = { label: string; value: string };

function buildSpecs(property: PublicProperty): Spec[] {
  const specs: Spec[] = [];

  specs.push({
    label: "Tipo",
    value: property.listingType === "rent" ? "Affitto" : "Vendita",
  });

  if (property.rooms != null) {
    specs.push({ label: "Vani", value: String(property.rooms) });
  }
  if (property.bathrooms != null) {
    specs.push({ label: "Bagni", value: String(property.bathrooms) });
  }
  if (property.sqm != null) {
    specs.push({ label: "Superficie", value: `${property.sqm} m²` });
  }
  if (property.floor != null) {
    specs.push({ label: "Piano", value: String(property.floor) });
  }
  if (property.energyClass) {
    specs.push({ label: "Classe energetica", value: property.energyClass });
  }
  if (property.hasElevator !== null) {
    specs.push({
      label: "Ascensore",
      value: property.hasElevator ? "Sì" : "No",
    });
  }
  if (property.hasGarage !== null) {
    specs.push({
      label: "Garage",
      value: property.hasGarage ? "Sì" : "No",
    });
  }

  return specs;
}

export function PropertySpecs({ property }: Props) {
  const specs = buildSpecs(property);

  if (specs.length === 0) return null;

  return (
    <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
      {specs.map((spec) => (
        <div key={spec.label}>
          <dt className="text-xs uppercase tracking-widest text-[var(--fg-secondary)] mb-1">
            {spec.label}
          </dt>
          <dd className="text-[var(--fg-primary)]">{spec.value}</dd>
        </div>
      ))}
    </dl>
  );
}
