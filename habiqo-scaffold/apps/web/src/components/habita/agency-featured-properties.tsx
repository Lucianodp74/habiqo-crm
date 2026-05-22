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

async function getAgencyFeaturedProperties(agencyId: string): Promise<FeaturedProperty[]> {
  const supabase = getAnonClient();
  const { data } = await supabase.from("properties")
    .select("id, title, price_eur, city, sqm, rooms, photos, listing_type, slug")
    .eq("agency_id", agencyId).eq("status", "active").eq("is_public", true)
    .order("created_at", { ascending: false }).limit(6);
  return data ?? [];
}

function formatPrice(price: number, listingType: "sale" | "rent"): string {
  const f = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(price);
  return listingType === "rent" ? `${f}/mese` : f;
}

export async function AgencyFeaturedProperties({ agency }: { agency: PublicAgency }) {
  const properties = await getAgencyFeaturedProperties(agency.id);
  if (properties.length === 0) return null;

  return (
    <section className="border-b border-[var(--border-subtle)]">
      <div className="px-8 md:px-16 py-12">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-1">Selezione</p>
            <h2 className="font-display text-2xl text-[var(--fg-primary)]">Immobili in evidenza</h2>
          </div>
          <Link href={`/${agency.slug}/immobili`}
            className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors hover:underline underline-offset-4">
            Vedi tutti →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {properties.map((property) => {
            const photoUrl = property.photos?.[0] ? getPropertyPhotoUrl(property.photos[0]) : null;
            return (
              <Link key={property.id} href={`/${agency.slug}/immobili/${property.slug}`} className="group block">
                <div className="aspect-[4/3] relative overflow-hidden rounded-sm bg-[var(--bg-canvas)] mb-3 border border-[var(--border-subtle)]">
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--bg-canvas)]/90 text-[var(--fg-primary)] rounded-sm backdrop-blur-sm">
                      {property.listing_type === "rent" ? "Affitto" : "Vendita"}
                    </span>
                  </div>
                  {photoUrl ? (
                    <Image src={photoUrl} alt={property.title} fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, 33vw" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs text-[var(--fg-secondary)] opacity-40">Foto</span>
                    </div>
                  )}
                </div>
                <p className="font-display text-lg text-[var(--fg-primary)] mb-0.5">
                  {formatPrice(property.price_eur, property.listing_type)}
                </p>
                <p className="text-xs text-[var(--fg-secondary)]">
                  {property.city}{property.sqm ? ` · ${property.sqm} m²` : ""}{property.rooms ? ` · ${property.rooms} cam.` : ""}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
