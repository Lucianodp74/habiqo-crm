"use server";

import { createClient } from "@/lib/supabase/server";

export type CampaignListItem = {
  id: string;
  name: string;
  status: string;
  message: string | null;
  attachmentPath: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  excludedCount: number;
};

/**
 * Elenco campagne per la sezione Marketing → Campagne, con i conteggi
 * per-stato dei destinatari già aggregati (per le colonne
 * "Numero destinatari" / "Stato" / "Risultato" della tabella storico).
 */
export async function listCampaignsForAgency(): Promise<CampaignListItem[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return [];

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, name, status, message, attachment_path, scheduled_at, sent_at, created_at")
    .eq("agency_id", membership.agency_id)
    .order("created_at", { ascending: false });

  if (error || !campaigns) {
    console.error("listCampaignsForAgency: query failed", error);
    return [];
  }
  if (campaigns.length === 0) return [];

  const { data: recipients } = await supabase
    .from("campaign_recipients")
    .select("campaign_id, status")
    .in(
      "campaign_id",
      campaigns.map((c) => c.id),
    );

  const counts = new Map<
    string,
    {
      total: number;
      sent: number;
      delivered: number;
      read: number;
      failed: number;
      excluded: number;
    }
  >();
  for (const r of recipients ?? []) {
    const bucket = counts.get(r.campaign_id) ?? {
      total: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      excluded: 0,
    };
    bucket.total += 1;
    if (r.status === "sent") bucket.sent += 1;
    else if (r.status === "delivered") bucket.delivered += 1;
    else if (r.status === "read") bucket.read += 1;
    else if (r.status === "failed") bucket.failed += 1;
    else if (r.status === "excluded") bucket.excluded += 1;
    counts.set(r.campaign_id, bucket);
  }

  return campaigns.map((c) => {
    const bucket = counts.get(c.id) ?? {
      total: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
      excluded: 0,
    };
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      message: c.message,
      attachmentPath: c.attachment_path,
      scheduledAt: c.scheduled_at,
      sentAt: c.sent_at,
      createdAt: c.created_at,
      totalRecipients: bucket.total,
      sentCount: bucket.sent,
      deliveredCount: bucket.delivered,
      readCount: bucket.read,
      failedCount: bucket.failed,
      excludedCount: bucket.excluded,
    };
  });
}
