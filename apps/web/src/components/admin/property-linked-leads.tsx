import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface Props {
  propertyId: string;
}

export async function PropertyLinkedLeads({ propertyId }: Props) {
  const supabase = await createClient();

  const { data: leads } = await supabase
    .from("leads")
    .select("id, full_name, phone, email, status, created_at")
    .eq("source_property_id", propertyId)
    .order("created_at", { ascending: false });

  if (!leads || leads.length === 0) return null;

  const statusLabel: Record<string, string> = {
    new: "Nuovo",
    qualified: "Qualificato",
    visit_scheduled: "Visita",
    in_negotiation: "Trattativa",
    won: "Vinto",
    lost: "Perso",
  };

  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold tracking-tight text-neutral-900 mb-4">
        Lead collegati ({leads.length})
      </h2>
      <div className="space-y-2">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/crm/leads/${lead.id}`}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 hover:border-neutral-400 transition-colors"
          >
            <div>
              <p className="text-sm font-medium text-neutral-900">{lead.full_name}</p>
              <p className="text-xs text-neutral-500">
                {lead.phone ?? lead.email ?? "Nessun contatto"}
              </p>
            </div>
            <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full">
              {statusLabel[lead.status] ?? lead.status}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}