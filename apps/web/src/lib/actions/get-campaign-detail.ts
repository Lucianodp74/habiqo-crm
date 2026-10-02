"use server";

import { createClient } from "@/lib/supabase/server";

export type CampaignRecipientDetail = {
  id: string;
  fullNameSnapshot: string;
  phoneSnapshot: string | null;
  status: string;
  exclusionReason: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
};

export type CampaignDetail = {
  id: string;
  name: string;
  status: string;
  message: string | null;
  attachmentPath: string | null;
  attachmentMime: string | null;
  audienceFilter: Record<string, unknown>;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  recipients: CampaignRecipientDetail[];
};

/**
 * Dettaglio di una singola campagna (click-through dallo storico) con
 * l'elenco completo dei destinatari e il relativo stato di consegna.
 * Ritorna null se la campagna non esiste o non appartiene all'agenzia
 * dell'utente (RLS fa comunque da secondo livello di protezione).
 */
export async function getCampaignDetail(campaignId: string): Promise<CampaignDetail | null> {
  if (!campaignId) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .select(
      "id, name, status, message, attachment_path, attachment_mime, audience_filter, scheduled_at, sent_at, created_at",
    )
    .eq("id", campaignId)
    .maybeSingle();

  if (error || !campaign) return null;

  const { data: recipients } = await supabase
    .from("campaign_recipients")
    .select(
      "id, full_name_snapshot, phone_snapshot, status, exclusion_reason, error_message, sent_at, delivered_at, read_at",
    )
    .eq("campaign_id", campaignId)
    .order("full_name_snapshot", { ascending: true });

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    message: campaign.message,
    attachmentPath: campaign.attachment_path,
    attachmentMime: campaign.attachment_mime,
    audienceFilter: (campaign.audience_filter as Record<string, unknown>) ?? {},
    scheduledAt: campaign.scheduled_at,
    sentAt: campaign.sent_at,
    createdAt: campaign.created_at,
    recipients: (recipients ?? []).map((r) => ({
      id: r.id,
      fullNameSnapshot: r.full_name_snapshot,
      phoneSnapshot: r.phone_snapshot,
      status: r.status,
      exclusionReason: r.exclusion_reason,
      errorMessage: r.error_message,
      sentAt: r.sent_at,
      deliveredAt: r.delivered_at,
      readAt: r.read_at,
    })),
  };
}
