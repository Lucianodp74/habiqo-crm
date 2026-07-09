import Image from "next/image";
import Link from "next/link";
import { getAnonClient } from "@/lib/habita/supabase-anon";
import { getAgencyBySlug } from "@/lib/habita/tenant";
import { getPropertyPhotoUrl } from "@/lib/storage/property-photos";
import { notFound } from "next/navigation";

type Params = Promise<{ agencySlug: string }>;
type SearchParams = Promise<{ tipo?: string; citta?: string }>;

export default async function ImmobiliListPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { agencySlug } = await params;
  const { tipo, citta } = await searchParams;

  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) notFound();

  const supabase = getAnonClient();

  let query = supabase
    .from("properties")
    .select("id, title, price_eur, city, sqm, rooms, photos, listing_type, slug")
    .eq("agency_id", agency.id)
    .eq("status", "active")
    .eq("is_public", true)
    .neq("slug", "hero-image-placeholder")
    .order("created_at", { ascending: false });

  if (tipo === "sale") query = query.eq("listing_type", "sale");
  if (tipo === "rent") query = query.eq("listing_type", "rent");

  const { data: properties } = await query;
  const list = properties ?? [];

  function formatPrice(price: number, listingType: string): string {
    const formatted = new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(price);
    return listingType === "rent" ? `${formatted}/mese` : formatted;
  }

  const filtered = citta
    ? list.filter((p) =>
        p.city?.toLowerCase().includes(citta.toLowerCase())
      )
    : list;

  return (
    <div className="w-full px-8 md:px-16 py-10 max-w-7xl">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-2">
          Immobili
        </p>
        <h1 className="font-display text-4xl text-[var(--fg-primary)] mb-1">
          {tipo === "sale" ? "In vendita" : tipo === "rent" ? "In affitto" : "Tutti gli immobili"}
        </h1>
        {/* Filtro sedi */}
        <div className="flex flex-wrap gap-2 mt-4 mb-2">
          {[
            { label: "Tutte le sedi", value: undefined as string | undefined },
            { label: "San Giorgio Ionico", value: "San Giorgio Ionico" },
            { label: "Taranto", value: "Taranto" },
          ].map(({ label, value }) => (
            <Link
              key={label}
              href={
                value
                  ? `/${agencySlug}/immobili?${tipo ? `tipo=${tipo}&` : ""}citta=${encodeURIComponent(value)}`
                  : `/${agencySlug}/immobili${tipo ? `?tipo=${tipo}` : ""}`
              }
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                citta === value || (!citta && !value)
                  ? "bg-[var(--fg-primary)] text-[var(--bg-canvas)] border-[var(--fg-primary)]"
                  : "bg-transparent text-[var(--fg-secondary)] border-[var(--border-subtle)] hover:border-[var(--fg-primary)] hover:text-[var(--fg-primary)]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <p className="text-sm text-[var(--fg-secondary)]">
          {filtered.length} {filtered.length === 1 ? "immobile" : "immobili"}
          {citta ? ` a ${citta}` : ""}
        </p>
      </header>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-lg text-[var(--fg-secondary)] mb-4">
            Nessun immobile trovato.
          </p>
          <Link
            href={`/${agencySlug}/immobili`}
            className="text-sm text-[var(--accent-deep)] underline underline-offset-4"
          >
            Vedi tutti gli immobili
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {filtered.map((property) => {
            const photoUrl = property.photos?.[0]
              ? getPropertyPhotoUrl(property.photos[0])
              : null;
            return (
              <Link
                key={property.id}
                href={`/${agencySlug}/immobili/${property.slug}`}
                className="group block"
              >
                <div className="aspect-[4/3] relative overflow-hidden rounded-sm bg-[var(--bg-canvas)] mb-3 border border-[var(--border-subtle)]">
                  <div className="absolute top-2 left-2 z-10">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-[var(--bg-canvas)]/90 text-[var(--fg-primary)] rounded-sm backdrop-blur-sm">
                      {property.listing_type === "rent" ? "Affitto" : "Vendita"}
                    </span>
                  </div>
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt={property.title}
                      fill
                      className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
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
                  {property.city}
                  {property.sqm ? ` · ${property.sqm} m²` : ""}
                  {property.rooms ? ` · ${property.rooms} cam.` : ""}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
