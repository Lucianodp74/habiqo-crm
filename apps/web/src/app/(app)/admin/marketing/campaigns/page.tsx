import { listCampaignsForAgency } from "@/lib/actions/list-campaigns";
import Link from "next/link";

export const metadata = { title: "Campagne WhatsApp · Habiquo" };

const STATUS_LABEL: Record<string, string> = {
  draft: "Bozza",
  scheduled: "Programmata",
  sending: "Invio in corso",
  completed: "Completata",
  failed: "Fallita",
  cancelled: "Annullata",
};

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-700 border-neutral-200",
  scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  sending: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CampaignsPage() {
  const campaigns = await listCampaignsForAgency();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-[26px] text-[var(--fg-primary)]">
            Marketing · Campagne WhatsApp
          </h1>
          <p className="text-[13px] text-[var(--fg-muted)] mt-1">
            Invia comunicazioni broadcast ai tuoi contatti via WhatsApp.
          </p>
        </div>
        <Link
          href="/admin/marketing/campaigns/new"
          className="rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[var(--fg-on-onyx)] bg-[var(--color-onyx-900)] hover:opacity-95 transition-opacity whitespace-nowrap"
        >
          + Nuova campagna
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="glass-panel rounded-2xl p-8 text-center">
          <p className="text-[14px] text-[var(--fg-secondary)]">
            Nessuna campagna ancora. Crea la prima campagna WhatsApp per i tuoi contatti.
          </p>
          <Link
            href="/admin/marketing/campaigns/new"
            className="inline-block mt-4 rounded-xl px-5 py-2.5 text-[12px] font-semibold text-[var(--fg-on-onyx)] bg-[var(--color-onyx-900)] hover:opacity-95 transition-opacity"
          >
            + Nuova campagna
          </Link>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-left text-[11px] uppercase tracking-wide text-[var(--fg-muted)]">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Destinatari</th>
                <th className="px-4 py-3 font-medium">Stato</th>
                <th className="px-4 py-3 font-medium">Allegato</th>
                <th className="px-4 py-3 font-medium">Messaggio</th>
                <th className="px-4 py-3 font-medium">Risultato</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-sunken)] transition-colors"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/marketing/campaigns/${c.id}`}
                      className="font-medium text-[var(--fg-primary)] hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-secondary)] whitespace-nowrap">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-secondary)]">{c.totalRecipients}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_COLOR[c.status] ?? "bg-neutral-100 text-neutral-700 border-neutral-200"}`}
                    >
                      {STATUS_LABEL[c.status] ?? c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-secondary)]">
                    {c.attachmentPath ? "Sì" : "—"}
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-secondary)] max-w-[180px] truncate">
                    {c.message ?? "Nessun messaggio"}
                  </td>
                  <td className="px-4 py-3 text-[var(--fg-secondary)] whitespace-nowrap">
                    {c.totalRecipients === 0
                      ? "—"
                      : `${c.sentCount + c.deliveredCount + c.readCount}/${c.totalRecipients} inviati${c.failedCount > 0 ? `, ${c.failedCount} falliti` : ""}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
