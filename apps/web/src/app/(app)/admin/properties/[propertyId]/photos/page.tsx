import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PropertyPhotosManager } from "@/components/admin/property-photos-manager";
import { RenovationWizard } from "@/components/renovation/renovation-wizard";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Gestione foto · Habiquo",
};

type Params = Promise<{ propertyId: string }>;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export default async function PropertyPhotosPage({
  params,
}: {
  params: Params;
}) {
  const { propertyId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: property } = await supabase
    .from("properties")
    .select(
      "id, agency_id, title, city, listing_type, slug, is_public, photos",
    )
    .eq("id", propertyId)
    .maybeSingle();

  if (!property) notFound();

  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", property.agency_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    !membership ||
    !WRITE_ROLES.includes(
      membership.role as (typeof WRITE_ROLES)[number],
    )
  ) {
    notFound();
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("slug, is_public")
    .eq("id", property.agency_id)
    .maybeSingle();

  const publicUrl =
    agency?.is_public && agency.slug && property.slug && property.is_public
      ? `/${agency.slug}/immobili/${property.slug}`
      : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-10">
        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">
          <Link
            href="/admin/properties"
            className="hover:text-neutral-700 transition-colors"
          >
            ← Foto immobili
          </Link>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {property.title}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {property.listing_type === "rent" ? "Affitto" : "Vendita"} ·{" "}
          {property.city}
        </p>
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block text-xs underline text-neutral-700 hover:text-neutral-900"
          >
            Apri pagina pubblica ↗
          </a>
        )}
      </header>

      <PropertyPhotosManager
        propertyId={property.id}
        initialPhotos={property.photos ?? []}
      />

      {/* ── Valorizza Casa AI ──────────────────────────────────── */}
      <section className="mt-16">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
            Valorizza Casa AI
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Carica una foto di una stanza e genera una versione valorizzata con intelligenza artificiale.
          </p>
        </div>
        <RenovationWizard propertyId={property.id} />
      </section>
    </div>
  );
}
