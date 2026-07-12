import { redirect } from "next/navigation";

import {
  AgencyPublicForm,
  type AgencyPublicFormInitial,
} from "@/components/admin/agency-public-form";
import { AgencyCoverPhotoManager } from "@/components/admin/agency-cover-photo-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Sito pubblico · Habiquo",
};

type LoadResult =
  | { kind: "ok"; agency: AgencyPublicFormInitial; coverImagePath: string | null }
  | { kind: "unauthenticated" }
  | { kind: "no_agency" }
  | { kind: "forbidden" };

async function loadAgencyForAdmin(): Promise<LoadResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { kind: "unauthenticated" };
  }

  // First owner/admin membership for this user. Single-agency assumption for now;
  // when multi-agency UX lands we add an agency selector.
  const { data: memberships } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .limit(1);

    const firstMembership = memberships?.[0];

    if (!firstMembership) {
      // User is logged in but has no owner/admin role on any agency.
      // Could be a viewer/agent, or have no memberships at all.
      const { count } = await supabase
        .from("agency_members")
        .select("agency_id", { count: "exact", head: true })
        .eq("user_id", user.id);
  
      return { kind: count && count > 0 ? "forbidden" : "no_agency" };
    }
  
    const agencyId = firstMembership.agency_id;

  const { data: agency } = await supabase
    .from("agencies")
    .select("id, name, slug, is_public, tagline, description, city, region, phone, cover_image_path")
    .eq("id", agencyId)
    .single();

  if (!agency) {
    return { kind: "no_agency" };
  }

  return {
    kind: "ok",
    agency: {
      id: agency.id,
      name: agency.name,
      isPublic: agency.is_public,
      slug: agency.slug,
      tagline: agency.tagline,
      description: agency.description,
      city: agency.city,
      region: agency.region,
      phone: agency.phone,
    },
    coverImagePath: agency.cover_image_path,
  };
}

export default async function AdminAgencyPage() {
  const result = await loadAgencyForAdmin();

  if (result.kind === "unauthenticated") {
    redirect("/");
  }

  if (result.kind === "forbidden") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">
            Impostazioni agenzia
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sito pubblico</h1>
        </header>
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="font-medium">Accesso limitato</div>
          <div className="mt-1 text-xs">
            Solo owner e admin di un'agenzia possono gestire le impostazioni
            pubbliche. Se pensi sia un errore, contatta l'owner della tua agenzia.
          </div>
        </div>
      </div>
    );
  }

  if (result.kind === "no_agency") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="mb-8">
          <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">
            Impostazioni agenzia
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sito pubblico</h1>
        </header>
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          Non sei ancora associato a un'agenzia.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-10">
        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">
          Impostazioni agenzia
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Sito pubblico</h1>
        <p className="mt-2 text-sm text-neutral-600 max-w-xl">
          Gestisci la presenza online di {result.agency.name} su Habita. Modifiche
          a tagline e dati di contatto sono visibili immediatamente sul sito pubblico.
        </p>
      </header>

      <div className="space-y-12">
        <AgencyCoverPhotoManager
          agencyId={result.agency.id}
          initialCoverImagePath={result.coverImagePath}
        />

        <div className="border-t border-neutral-200 pt-10">
          <AgencyPublicForm agency={result.agency} />
        </div>
      </div>
    </div>
  );
}
