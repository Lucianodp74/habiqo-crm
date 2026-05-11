import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgencyBySlug } from "@/lib/habita/tenant";
import { getPublicPropertyBySlug } from "@/lib/habita/properties";
import { PropertyGallery } from "@/components/habita/property-gallery";
import { PropertySpecs } from "@/components/habita/property-specs";
import { LeadForm } from "@/components/habita/lead-form";

type Params = Promise<{ agencySlug: string; propertySlug: string }>;

function formatPrice(amount: number, listingType: "sale" | "rent"): string {
  const formatted = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
  return listingType === "rent" ? `${formatted}/mese` : formatted;
}

export default async function HabitaPropertyPage({
  params,
}: {
  params: Params;
}) {
  const { agencySlug, propertySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) return null;

  const property = await getPublicPropertyBySlug(agency.id, propertySlug);

  if (!property) {
    notFound();
  }

  const fullAddress = [property.address, property.city, property.region]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="container mx-auto px-6 py-12 max-w-6xl">
      <nav className="text-sm text-[var(--fg-secondary)] mb-8">
        <Link
          href={`/${agency.slug}/immobili`}
          className="hover:text-[var(--fg-primary)] transition-colors"
        >
          ← Tutti gli immobili
        </Link>
      </nav>

      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
          {property.listingType === "rent" ? "Affitto" : "Vendita"}
          {property.city ? ` · ${property.city}` : ""}
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-[var(--fg-primary)] leading-tight">
          {property.title}
        </h1>
      </header>

      <PropertyGallery property={property} />

      <div className="grid lg:grid-cols-3 gap-12 mt-12">
        <div className="lg:col-span-2 space-y-12">
          {property.description ? (
            <section>
              <h2 className="font-display text-2xl text-[var(--fg-primary)] mb-4">
                Descrizione
              </h2>
              <p className="text-[var(--fg-secondary)] leading-relaxed whitespace-pre-line">
                {property.description}
              </p>
            </section>
          ) : null}

          <section>
            <h2 className="font-display text-2xl text-[var(--fg-primary)] mb-4">
              Caratteristiche
            </h2>
            <PropertySpecs property={property} />
          </section>

          {fullAddress ? (
            <section>
              <h2 className="font-display text-2xl text-[var(--fg-primary)] mb-4">
                Posizione
              </h2>
              <p className="text-[var(--fg-secondary)]">{fullAddress}</p>
            </section>
          ) : null}
        </div>

        <aside className="lg:col-span-1">
          <div className="lg:sticky lg:top-24 border border-[var(--border-subtle)] rounded-lg p-6 bg-[var(--bg-canvas)]">
            {property.priceEur != null ? (
              <div className="mb-6 pb-6 border-b border-[var(--border-subtle)]">
                <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-2">
                  Prezzo
                </p>
                <p className="font-display text-3xl text-[var(--fg-primary)]">
                  {formatPrice(property.priceEur, property.listingType)}
                </p>
              </div>
            ) : null}

            <h2 className="font-display text-xl text-[var(--fg-primary)] mb-4">
              Richiedi informazioni
            </h2>
            <LeadForm
              agencyId={agency.id}
              propertyId={property.id}
              propertyTitle={property.title}
            />
          </div>
        </aside>
      </div>
    </article>
  );
}
