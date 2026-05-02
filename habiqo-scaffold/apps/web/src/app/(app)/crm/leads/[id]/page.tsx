import { notFound } from "next/navigation";
import { LeadStatusSelect } from "@/components/lead-status-select";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LeadDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (!lead) {
    notFound();
  }

  return (
    <div className="px-8 py-8 max-w-5xl">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">
          Lead Profile
        </p>

        <h1 className="text-5xl font-serif">
          {lead.full_name}
        </h1>

        <div className="mt-4">
          <label className="text-sm text-neutral-500 block mb-2" htmlFor="lead-status">
            Stato lead
          </label>
          <LeadStatusSelect leadId={lead.id} currentStatus={lead.status} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">

        <section className="col-span-2 rounded-2xl border p-6 bg-white">
          <h2 className="text-xl mb-6 font-semibold">
            Informazioni cliente
          </h2>

          <div className="space-y-4">

            <div>
              <p className="text-sm text-neutral-500">
                Email
              </p>

              <p className="text-lg">
                {lead.email || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">
                Telefono
              </p>

              <p className="text-lg">
                {lead.phone || "—"}
              </p>
            </div>

            <div>
              <p className="text-sm text-neutral-500">
                Budget
              </p>

              <p className="text-lg">
                {lead.budget_min || 0}€ - {lead.budget_max || 0}€
              </p>
            </div>

          </div>
        </section>

        <section className="rounded-2xl border p-6 bg-white">
          <h2 className="text-xl mb-4 font-semibold">
            AI Insight
          </h2>

          <div className="space-y-3">

            <div className="rounded-xl bg-neutral-100 p-4">
              Cliente interessato ad appartamenti luxury.
            </div>

            <div className="rounded-xl bg-neutral-100 p-4">
              Alta probabilità conversione.
            </div>

          </div>
        </section>
        <section className="col-span-2 rounded-2xl border p-6 bg-white mt-6">
  <h2 className="text-xl mb-6 font-semibold">
    Timeline attività
  </h2>

  <div className="space-y-4">

    <div className="border-l-2 pl-4 py-1">
      <p className="font-medium">
        Chiamata iniziale
      </p>

      <p className="text-sm text-neutral-500">
        Cliente interessato a trilocale in centro.
      </p>

      <p className="text-xs text-neutral-400 mt-1">
        2 ore fa
      </p>
    </div>

    <div className="border-l-2 pl-4 py-1">
      <p className="font-medium">
        Invio proposta
      </p>

      <p className="text-sm text-neutral-500">
        Inviata brochure PDF via email.
      </p>

      <p className="text-xs text-neutral-400 mt-1">
        ieri
      </p>
    </div>

  </div>
</section>

      </div>
    </div>
  );
}