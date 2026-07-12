import Image from "next/image";
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

export async function AgencyHero({ agency }: { agency: PublicAgency }) {
  // `featured` è usato SOLO per decidere la foto di sfondo di fallback
  // quando l'agenzia non ha impostato una foto Hero fissa. Non viene più
  // mostrato alcun teaser (badge/prezzo/link) legato a questo immobile:
  // la Hero è ora puro branding, gli immobili restano promossi nelle
  // sezioni sottostanti (in evidenza, lista completa).
  const featured = await getHeroProperty(agency.id);

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
        <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-none text-white mb-2">
          {agency.name}
        </h1>
        <p className="font-display italic text-lg md:text-2xl text-white/75 mb-6 md:mb-8">
          {agency.tagline ?? "Immobili scelti uno a uno."}
        </p>
        <div className="max-w-lg">
          <PropertySearchBar agencySlug={agency.slug} variant="dark" />
        </div>
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
