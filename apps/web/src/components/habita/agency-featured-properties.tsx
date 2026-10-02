import Link from "next/link";
import Image from "next/image";
import { getAnonClient } from "@/lib/habita/supabase-anon";
import { getPropertyPhotoUrl } from "@/lib/storage/property-photos";
import type { PublicAgency } from "@/lib/habita/tenant";

interface FeaturedProperty {
  id: string; title: string; price_eur: number; city: string;
  sqm: number | null; rooms: number | null; photos: string[];
  listing_type: "sale" | "rent"; slug: string;
}

async function getAgencyFeaturedProperties(
  agencyId: string,
): Promise<{ properties: FeaturedProperty[]; totalCount: number }> {
  const supabase = getAnonClient();

  // Conteggio reale degli annunci attivi e pubblici dell'agenzia: senza
  // questo numero la sezione mostra solo 6 card e sembra che l'agenzia
  // abbia pochissimi immobili disponibili, quando in realtà ne ha molti
  // di più (es. 68+). Mostrare il totale reale risolve il problema.
  // Ordina prima gli immobili scelti manualmente dall'agenzia
  // (is_featured), poi riempie gli slot restanti con i più recenti —
  // così se l'agenzia non ha ancora scelto nulla il comportamento resta
  // identico a prima (i 6 più recenti), e se sceglie 1-6 immobili questi
  // compaiono sempre per primi.
  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, title, price_eur, city, sqm, rooms, photos, listing_type, slug")
      .eq("agency_id", agencyId)
      .eq("status", "active")
      .eq("is_public", true)
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("status", "active")
      .eq("is_public", true),
  ]);

  return { properties: data ?? [], totalCount: count ?? 0 };
}

function formatPrice(price: number, listingType: "sale" | "rent"): string {
  const f = new Intl.NumberFormat("it-IT", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0,
  }).format(price);
  return listingType === "rent" ? `${f}/mese` : f;
}

export async function AgencyFeaturedProperties({ agency }: { agency: PublicAgency }) {
  const { properties, totalCount } = await getAgencyFeaturedProperties(agency.id);
  if (properties.length === 0) return null;

  const hasMore = totalCount > properties.length;

  return (
    <section className="border-b border-[var(--border-subtle)]">
      <div className="px-8 md:px-16 py-14">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-1">Selezione</p>
            <h2 className="font-display text-3xl text-[var(--fg-primary)]">
              {hasMore
                ? `Una selezione dai nostri ${totalCount} immobili`
                : "Immobili in evidenza"}
            </h2>
          </div>
          <Link href={`/${agency.slug}/immobili`}
            className="hidden sm:inline text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors hover:underline underline-offset-4">
            Vedi tutti →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
          {properties.map((property) => {
            const photoUrl = property.photos?.[0] ? getPropertyPhotoUrl(property.photos[0]) : null;
            return (
              <Link key={property.id} href={`/${agency.slug}/immobili/${property.slug}`}
                className="group block">
                {/* Card */}
                <div className="rounded-sm overflow-hidden bg-[var(--bg-canvas)] border border-[var(--border-subtle)] transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  {/* Foto */}
                  <div className="aspect-[4/3] relative overflow-hidden">
                    <div className="absolute top-2 left-2 z-10">
                      <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--bg-canvas)]/90 text-[var(--fg-primary)] rounded-sm backdrop-blur-sm">
                        {property.listing_type === "rent" ? "Affitto" : "Vendita"}
                      </span>
                    </div>
                    {photoUrl ? (
                      <Image src={photoUrl} alt={property.title} fill
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                        sizes="(max-width: 640px) 50vw, 33vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-elevated)]">
                        <span className="text-xs text-[var(--fg-muted)]">Foto</span>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="p-4">
                    <p className="font-display text-xl text-[var(--fg-primary)] mb-0.5">
                      {formatPrice(property.price_eur, property.listing_type)}
                    </p>
                    <p className="text-xs text-[var(--fg-secondary)]">
                      {property.city}
                      {property.sqm ? ` · ${property.sqm} m²` : ""}
                      {property.rooms ? ` · ${property.rooms} cam.` : ""}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {hasMore && (
          <div className="mt-10 flex justify-center">
            <Link
              href={`/${agency.slug}/immobili`}
              className="px-8 py-3.5 rounded-lg text-sm font-semibold border border-[var(--fg-primary)] text-[var(--fg-primary)] hover:bg-[var(--fg-primary)] hover:text-[var(--bg-canvas)] transition-colors"
            >
              Vedi tutti i {totalCount} immobili →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
