import Image from "next/image";
import Link from "next/link";
import { getAnonClient } from "@/lib/habita/supabase-anon";
import { getPropertyPhotoUrl } from "@/lib/storage/property-photos";
import { PropertySearchBar } from "@/components/habita/property-search-bar";
import type { PublicAgency } from "@/lib/habita/tenant";

interface HeroProperty {
  id: string; title: string; price_eur: number; city: string;
  sqm: number | null; rooms: number | null; photos: string[];
  listing_type: "sale" | "rent"; slug: string;
}

async function getHeroProperty(agencyId: string): Promise<HeroProperty | null> {
  const supabase = getAnonClient();
  // Forza dati freschi — no cache Vercel
  const { unstable_noStore } = await import("next/cache");
  unstable_noStore();

  const { data: featuredData } = await supabase
    .from("properties")
    .select("id, title, price_eur, city, sqm, rooms, photos, listing_type, slug")
    .eq("agency_id", agencyId)
    .eq("status", "active")
    .eq("is_featured", true)
    .limit(1)
    .maybeSingle();

  if (featuredData) return featuredData;

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
  const f = new Intl.NumberFormat("it-IT", {
    style: "currency", currency: "EUR", maximumFractionDigits: 0,
  }).format(price);
  return listingType === "rent" ? `${f}/mese` : f;
}

export async function AgencyHero({ agency }: { agency: PublicAgency }) {
  const featured = await getHeroProperty(agency.id);

  // La foto di sfondo è indipendente dal teaser immobile: se l'agenzia ha
  // impostato una foto Hero fissa (branding), quella ha priorità. Altrimenti
  // fallback identico a prima (foto dell'immobile featured/più recente).
  // Il teaser sotto (badge, prezzo, link) resta sempre legato a un immobile
  // reale, indipendentemente da quale immagine sia usata come sfondo.
  const backgroundPhotoUrl = agency.coverImagePath
    ? getPropertyPhotoUrl(agency.coverImagePath)
    : featured?.photos?.[0]
      ? getPropertyPhotoUrl(featured.photos[0])
      : null;

  return (
    <section className="relative min-h-[85vh] flex flex-col justify-end overflow-hidden">
      {backgroundPhotoUrl ? (
        <Image
          src={backgroundPhotoUrl}
          alt={agency.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-[var(--fg-primary)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
      <div className="relative px-8 md:px-16 pb-10 md:pb-14 pt-32">
        {featured && (
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-[10px] uppercase tracking-widest font-medium bg-white/20 text-white/90 backdrop-blur-sm rounded-full border border-white/20">
              {featured.listing_type === "rent" ? "Affitto" : "Vendita"} · In evidenza
            </span>
          </div>
        )}
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-none text-white mb-2">
          {agency.name}
        </h1>
        <p className="font-display italic text-lg md:text-2xl text-white/75 mb-6 md:mb-8">
          {agency.tagline ?? "Immobili scelti uno a uno."}
        </p>
        <div className="max-w-lg">
          <PropertySearchBar agencySlug={agency.slug} variant="dark" />
        </div>
        {featured && (
          <Link
            href={`/${agency.slug}/immobili/${featured.slug}`}
            className="inline-flex items-center gap-3 mt-5 text-white/70 text-sm hover:text-white transition-colors group"
          >
            <span>
              {featured.city}
              {featured.sqm ? ` · ${featured.sqm} m²` : ""}
              {featured.rooms ? ` · ${featured.rooms} camere` : ""}
            </span>
            <span className="text-white font-semibold">
              {formatPrice(featured.price_eur, featured.listing_type)}
            </span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
          </Link>
        )}
      </div>
      {agency.phone && (
        <a
          href={`tel:${agency.phone}`}
          className="absolute top-6 right-6 md:hidden px-4 py-2 bg-white/15 backdrop-blur-sm text-white text-xs font-medium rounded-full border border-white/20 hover:bg-white/25 transition-colors"
        >
          {agency.phone}
        </a>
      )}
    </section>
  );
}
