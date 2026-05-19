import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { PublicAgency } from "@/lib/habita/tenant";

interface FeaturedProperty {
  id: string;
  title: string;
  price_eur: number;
  city: string;
  surface_sqm: number | null;
  photos: string[];
  listing_type: "sale" | "rent";
  slug: string;
}

async function getAgencyFeaturedProperties(
  agencyId: string
): Promise<FeaturedProperty[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("id, title, price_eur, city, surface_sqm, photos, listing_type, slug")
    .eq("agency_id", agencyId)
    .eq("status", "active")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(3);

  return data ?? [];
}

function formatPrice(price: number, listingType: "sale" | "rent"): string {
  const formatted = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
  return listingType === "rent" ? `${formatted}/mese` : formatted;
}

export async function AgencyFeaturedProperties({
  agency,
}: {
  agency: PublicAgency;
}) {
  const properties = await getAgencyFeaturedProperties(agency.id);

  if (properties.length === 0) return null;

  return (
    <section className="border-b border-[var(--border-subtle)]">
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-2">
              Selezione
            </p>
            <h2 className="font-display text-3xl text-[var(--fg-primary)]">
              Immobili in evidenza
            </h2>
          </div>
          <Link
            href={`/${agency.slug}/immobili`}
            className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors hover:underline underline-offset-4"
          >
            Vedi tutti →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Link
              key={property.id}
              href={`/${agency.slug}/immobili/${property.slug}`}
              className="group block"
            >
              <div className="aspect-[4/3] relative overflow-hidden rounded-sm bg-[var(--bg-canvas)] mb-4 border border-[var(--border-subtle)]">
                {property.photos?.[0] ? (
                  <Image
                    src={property.photos[0]}
                    alt={property.title}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs uppercase tracking-widest text-[var(--fg-secondary)] opacity-40">
                      Foto in arrivo
                    </span>
                  </div>
                )}
              </div>
              <p className="font-display text-xl text-[var(--fg-primary)] mb-1">
                {formatPrice(property.price_eur, property.listing_type)}
              </p>
              <p className="text-sm text-[var(--fg-secondary)]">
                {property.city}
                {property.surface_sqm ? ` · ${property.surface_sqm} m²` : ""}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
