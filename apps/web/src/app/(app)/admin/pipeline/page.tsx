import { PipelineStagesEditor } from "@/components/funnel/PipelineStagesEditor";
import { getPipelineStagesForAgency } from "@/lib/queries/pipeline-stages";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Configurazione Pipeline · Habiquo",
};

async function loadData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { kind: "unauthenticated" as const };

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id)
    .in("role", ["owner", "admin"])
    .limit(1)
    .single();

  if (!membership) return { kind: "forbidden" as const };

  const stages = await getPipelineStagesForAgency(membership.agency_id);
  if (!stages) return { kind: "error" as const };

  return { kind: "ok" as const, stages, agencyId: membership.agency_id };
}

export default async function AdminPipelinePage() {
  const result = await loadData();

  if (result.kind === "unauthenticated") {
    redirect("/login");
  }

  if (result.kind === "forbidden") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="font-medium">Accesso limitato</div>
          <div className="mt-1 text-xs">Solo owner e admin possono configurare la pipeline.</div>
        </div>
      </div>
    );
  }

  if (result.kind === "error") {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          Errore nel caricamento degli stage. Ricarica la pagina.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)] mb-2">
          Impostazioni Pipeline
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">Configura la tua pipeline</h1>
        <p className="mt-2 text-sm text-[var(--fg-muted)] max-w-xl">
          Rinomina gli stage, cambia i colori e riordinali trascinandoli. Gli stage di sistema non
          possono essere eliminati. Puoi aggiungere stage personalizzati.
        </p>
      </header>

      <PipelineStagesEditor initialStages={result.stages} />
    </div>
  );
}
