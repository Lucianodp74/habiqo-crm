"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { CampaignAudienceFilter } from "@/lib/campaigns/audience-filter";
import { createClient } from "@/lib/supabase/server";
import { normalizeToE164 } from "@/lib/whatsapp/phone";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per creare campagne.",
  NO_RECIPIENTS: "Nessun destinatario pronto per l'invio con i filtri selezionati.",
  CREATE_FAILED: "Creazione campagna non riuscita. Riprova.",
  SNAPSHOT_FAILED:
    "Campagna creata ma salvataggio destinatari non riuscito. Riprova o contatta l'assistenza.",
} as const;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

const createCampaignSchema = z.object({
  name: z.string().trim().min(1, MSG.VALIDATION).max(200, MSG.VALIDATION),
  // Esplicitamente facoltativo: una campagna "SOLO IMMAGINE" ha message null.
  message: z
    .string()
    .trim()
    .max(4096, MSG.VALIDATION)
    .optional()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  attachmentPath: z.string().trim().min(1).optional().nullable(),
  attachmentMime: z.string().trim().min(1).optional().nullable(),
  filter: z.object({
    tags: z.array(z.string()).default([]),
    status: z.string().trim().min(1).optional().nullable(),
    city: z.string().trim().min(1).optional().nullable(),
  }),
  scheduledAt: z.string().datetime().optional().nullable(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

type CreateCampaignResult = ActionResult<{
  campaignId: string;
  totalRecipients: number;
  readyRecipients: number;
  excludedRecipients: number;
}>;

/**
 * Crea una campagna WhatsApp e salva SUBITO lo snapshot dei destinatari
 * risolti dal filtro (nome e numero al momento della creazione), così lo
 * storico resta coerente anche se i tag dei lead cambiano in seguito.
 *
 * Non invia nulla: lo stato iniziale è sempre "draft". L'invio vero e
 * proprio è responsabilità di sendCampaign (provider WhatsApp a parte).
 */
export async function createCampaign(input: unknown): Promise<CreateCampaignResult> {
  const parsed = createCampaignSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: "validation_error", message: MSG.VALIDATION } };
  }
  const { name, message, attachmentPath, attachmentMime, filter, scheduledAt } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: { code: "unauthenticated", message: MSG.UNAUTHENTICATED } };
  }

  const { data: membership } = await supabase
    .from("agency_members")
    .select("agency_id, role")
    .eq("user_id", user.id)
    .in("role", WRITE_ROLES as unknown as string[])
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return { ok: false, error: { code: "forbidden", message: MSG.FORBIDDEN } };
  }
  const agencyId = membership.agency_id as string;

  // 1) Resolve the audience NOW, server-side — never trust a count the
  // client may have computed earlier from stale data.
  const audienceFilter: CampaignAudienceFilter = {
    tags: filter.tags,
    status: filter.status ?? null,
    city: filter.city ?? null,
  };

  const { data: leads, error: leadsError } = await buildAudienceQuery(
    supabase,
    agencyId,
    audienceFilter,
  );

  if (leadsError) {
    console.error("createCampaign: audience query failed", leadsError);
    return { ok: false, error: { code: "unknown", message: MSG.CREATE_FAILED } };
  }

  const rows = leads ?? [];
  type RecipientRow = {
    lead_id: string;
    full_name_snapshot: string;
    phone_snapshot: string | null;
    status: "pending" | "excluded";
    exclusion_reason: string | null;
  };

  const recipients: RecipientRow[] = rows.map((lead) => {
    const e164 = normalizeToE164(lead.whatsapp ?? lead.phone);
    if (lead.marketing_opt_out) {
      return {
        lead_id: lead.id,
        full_name_snapshot: lead.full_name?.trim() || "Senza nome",
        phone_snapshot: e164,
        status: "excluded",
        exclusion_reason: "Opt-out marketing",
      };
    }
    if (!e164) {
      return {
        lead_id: lead.id,
        full_name_snapshot: lead.full_name?.trim() || "Senza nome",
        phone_snapshot: null,
        status: "excluded",
        exclusion_reason: "Numero mancante o non valido",
      };
    }
    return {
      lead_id: lead.id,
      full_name_snapshot: lead.full_name?.trim() || "Senza nome",
      phone_snapshot: e164,
      status: "pending",
      exclusion_reason: null,
    };
  });

  const readyRecipients = recipients.filter((r) => r.status === "pending").length;
  if (readyRecipients === 0) {
    return { ok: false, error: { code: "validation_error", message: MSG.NO_RECIPIENTS } };
  }

  // 2) Create the campaign row (status: draft).
  const { data: campaign, error: insertError } = await supabase
    .from("campaigns")
    .insert({
      agency_id: agencyId,
      name,
      message,
      attachment_path: attachmentPath ?? null,
      attachment_mime: attachmentMime ?? null,
      audience_filter: audienceFilter,
      // "scheduled" è solo uno stato informativo per ora: non esiste ancora
      // un esecutore che invia automaticamente alla data programmata (da
      // collegare con un cron/scheduled job quando sarà richiesto). Fino ad
      // allora l'invio resta sempre un'azione esplicita (sendCampaign).
      status: scheduledAt ? "scheduled" : "draft",
      scheduled_at: scheduledAt ?? null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !campaign) {
    console.error("createCampaign: insert failed", insertError);
    return { ok: false, error: { code: "unknown", message: MSG.CREATE_FAILED } };
  }

  // 3) Snapshot recipients. If this fails, the campaign stays as an
  // empty draft rather than silently pretending it has recipients.
  const { error: recipientsError } = await supabase.from("campaign_recipients").insert(
    recipients.map((r) => ({
      campaign_id: campaign.id,
      lead_id: r.lead_id,
      full_name_snapshot: r.full_name_snapshot,
      phone_snapshot: r.phone_snapshot,
      status: r.status,
      exclusion_reason: r.exclusion_reason,
    })),
  );

  if (recipientsError) {
    console.error("createCampaign: recipients snapshot failed", recipientsError);
    return { ok: false, error: { code: "unknown", message: MSG.SNAPSHOT_FAILED } };
  }

  revalidatePath("/admin/marketing/campaigns");

  return {
    ok: true,
    data: {
      campaignId: campaign.id,
      totalRecipients: recipients.length,
      readyRecipients,
      excludedRecipients: recipients.length - readyRecipients,
    },
  };
}

async function buildAudienceQuery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  agencyId: string,
  filter: CampaignAudienceFilter,
) {
  let query = supabase
    .from("leads")
    .select("id, full_name, phone, whatsapp, marketing_opt_out")
    .eq("agency_id", agencyId);

  if (filter.status) {
    query = query.eq("status", filter.status);
  }
  if (filter.city?.trim()) {
    query = query.ilike("preferred_city", `%${filter.city.trim()}%`);
  }
  if (filter.tags.length > 0) {
    query = query.overlaps("tags", filter.tags);
  }

  return query;
}
