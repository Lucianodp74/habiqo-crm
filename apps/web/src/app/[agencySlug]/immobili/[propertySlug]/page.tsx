import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnonClient } from "@/lib/habita/supabase-anon";
import { getAgencyBySlug } from "@/lib/habita/tenant";
import { getPropertyPhotoUrl } from "@/lib/storage/property-photos";
import { LeadForm } from "@/components/habita/lead-form";
import { PropertyPhotoLightbox } from "@/components/habita/property-photo-lightbox";

type Params = Promise<{ agencySlug: string; propertySlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { agencySlug, propertySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  const supabase = getAnonClient();
  const { data } = await supabase
    .from("properties")
    .select("title, seo_title, description")
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

function formatWhatsApp(phone: string | null, title: string): string | null {
  if (!phone) return null;
  const clean = phone.replace(/\D/g, "");
  const number = clean.startsWith("39") ? clean : `39${clean}`;
  const text = encodeURIComponent(
    `Buongiorno, sono interessato all'immobile: ${title}. Posso avere maggiori informazioni?`
  );
  return `https://wa.me/${number}?text=${text}`;
}

function FeaturePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-elevated)]">
      <p className="text-[9px] uppercase tracking-widest text-[var(--fg-muted)] mb-0.5">{label}</p>
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

  // Immobili simili
  const { data: related } = await supabase
    .from("properties")
    .select("id, title, price_eur, city, sqm, rooms, photos, listing_type, slug")
    .eq("agency_id", agency.id)
    .eq("status", "active")
    .eq("is_public", true)
    .neq("id", property.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const photos = (property.photos ?? []).map(getPropertyPhotoUrl);
  const amenities: string[] = Array.isArray(property.amenities) ? property.amenities : [];
  const location = [property.address, property.city, property.region].filter(Boolean).join(", ");
  const whatsappUrl = formatWhatsApp(agency.phone, property.title);

  return (
    <>
      {/* ── Sticky bottom bar mobile ──────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--bg-canvas)] border-t border-[var(--border-subtle)] px-4 py-3 flex gap-3">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-md text-sm font-medium"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        )}
        {agency.phone && (
          <a
            href={`tel:${agency.phone}`}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-md text-sm font-medium"
          >
            ☎ Chiama
          </a>
        )}
      </div>

      {/* ── Contenuto principale ──────────────────────────────── */}
      <div className="pb-20 md:pb-0">

        {/* Breadcrumb */}
        <div className="w-full px-8 md:px-16 pt-6 pb-4">
          <nav className="flex items-center gap-2 text-xs text-[var(--fg-muted)]">
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
        </div>

        {/* Foto principale */}
        {photos[0] && (
          <div className="w-full px-8 md:px-16 mb-2">
            <div
              className="aspect-[16/9] relative overflow-hidden rounded-sm cursor-pointer"
              data-photo-index="0"
            >
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
                sizes="100vw"
              />
            </div>
          </div>
        )}

        {/* Gallery thumbnails */}
        {photos.length > 1 && (
          <div className="w-full px-8 md:px-16 mb-8">
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {photos.slice(1, 5).map((url: string, i: number) => (
                <div
                  key={i}
                  className="aspect-[4/3] relative overflow-hidden rounded-sm cursor-pointer"
                  data-photo-index={i + 1}
                >
                  <Image
                    src={url}
                    alt={`${property.title} — foto ${i + 2}`}
                    fill
                    className="object-cover"
                    sizes="25vw"
                  />
                  {i === 3 && photos.length > 5 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">+{photos.length - 5}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <PropertyPhotoLightbox photos={photos} alt={property.title} />

        {/* Layout 2 colonne */}
        <div className="w-full px-8 md:px-16">
          <div className="grid md:grid-cols-[1fr_360px] gap-12">

            {/* ── Sinistra ─────────────────────────────────────── */}
            <div>
              {/* Prezzo + Titolo */}
              <div className="mb-6">
                <p className="font-display text-4xl md:text-5xl text-[var(--fg-primary)] mb-2">
                  {formatPrice(property.price_eur, property.listing_type)}
                </p>
                <h1 className="font-display text-2xl md:text-3xl text-[var(--fg-primary)] mb-1">
                  {property.title}
                </h1>
                {location && (
                  <p className="text-sm text-[var(--fg-secondary)]">{location}</p>
                )}
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8">
                {property.sqm && <FeaturePill label="Superficie" value={`${property.sqm} m²`} />}
                {property.rooms && <FeaturePill label="Camere" value={String(property.rooms)} />}
                {property.bathrooms && <FeaturePill label="Bagni" value={String(property.bathrooms)} />}
                {property.floor !== null && property.floor !== undefined && (
                  <FeaturePill label="Piano" value={property.floor === 0 ? "Terra" : String(property.floor)} />
                )}
                {property.has_elevator && <FeaturePill label="Ascensore" value="Presente" />}
                {property.has_garage && <FeaturePill label="Garage" value="Incluso" />}
                {property.energy_class && <FeaturePill label="Classe en." value={property.energy_class} />}
              </div>

              {/* Descrizione */}
              {property.description && (
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-4">
                    Descrizione
                  </p>
                  <div className="prose prose-sm max-w-none">
                    {property.description.split("\n\n").map((para: string, i: number) => (
                      <p key={i} className="text-sm leading-relaxed text-[var(--fg-secondary)] mb-4 last:mb-0">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Caratteristiche */}
              {amenities.length > 0 && (
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-4">
                    Caratteristiche
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {amenities.map((a: string) => (
                      <span key={a} className="px-3 py-1 text-xs border border-[var(--border-subtle)] rounded-full text-[var(--fg-secondary)]">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Destra — contatti ────────────────────────────── */}
            <div className="md:sticky md:top-24 self-start space-y-4">

              {/* CTA rapide desktop */}
              <div className="hidden md:grid grid-cols-2 gap-3">
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
                {agency.phone && (
                  <a
                    href={`tel:${agency.phone}`}
                    className="flex items-center justify-center gap-2 py-3 border border-[var(--border-subtle)] rounded-md text-sm font-medium hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    ☎ {agency.phone}
                  </a>
                )}
              </div>

              {/* Form contatto */}
              <div className="rounded-sm border border-[var(--border-subtle)] p-5">
                <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-1">
                  Richiedi informazioni
                </p>
                <p className="font-display text-lg text-[var(--fg-primary)] mb-4">
                  {agency.name}
                </p>
                <LeadForm
                  agencyId={agency.id}
                  propertyId={property.id}
                  propertyTitle={property.title}
                />
              </div>

              {/* Trust signals */}
              <div className="rounded-sm border border-[var(--border-subtle)] p-4 space-y-2">
                {[
                  "✓ Risposta entro 24 ore",
                  "✓ Contatto diretto con l'agente",
                  "✓ Nessun call center",
                  "✓ Agenzia indipendente locale",
                ].map((s) => (
                  <p key={s} className="text-xs text-[var(--fg-secondary)]">{s}</p>
                ))}
              </div>
            </div>
          </div>

          {/* ── Immobili simili ──────────────────────────────────── */}
          {related && related.length > 0 && (
            <div className="mt-16 pb-8">
              <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-2">
                Potrebbero interessarti
              </p>
              <h2 className="font-display text-2xl text-[var(--fg-primary)] mb-8">
                Immobili simili
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {related.map((p) => {
                  const photoUrl = p.photos?.[0] ? getPropertyPhotoUrl(p.photos[0]) : null;
                  return (
                    <Link
                      key={p.id}
                      href={`/${agencySlug}/immobili/${p.slug}`}
                      className="group block"
                    >
                      <div className="aspect-[4/3] relative overflow-hidden rounded-sm bg-[var(--bg-canvas)] mb-3 border border-[var(--border-subtle)]">
                        <div className="absolute top-2 left-2 z-10">
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--bg-canvas)]/90 text-[var(--fg-primary)] rounded-sm backdrop-blur-sm">
                            {p.listing_type === "rent" ? "Affitto" : "Vendita"}
                          </span>
                        </div>
                        {photoUrl ? (
                          <Image
                            src={photoUrl}
                            alt={p.title}
                            fill
                            className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                            sizes="33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-xs text-[var(--fg-secondary)] opacity-40">Foto</span>
                          </div>
                        )}
                      </div>
                      <p className="font-display text-lg text-[var(--fg-primary)] mb-0.5">
                        {formatPrice(p.price_eur, p.listing_type)}
                      </p>
                      <p className="text-xs text-[var(--fg-secondary)]">
                        {p.city}{p.sqm ? ` · ${p.sqm} m²` : ""}{p.rooms ? ` · ${p.rooms} cam.` : ""}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
