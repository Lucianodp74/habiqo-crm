"use client";

import { useMemo, useState } from "react";
import { PropertyListItem } from "@/components/admin/property-list-item";

type PropertyRow = {
  id: string;
  title: string;
  city: string;
  listingType: "sale" | "rent";
  priceEur: number;
  photos: string[];
  slug: string | null;
  isPublic: boolean;
  agencyName: string;
  publishedTo: string[];
  locationName: string | null;
  internalCode: string | null;
};

export function PropertySearchList({
  properties,
  formatPrice,
  getPropertyPhotoUrl,
}: {
  properties: PropertyRow[];
  formatPrice: (value: number, type: "sale" | "rent") => string;
  getPropertyPhotoUrl: (path: string) => string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return properties;

    return properties.filter((p) => {
      const code = (p.internalCode ?? "").toLowerCase();
      const title = p.title.toLowerCase();
      const city = p.city.toLowerCase();
      return code.includes(q) || title.includes(q) || city.includes(q);
    });
  }, [query, properties]);

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca per codice immobile (es. TA-001)…"
          className="w-full sm:w-80 rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none"
        />
        {query && (
          <p className="mt-2 text-xs text-neutral-500">
            {filtered.length} risultat{filtered.length === 1 ? "o" : "i"} per &ldquo;{query}&rdquo;
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
          <p className="text-sm text-neutral-500">Nessun immobile trovato per questo codice.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <PropertyListItem
              key={p.id}
              id={p.id}
              title={p.title}
              city={p.city}
              listingType={p.listingType}
              priceFormatted={formatPrice(p.priceEur, p.listingType)}
              coverUrl={p.photos[0] ? getPropertyPhotoUrl(p.photos[0]) : null}
              photoCount={p.photos.length}
              isPublic={p.isPublic}
              agencyName={p.agencyName}
              publishedTo={p.publishedTo}
              locationName={p.locationName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
