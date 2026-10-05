import type { LeadSellerRequest } from "@/lib/queries/lead-seller-requests";

const TYPE_LABEL: Record<string, string> = {
  apartment: "Appartamento",
  villa: "Villa / Casa",
  office: "Ufficio",
  commercial: "Commerciale",
  land: "Terreno",
};

const CONDITION_LABEL: Record<string, string> = {
  to_renovate: "Da ristrutturare",
  good: "Buono stato",
  excellent: "Ottimo stato",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[var(--fg-muted)] text-[11px] font-mono uppercase tracking-wide mb-1.5">
        {label}
      </dt>
      <dd className="text-[var(--fg-primary)]">{value}</dd>
    </div>
  );
}

/**
 * Riquadro "Immobile da vendere": mostra i dettagli delle richieste di
 * vendita arrivate dal sito. Non renderizza nulla se il lead non ne ha.
 */
export function LeadSellerRequests({ requests }: { requests: LeadSellerRequest[] }) {
  if (requests.length === 0) return null;

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="font-display text-[20px] text-[var(--fg-primary)]">Immobile da vendere</h2>
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-sunken)] px-2.5 py-0.5 text-[11px] text-[var(--fg-secondary)]">
          Proprietario
        </span>
      </div>

      <div className="space-y-6">
        {requests.map((r) => (
          <div
            key={r.id}
            className="border-b border-[var(--border-subtle)] pb-6 last:border-0 last:pb-0"
          >
            <p className="text-[11px] text-[var(--fg-muted)] mb-3">
              Richiesta del {formatDate(r.createdAt)} dal sito
              {r.consentMarketing ? " · consenso marketing dato" : " · nessun consenso marketing"}
            </p>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-[13px]">
              <Field label="Tipologia" value={TYPE_LABEL[r.propertyType] ?? r.propertyType} />
              <Field label="Zona" value={[r.city, r.area].filter(Boolean).join(" · ")} />
              {r.sqm != null && <Field label="Superficie" value={`${r.sqm} mq`} />}
              {r.rooms != null && <Field label="Locali" value={String(r.rooms)} />}
              {r.bathrooms != null && <Field label="Bagni" value={String(r.bathrooms)} />}
              {r.floor != null && <Field label="Piano" value={String(r.floor)} />}
              {r.condition && (
                <Field label="Stato" value={CONDITION_LABEL[r.condition] ?? r.condition} />
              )}
            </dl>
            {r.notes && (
              <p className="mt-4 text-[13px] text-[var(--fg-secondary)] whitespace-pre-wrap">
                {r.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
