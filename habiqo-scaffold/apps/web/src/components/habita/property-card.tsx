import Link from "next/link";
import type { PublicProperty } from "@/lib/habita/properties";
import { getPropertyPhotoUrl } from "@/lib/storage/property-photos";

type Props = {
  agencySlug: string;
  property: PublicProperty;
};

function formatPrice(amount: number, listingType: "sale" | "rent"): string {
  const formatted = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
  return listingType === "rent" ? `${formatted}/mese` : formatted;
}

function formatType(listingType: "sale" | "rent"): string {
  return listingType === "rent" ? "Affitto" : "Vendita";
}

export function PropertyCard({ agencySlug, property }: Props) {
  const specs = [
    property.rooms != null ? `${property.rooms} vani` : null,
    property.bathrooms != null ? `${property.bathrooms} bagni` : null,
    property.sqm != null ? `${property.sqm} m²` : null,
  ].filter(Boolean) as string[];

  const cover = property.photos[0];

  return (
    <Link
      href={`/${agencySlug}/immobili/${property.slug}`}
      className="group block border border-[var(--border-subtle)] rounded-lg overflow-hidden bg-[var(--bg-canvas)] hover:border-[var(--accent-deep)] transition-colors"
    >
      <div className="aspect-[4/3] overflow-hidden bg-[var(--bg-canvas)]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getPropertyPhotoUrl(cover)}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background:
                "linear-gradient(135deg, var(--bg-canvas) 0%, color-mix(in srgb, var(--accent-deep) 8%, var(--bg-canvas)) 100%)",
            }}
          >
            <span className="text-xs uppercase tracking-widest text-[var(--fg-secondary)] opacity-50">
              Foto in arrivo
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-2">
          {formatType(property.listingType)}
        </p>
        <h3 className="font-display text-xl text-[var(--fg-primary)] mb-1 leading-snug group-hover:opacity-90 transition-opacity">
          {property.title}
        </h3>
        {property.city ? (
          <p className="text-sm text-[var(--fg-secondary)] mb-3">
            {property.city}
            {property.region ? `, ${property.region}` : ""}
          </p>
        ) : null}
        {specs.length > 0 ? (
          <p className="text-sm text-[var(--fg-secondary)] mb-4">
            {specs.join(" · ")}
          </p>
        ) : null}
        {property.priceEur != null ? (
          <p className="font-display text-2xl text-[var(--fg-primary)]">
            {formatPrice(property.priceEur, property.listingType)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
