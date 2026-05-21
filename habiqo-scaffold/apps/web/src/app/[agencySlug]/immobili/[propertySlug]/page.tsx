import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnonClient } from "@/lib/habita/supabase-anon";
import { getAgencyBySlug } from "@/lib/habita/tenant";
import { getPropertyPhotoUrl } from "@/lib/storage/property-photos";
import { LeadForm } from "@/components/habita/lead-form";

type Params = Promise<{ agencySlug: string; propertySlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { agencySlug, propertySlug } = await params;
  const supabase = getAnonClient();
  const agency = await getAgencyBySlug(agencySlug);
  const { data } = await supabase
    .from("properties")
    .select("title, seo_title, description, city, price_eur")
    .eq("slug", propertySlug)
    .eq("is_public", true)
    .maybeSingle();

  if (!data) return { title: "Immobile non trovato" };

  return {
    title: data.seo_title ?? `${data.title} — ${agency?.name ?? ""}`,
    description: data.description?.slice(0, 160) ?? undefined,
  };
}

function formatPrice(price: number, listingType: string): string {
  const formatted = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(price);
  return listingType === "rent" ? `${formatted}/mese` : formatted;
}

function FeaturePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
      <p className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)] mb-0.5">{label}</p>
      <p className="text-sm font-medium text-[var(--fg-primary)]">{value}</p>
    </div>
  );
}

export default async function PropertyDetailPage({ params }: { params: Params }) {
  const { agencySlug, propertySlug } = await params;

  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) notFound();

  const supabase = getAnonClient();
  const { data: property } = await supabase
    .from("properties")
    .select(
      `id, title, description, listing_type, price_eur,
       sqm, rooms, bathrooms, floor, has_elevator, has_garage,
       energy_class, amenities, address, city, postal_code,
       region, photos, slug, created_at`
    )
    .eq("slug", propertySlug)
    .eq("agency_id", agency.id)
    .eq("is_public", true)
    .maybeSingle();

  if (!property) notFound();

  const photos = (property.photos ?? []).map(getPropertyPhotoUrl);
  const amenities: string[] = Array.isArray(property.amenities)
    ? property.amenities
    : [];

  const location = [property.address, property.city, property.region]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* ── Breadcrumb ─────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-[var(--fg-muted)] mb-6">
        <Link href={`/${agencySlug}`} className="hover:text-[var(--fg-primary)] transition-colors">
          {agency.name}
        </Link>
        <span>/</span>
        <Link href={`/${agencySlug}/immobili`} className="hover:text-[var(--fg-primary)] transition-colors">
          Immobili
        </Link>
        <span>/</span>
        <span className="text-[var(--fg-secondary)] truncate max-w-[200px]">{property.title}</span>
      </nav>

      <div className="grid md:grid-cols-[1fr_340px] gap-10">

        {/* ── Colonna sinistra ───────────────────────────────────── */}
        <div>

          {/* Foto principale */}
          {photos[0] && (
            <div className="aspect-[16/9] relative overflow-hidden rounded-sm mb-2">
              <div className="absolute top-3 left-3 z-10">
                <span className="px-3 py-1 text-xs font-medium bg-[var(--bg-canvas)]/90 text-[var(--fg-primary)] rounded-sm backdrop-blur-sm">
                  {property.listing_type === "rent" ? "Affitto" : "Vendita"}
                </span>
              </div>
              <Image
                src={photos[0]}
                alt={property.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
              />
            </div>
          )}

          {/* Gallery secondaria */}
          {photos.length > 1 && (
            <div className="grid grid-cols-3 gap-2 mb-8">
              {photos.slice(1, 4).map((url: string, i: number) => (
                <div key={i} className="aspect-[4/3] relative overflow-hidden rounded-sm">
                  <Image
                    src={url}
                    alt={`${property.title} — foto ${i + 2}`}
                    fill
                    className="object-cover"
                    sizes="20vw"
                  />
                  {/* Overlay "altre foto" sull'ultima */}
                  {i === 2 && photos.length > 4 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        +{photos.length - 4} foto
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Prezzo + titolo */}
          <div className="mb-6">
            <p className="font-display text-4xl text-[var(--fg-primary)] mb-1">
              {formatPrice(property.price_eur, property.listing_type)}
            </p>
            <h1 className="font-display text-2xl text-[var(--fg-primary)] mb-1">
              {property.title}
            </h1>
            {location && (
              <p className="text-sm text-[var(--fg-secondary)]">{location}</p>
            )}
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
            {property.sqm && <FeaturePill label="Superficie" value={`${property.sqm} m²`} />}
            {property.rooms && <FeaturePill label="Camere" value={String(property.rooms)} />}
            {property.bathrooms && <FeaturePill label="Bagni" value={String(property.bathrooms)} />}
            {property.floor !== null && property.floor !== undefined && (
              <FeaturePill label="Piano" value={property.floor === 0 ? "Terra" : String(property.floor)} />
            )}
            {property.has_elevator && <FeaturePill label="Ascensore" value="Presente" />}
            {property.has_garage && <FeaturePill label="Garage" value="Incluso" />}
            {property.energy_class && <FeaturePill label="Classe energetica" value={property.energy_class} />}
          </div>

          {/* Descrizione */}
          {property.description && (
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
                Descrizione
              </p>
              <p className="text-sm leading-relaxed text-[var(--fg-secondary)] whitespace-pre-line">
                {property.description}
              </p>
            </div>
          )}

          {/* Caratteristiche */}
          {amenities.length > 0 && (
            <div className="mb-8">
              <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
                Caratteristiche
              </p>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a) => (
                  <span
                    key={a}
                    className="px-3 py-1 text-xs border border-[var(--border-subtle)] rounded-full text-[var(--fg-secondary)]"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Colonna destra — contatti ──────────────────────────── */}
        <div className="md:sticky md:top-24 self-start">
          <div className="rounded-sm border border-[var(--border-subtle)] p-6">
            <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-1">
              Richiedi informazioni
            </p>
            <p className="font-display text-xl text-[var(--fg-primary)] mb-5">
              {agency.name}
            </p>
            <LeadForm
              agencyId={agency.id}
              propertyId={property.id}
              propertyTitle={property.title}
            />
          </div>

          {agency.phone && (
            <a
              href={`tel:${agency.phone}`}
              className="flex items-center justify-center gap-2 mt-4 w-full px-6 py-3 border border-[var(--border-subtle)] rounded-sm text-sm font-medium hover:bg-[var(--bg-elevated)] transition-colors"
            >
              ☎ {agency.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
