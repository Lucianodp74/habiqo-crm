import { CampaignWizard } from "@/components/marketing/campaign-wizard";
import { listCampaignTemplates } from "@/lib/actions/campaign-templates";
import { listLeadTagsForAgency } from "@/lib/actions/list-lead-tags";

export const metadata = { title: "Nuova campagna WhatsApp · Habiquo" };

export default async function NewCampaignPage() {
  const [tags, templates] = await Promise.all([listLeadTagsForAgency(), listCampaignTemplates()]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="font-display text-[26px] text-[var(--fg-primary)] mb-1">
        Nuova campagna WhatsApp
      </h1>
      <p className="text-[13px] text-[var(--fg-muted)] mb-6">
        Destinatari → Testo (facoltativo) → Locandina → Anteprima → Conferma → Invio
      </p>
      <CampaignWizard availableTags={tags} templates={templates} />
    </div>
  );
}
