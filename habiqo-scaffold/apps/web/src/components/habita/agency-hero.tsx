import Link from "next/link";
import Image from "next/image";
import { getAnonClient } from "@/lib/habita/supabase-anon";
import { getPropertyPhotoUrl } from "@/lib/storage/property-photos";
import { PropertySearchBar } from "@/components/habita/property-search-bar";
import type { PublicAgency } from "@/lib/habita/tenant";

interface HeroProperty {
  id: string;
  title: string;
  price_eur: number;
  city: string;
  sqm: number | null;
  rooms: number | null;
  photos: string[];
  listing_type: "sale" | "rent";
  slug: string;
}

async function getHeroProperty(agencyId: string): Promise<HeroProperty | null> {
  const supabase = getAnonClient();
  const { data } = await supabase
    .from("properties")
    .select("id, title, price_eur, city, sqm, rooms, photos, listing_type, slug")
    .eq("agency_id", agencyId)
    .eq("status", "active")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

function formatPrice(price: number, listingType: "sale" | "rent"): string {
  const formatted = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
  return listingType === "rent" ? `${formatted}/mese` : formatted;
}

export async function AgencyHero({ agency }: { agency: PublicAgency }) {
  const featured = await getHeroProperty(agency.id);

  const featuredPhotoUrl = featured?.photos?.[0]
    ? getPropertyPhotoUrl(featured.photos[0])
    : null;

  return (
    <section className="border-b border-[var(--border-subtle)]">
      <div className="mx-auto w-full max-w-screen-xl px-6 lg:px-12 py-10 md:py-16 max-w-7xl">
        <div className={`grid gap-8 md:gap-12 ${featured ? "md:grid-cols-2 md:items-center" : ""}`}>

          {/* ── Left ──────────────────────────────────────────── */}
          <div>
            <h1 className="font-display text-4xl md:text-5xl leading-tight text-[var(--fg-primary)] mb-2">
              {agency.name}
            </h1>
            <p className="font-display italic text-lg text-[var(--fg-secondary)] mb-1 leading-snug">
              {agency.tagline ?? "Case selezionate con attenzione."}
            </p>
            <p className="text-sm text-[var(--fg-secondary)] leading-relaxed">
              {agency.city
                ? `Vendita e affitto a ${agency.city} e provincia.`
                : "Vendita e affitto di immobili residenziali."}
            </p>

            {/* Search bar */}
            <PropertySearchBar agencySlug={agency.slug} />

            {/* CTA secondaria */}
            <div className="flex items-center gap-4 mt-4">
              {agency.phone ? (
                <a
                  href={`tel:${agency.phone}`}
                  className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors"
                >
                  ☎ {agency.phone}
                </a>
              ) : null}
              <span className="text-xs tracking-widest uppercase text-[var(--fg-secondary)] opacity-40">
                Tecnologia Habiquo
              </span>
            </div>
          </div>

          {/* ── Right: featured card ───────────────────────────── */}
          {featured && (
            <Link href={`/${agency.slug}/immobili/${featured.slug}`} className="group block">
              <div className="overflow-hidden rounded-sm border border-[var(--border-subtle)]">
                <div className="aspect-[4/3] relative bg-[var(--bg-canvas)]">
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 text-xs font-medium tracking-wide bg-[var(--bg-canvas)]/90 text-[var(--fg-primary)] rounded-sm backdrop-blur-sm">
                      {featured.listing_type === "rent" ? "Affitto" : "Vendita"}
                    </span>
                  </div>
                  {featuredPhotoUrl ? (
                    <Image
                      src={featuredPhotoUrl}
                      alt={featured.title}
                      fill
                      priority
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-xs uppercase tracking-widest text-[var(--fg-secondary)] opacity-40">
                        Foto in arrivo
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-5 border-t border-[var(--border-subtle)]">
                  <p className="font-display text-2xl text-[var(--fg-primary)] mb-1">
                    {formatPrice(featured.price_eur, featured.listing_type)}
                  </p>
                  <p className="text-sm text-[var(--fg-secondary)] mb-3">
                    {featured.city}
                    {featured.sqm ? ` · ${featured.sqm} m²` : ""}
                    {featured.rooms ? ` · ${featured.rooms} camere` : ""}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] group-hover:opacity-60 transition-opacity">
                    Scopri →
                  </p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
