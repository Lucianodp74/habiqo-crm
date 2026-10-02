"use server";

import { revalidatePath } from "next/cache";

import { applyTemplateVariables } from "@/lib/campaigns/template-variables";
import { getCampaignAttachmentUrl } from "@/lib/storage/campaign-attachments";
import { createClient } from "@/lib/supabase/server";
import { getWhatsAppProvider } from "@/lib/whatsapp/get-provider";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per inviare campagne.",
  NOT_FOUND: "Campagna non trovata.",
  ALREADY_SENT: "Questa campagna è già stata inviata.",
  PROVIDER_NOT_CONFIGURED:
    "Nessun provider WhatsApp collegato. Configura Twilio o Meta WhatsApp Cloud API nelle variabili d'ambiente per poter inviare le campagne.",
  NO_PENDING_RECIPIENTS: "Nessun destinatario in attesa di invio.",
} as const;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

type SendCampaignResult = ActionResult<{
  attempted: number;
  sent: number;
  failed: number;
}>;

/**
 * Invia davvero i messaggi di una campagna tramite il provider WhatsApp
 * configurato (Twilio o Meta Cloud API). Se nessun provider è collegato,
 * fallisce in modo esplicito per OGNI destinatario — non segna mai nulla
 * come "inviato" senza una conferma reale dal provider, come richiesto.
 *
 * Esegue lato server; nessuna credenziale/token raggiunge mai il client.
 */
export async function sendCampaign(campaignId: string): Promise<SendCampaignResult> {
  if (!campaignId) {
    return { ok: false, error: { code: "validation_error", message: MSG.NOT_FOUND } };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "unauthenticated", message: MSG.UNAUTHENTICATED } };
  }

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, agency_id, message, attachment_path, status")
    .eq("id", campaignId)
    .maybeSingle();

  if (!campaign) {
    return { ok: false, error: { code: "not_found", message: MSG.NOT_FOUND } };
  }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("role")
    .eq("agency_id", campaign.agency_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership || !WRITE_ROLES.includes(membership.role as (typeof WRITE_ROLES)[number])) {
    return { ok: false, error: { code: "forbidden", message: MSG.FORBIDDEN } };
  }

  if (campaign.status === "completed" || campaign.status === "sending") {
    return { ok: false, error: { code: "validation_error", message: MSG.ALREADY_SENT } };
  }

  const provider = getWhatsAppProvider();
  if (!provider.isConfigured) {
    // Esplicito e bloccante: nessun invio finto, nessuna simulazione.
    return {
      ok: false,
      error: { code: "conflict", message: MSG.PROVIDER_NOT_CONFIGURED },
    };
  }

  const { data: recipients, error: recipientsError } = await supabase
    .from("campaign_recipients")
    .select("id, phone_snapshot, full_name_snapshot")
    .eq("campaign_id", campaignId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (recipientsError) {
    console.error("sendCampaign: recipients query failed", recipientsError);
    return { ok: false, error: { code: "unknown", message: "Impossibile leggere i destinatari." } };
  }

  const pending = recipients ?? [];
  if (pending.length === 0) {
    return { ok: false, error: { code: "validation_error", message: MSG.NO_PENDING_RECIPIENTS } };
  }

  await supabase.from("campaigns").update({ status: "sending" }).eq("id", campaignId);

  const mediaUrl = campaign.attachment_path
    ? getCampaignAttachmentUrl(campaign.attachment_path)
    : undefined;

  let sent = 0;
  let failed = 0;

  for (const recipient of pending) {
    if (!recipient.phone_snapshot) {
      failed += 1;
      await supabase
        .from("campaign_recipients")
        .update({
          status: "failed",
          error_message: "Numero mancante al momento dell'invio.",
        })
        .eq("id", recipient.id);
      continue;
    }

    const personalizedMessage = campaign.message
      ? applyTemplateVariables(campaign.message, recipient.full_name_snapshot)
      : undefined;

    const result = await provider.sendMessage({
      to: recipient.phone_snapshot,
      message: personalizedMessage,
      mediaUrl,
    });

    if (result.ok) {
      sent += 1;
      await supabase
        .from("campaign_recipients")
        .update({
          status: "sent",
          provider_message_id: result.providerMessageId,
          sent_at: new Date().toISOString(),
          error_message: null,
        })
        .eq("id", recipient.id);
    } else {
      failed += 1;
      await supabase
        .from("campaign_recipients")
        .update({
          status: "failed",
          error_message: result.error,
        })
        .eq("id", recipient.id);
    }
  }

  // "completed" riflette solo che il tentativo di invio è terminato — non
  // implica che tutti i destinatari abbiano ricevuto il messaggio: lo
  // stato per-destinatario (sent/delivered/read/failed) resta la fonte di
  // verità su cosa è stato davvero confermato dal provider.
  await supabase
    .from("campaigns")
    .update({
      status: failed === pending.length ? "failed" : "completed",
      sent_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  revalidatePath("/admin/marketing/campaigns");
  revalidatePath(`/admin/marketing/campaigns/${campaignId}`);

  return {
    ok: true,
    data: { attempted: pending.length, sent, failed },
  };
}
