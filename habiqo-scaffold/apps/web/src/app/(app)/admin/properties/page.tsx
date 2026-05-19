import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getPropertyPhotoUrl } from "@/lib/storage/property-photos";

export const metadata = {
  title: "Immobili · Habiquo",
};

type PropertyRow = {
  id: string;
  title: string;
  city: string;
  listingType: "sale" | "rent";
  priceEur: number;
  photos: string[];
  slug: string | null;
  isPublic: boolean;
  agencyName: string;
};

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

async function loadProperties(): Promise<PropertyRow[] | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: memberships } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id)
    .in("role", WRITE_ROLES as unknown as string[]);

  if (!memberships || memberships.length === 0) return [];

  const agencyIds = memberships.map((m) => m.agency_id);

  const [propertiesQuery, agenciesQuery] = await Promise.all([
    supabase
      .from("properties")
      .select(
        "id, title, city, listing_type, price_eur, photos, slug, is_public, agency_id",
      )
      .in("agency_id", agencyIds)
      .order("created_at", { ascending: false }),
    supabase.from("agencies").select("id, name").in("id", agencyIds),
  ]);

  if (!propertiesQuery.data) return [];

  const agencyNameById = new Map(
    (agenciesQuery.data ?? []).map((a) => [a.id, a.name]),
  );

  return propertiesQuery.data.map((p) => ({
    id: p.id,
    title: p.title,
    city: p.city,
    listingType: p.listing_type,
    priceEur: p.price_eur,
    photos: p.photos ?? [],
    slug: p.slug,
    isPublic: p.is_public,
    agencyName: agencyNameById.get(p.agency_id) ?? "—",
  }));
}

function formatPrice(value: number, type: "sale" | "rent"): string {
  const formatted = new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
  return type === "rent" ? `${formatted}/mese` : formatted;
}

export default async function AdminPropertiesPage() {
  const properties = await loadProperties();

  if (properties === null) {
    redirect("/");
  }

  if (properties.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <header className="mb-10">
          <div className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
            Habiquo Studio
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 mb-6">
            Immobili
          </h1>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/properties/new-ai"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              ✦ Crea con AI
            </Link>
            <Link
              href="/admin/properties/new-ai"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-200 text-neutral-700 rounded-md text-sm font-medium hover:border-neutral-400 transition-colors"
            >
              Creazione classica
            </Link>
          </div>
        </header>
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
          <p className="text-sm text-neutral-500 mb-4">
            Nessun immobile ancora. Crea il tuo primo annuncio in pochi minuti.
          </p>
          <Link
            href="/admin/properties/new-ai"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            ✦ Crea con AI
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
      <header className="mb-8 sm:mb-10">
        <div className="text-xs uppercase tracking-widest text-neutral-400 mb-2">
          Habiquo Studio
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900">
              Immobili
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {properties.length}{" "}
              {properties.length === 1 ? "immobile" : "immobili"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/properties/new-ai"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
            >
              ✦ Crea con AI
            </Link>
            <Link
              href="/admin/properties/new-ai"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-neutral-200 text-neutral-700 rounded-md text-sm font-medium hover:border-neutral-400 transition-colors"
            >
              Creazione classica
            </Link>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        {properties.map((p) => {
          const coverPath = p.photos[0];
          const photoCount = p.photos.length;
          return (
            <Link
              key={p.id}
              href={`/admin/properties/${p.id}/photos`}
              className="block rounded-md border border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm transition overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-4 p-4">
                {/* Cover thumbnail */}
                <div className="shrink-0 w-full aspect-[16/9] md:w-24 md:h-24 md:aspect-auto rounded overflow-hidden bg-neutral-100">
                  {coverPath ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getPropertyPhotoUrl(coverPath)}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-wider text-neutral-400">
                      Nessuna foto
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col md:justify-center">
                  <div className="text-[10px] uppercase tracking-wider text-neutral-500">
                    {p.listingType === "rent" ? "Affitto" : "Vendita"} ·{" "}
                    {p.city}
                  </div>
                  <div className="mt-0.5 text-base font-medium text-neutral-900 truncate">
                    {p.title}
                  </div>
                  <div className="mt-1 text-sm text-neutral-700">
                    {formatPrice(p.priceEur, p.listingType)}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
                    <span className="truncate max-w-full">{p.agencyName}</span>
                    <span aria-hidden>·</span>
                    <span>
                      {photoCount} {photoCount === 1 ? "foto" : "foto"}
                    </span>
                    {p.isPublic ? (
                      <>
                        <span aria-hidden>·</span>
                        <span className="text-emerald-700">Pubblicato</span>
                      </>
                    ) : (
                      <>
                        <span aria-hidden>·</span>
                        <span>Bozza</span>
                      </>
                    )}
                  </div>
                  <div className="md:hidden mt-3 text-sm text-neutral-500">
                    Gestisci →
                  </div>
                </div>

                {/* Desktop CTA */}
                <div className="hidden md:flex items-center text-sm text-neutral-500 pl-3">
                  Gestisci →
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
