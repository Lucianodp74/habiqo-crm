import { SendCampaignButton } from "@/components/marketing/send-campaign-button";
import { getCampaignDetail } from "@/lib/actions/get-campaign-detail";
import { getCampaignAttachmentUrl } from "@/lib/storage/campaign-attachments";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = { title: "Dettaglio campagna · Habiquo" };

const RECIPIENT_STATUS_LABEL: Record<string, string> = {
  pending: "In attesa",
  sent: "Inviato",
  delivered: "Consegnato",
  read: "Letto",
  failed: "Fallito",
  excluded: "Escluso",
};

const RECIPIENT_STATUS_COLOR: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-700 border-neutral-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-teal-50 text-teal-700 border-teal-200",
  read: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  excluded: "bg-neutral-100 text-neutral-500 border-neutral-200",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignDetail(id);
  if (!campaign) notFound();

  const canSend = campaign.status === "draft" || campaign.status === "scheduled";
  const pendingCount = campaign.recipients.filter((r) => r.status === "pending").length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link
        href="/admin/marketing/campaigns"
        className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg-primary)]"
      >
        ← Campagne
      </Link>

      <div className="flex items-start justify-between mt-3 mb-6 gap-4">
        <div>
          <h1 className="font-display text-[26px] text-[var(--fg-primary)]">{campaign.name}</h1>
          <p className="text-[13px] text-[var(--fg-muted)] mt-1">
            Creata il {formatDate(campaign.createdAt)}
            {campaign.sentAt ? ` · Inviata il ${formatDate(campaign.sentAt)}` : ""}
          </p>
        </div>
        {canSend && pendingCount > 0 ? (
          <SendCampaignButton campaignId={campaign.id} pendingCount={pendingCount} />
        ) : null}
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="glass-panel rounded-2xl p-4">
          <h3 className="text-[11px] uppercase tracking-wide text-[var(--fg-muted)] mb-2">
            Messaggio
          </h3>
          <p className="text-[14px] text-[var(--fg-primary)] whitespace-pre-wrap">
            {campaign.message ?? "Nessun messaggio (solo immagine)"}
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <h3 className="text-[11px] uppercase tracking-wide text-[var(--fg-muted)] mb-2">
            Allegato
          </h3>
          {campaign.attachmentPath ? (
            campaign.attachmentMime === "application/pdf" ? (
              <a
                href={getCampaignAttachmentUrl(campaign.attachmentPath)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-blue-700 hover:underline"
              >
                Apri PDF allegato →
              </a>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getCampaignAttachmentUrl(campaign.attachmentPath)}
                alt="Allegato campagna"
                className="max-h-40 rounded-lg border border-[var(--border-subtle)]"
              />
            )
          ) : (
            <p className="text-[13px] text-[var(--fg-muted)]">Nessun allegato</p>
          )}
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
          <h3 className="text-[13px] font-medium text-[var(--fg-primary)]">
            Destinatari ({campaign.recipients.length})
          </h3>
        </div>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-left text-[11px] uppercase tracking-wide text-[var(--fg-muted)]">
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Telefono</th>
              <th className="px-4 py-2 font-medium">Stato</th>
              <th className="px-4 py-2 font-medium">Dettaglio</th>
            </tr>
          </thead>
          <tbody>
            {campaign.recipients.map((r) => (
              <tr key={r.id} className="border-b border-[var(--border-subtle)] last:border-0">
                <td className="px-4 py-2 text-[var(--fg-primary)]">{r.fullNameSnapshot}</td>
                <td className="px-4 py-2 text-[var(--fg-secondary)]">{r.phoneSnapshot ?? "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${RECIPIENT_STATUS_COLOR[r.status] ?? "bg-neutral-100 text-neutral-700 border-neutral-200"}`}
                  >
                    {RECIPIENT_STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-[var(--fg-muted)]">
                  {r.exclusionReason ?? r.errorMessage ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
