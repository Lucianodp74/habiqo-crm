import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getPropertyPhotoUrl } from "@/lib/storage/property-photos";

export const metadata = {
  title: "Foto immobili · Habiquo",
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

  // Agencies where the user has write access (owner/admin/agent).
  const { data: memberships } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id)
    .in("role", WRITE_ROLES as unknown as string[]);

  if (!memberships || memberships.length === 0) return [];

  const agencyIds = memberships.map((m) => m.agency_id);

  // Two parallel queries instead of a nested join — cleaner typing
  // under strict TS, and roughly the same latency.
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
        <header className="mb-8">
          <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">
            Impostazioni agenzia
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Foto immobili
          </h1>
        </header>
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-6 text-sm text-neutral-700">
          Nessun immobile trovato nelle agenzie di cui sei membro.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
      <header className="mb-8 sm:mb-10">
        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">
          Impostazioni agenzia
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Foto immobili</h1>
        <p className="mt-2 text-sm text-neutral-600 max-w-xl">
          Gestisci le foto degli immobili. La prima foto è la cover usata nelle
          card del sito pubblico.
        </p>
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
              {/* Layout container:
                   - Mobile (<md): vertical card (image on top, info + CTA below)
                   - Desktop (md+): horizontal row (thumb left, info center, CTA right)
                   No data or behavior changes — only Tailwind responsive classes. */}
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

                  {/* Mobile-only CTA — appears inline at the bottom of the
                       info column so it stays inside the card flow. */}
                  <div className="md:hidden mt-3 text-sm text-neutral-500">
                    Gestisci →
                  </div>
                </div>

                {/* Desktop-only CTA — right-aligned trailing column. */}
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
