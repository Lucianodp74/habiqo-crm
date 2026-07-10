import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

interface Props {
  leadId: string;
}

const VISIT_TYPE_LABELS: Record<string, string> = {
  visita: "Visita",
  telefonata: "Telefonata",
  whatsapp: "WhatsApp",
  email: "Email",
  proposta: "Proposta",
  altro: "Altro",
};

const OUTCOME_LABELS: Record<string, string> = {
  interested: "Interessato",
  not_interested: "Non interessato",
  offer_made: "Offerta fatta",
  second_visit: "Seconda visita",
};

export async function LeadVisitedProperties({ leadId }: Props) {
  const supabase = await createClient();

  const { data: visits } = await supabase
    .from("property_visits")
    .select(`
      id, visit_date, visit_time, visit_type, outcome, notes,
      properties(id, title, city, slug, price_eur, listing_type, photos)
    `)
    .eq("lead_id", leadId)
    .order("visit_date", { ascending: false });

  if (!visits || visits.length === 0) return null;

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6 transition-shadow duration-300 hover:shadow-[0_14px_44px_-24px_rgba(24,20,16,0.18)] animate-in-card">
      <h2 className="font-display text-[20px] text-[var(--fg-primary)] mb-4">
        Immobili visitati ({visits.length})
      </h2>
      <div className="space-y-3">
        {visits.map((v) => {
          const property = v.properties as any;
          return (
            <div key={v.id} className="flex items-start gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3">
              {property?.photos?.[0] && (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-photos/${property.photos[0]}`}
                  alt=""
                  className="size-14 rounded-md object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-medium uppercase tracking-wider bg-[var(--bg-sunken)] text-[var(--fg-secondary)] px-2 py-0.5 rounded-full">
                    {VISIT_TYPE_LABELS[v.visit_type] ?? v.visit_type}
                  </span>
                  <span className="text-[10px] text-[var(--fg-muted)]">
                    {OUTCOME_LABELS[v.outcome] ?? v.outcome}
                  </span>
                </div>
                {property && (
                  <Link
                    href={`/admin/properties/${property.id}/photos`}
                    className="text-sm font-medium text-[var(--fg-primary)] hover:underline truncate block"
                  >
                    {property.title}
                  </Link>
                )}
                <p className="text-xs text-[var(--fg-secondary)]">
                  {property?.city} ·{" "}
                  {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(property?.price_eur ?? 0)}
                </p>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">
                  {new Date(v.visit_date).toLocaleDateString("it-IT")}
                  {v.visit_time && ` ore ${String(v.visit_time).slice(0, 5)}`}
                  {v.notes && ` · ${v.notes}`}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}