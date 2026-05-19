import Link from "next/link";
import Image from "next/image";
import { getAnonClient } from "@/lib/habita/supabase-anon";
import type { PublicAgency } from "@/lib/habita/tenant";

interface HeroProperty {
  id: string;
  title: string;
  price_eur: number;
  city: string;
  surface_sqm: number | null;
  bedrooms: number | null;
  photos: string[];
  listing_type: "sale" | "rent";
  slug: string;
}

async function getHeroProperty(agencyId: string): Promise<HeroProperty | null> {
  const supabase = getAnonClient();
  const { data } = await supabase
    .from("properties")
    .select("id, title, price_eur, city, surface_sqm, bedrooms, photos, listing_type, slug")
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

  const subtitle = agency.city
    ? `Vendita e affitto di immobili residenziali e commerciali a ${agency.city} e provincia.`
    : "Vendita e affitto di immobili residenziali e commerciali.";

  return (
    <section className="border-b border-[var(--border-subtle)]">
      <div className="container mx-auto px-6 py-14 md:py-20 max-w-5xl">
        <div
          className={`grid gap-10 md:gap-16 ${
            featured ? "md:grid-cols-2 md:items-center" : ""
          }`}
        >
          {/* ── Left: testo + CTA ─────────────────────────────────────── */}
          <div>
            <h1 className="font-display text-5xl md:text-6xl leading-tight text-[var(--fg-primary)] mb-4">
              {agency.name}
            </h1>
            <p className="font-display italic text-xl md:text-2xl text-[var(--fg-secondary)] mb-3 leading-snug">
              {agency.tagline ?? "Case selezionate con attenzione."}
            </p>
            <p className="text-sm text-[var(--fg-secondary)] mb-8 leading-relaxed max-w-sm">
              {subtitle}
            </p>
            <div className="flex flex-wrap gap-3 mb-5">
              <Link
                href={`/${agency.slug}/immobili`}
                className="px-6 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Scopri gli immobili
              </Link>
              {agency.phone ? (
                <a
                  href={`tel:${agency.phone}`}
                  className="px-6 py-3 border border-[var(--border-subtle)] rounded-md text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  {agency.phone}
                </a>
              ) : null}
            </div>
            <p className="text-xs tracking-widest uppercase text-[var(--fg-secondary)] opacity-50">
              Tecnologia Habiquo
            </p>
          </div>

          {/* ── Right: featured property card ─────────────────────────── */}
          {featured && (
            <Link
              href={`/${agency.slug}/immobili/${featured.slug}`}
              className="group block"
            >
              <div className="overflow-hidden rounded-sm border border-[var(--border-subtle)]">
                <div className="aspect-[4/3] relative bg-[var(--bg-canvas)]">
                  <div className="absolute top-3 left-3 z-10">
                    <span className="px-2.5 py-1 text-xs font-medium tracking-wide bg-[var(--bg-canvas)]/90 text-[var(--fg-primary)] rounded-sm backdrop-blur-sm">
                      {featured.listing_type === "rent" ? "Affitto" : "Vendita"}
                    </span>
                  </div>
                  {featured.photos?.[0] ? (
                    <Image
                      src={featured.photos[0]}
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
                    {featured.surface_sqm ? ` · ${featured.surface_sqm} m²` : ""}
                    {featured.bedrooms ? ` · ${featured.bedrooms} camere` : ""}
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
