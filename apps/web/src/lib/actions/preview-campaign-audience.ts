"use server";

import type { CampaignAudienceFilter } from "@/lib/campaigns/audience-filter";
import { createClient } from "@/lib/supabase/server";
import { normalizeToE164 } from "@/lib/whatsapp/phone";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per creare campagne.",
} as const;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

export type CampaignAudiencePreviewItem = {
  leadId: string;
  fullName: string;
  phoneDisplay: string | null;
  excluded: boolean;
  exclusionReason: string | null;
};

export type CampaignAudiencePreview = {
  totalMatched: number;
  readyCount: number;
  excludedMissingPhone: number;
  excludedOptOut: number;
  /** Capped sample for the "anteprima destinatari" screen. */
  preview: CampaignAudiencePreviewItem[];
};

const PREVIEW_LIMIT = 20;

type PreviewResult = ActionResult<CampaignAudiencePreview>;

/**
 * Resolves a CampaignAudienceFilter against the current agency's leads.
 * Does NOT write anything — used both for the live "Destinatari: N"
 * counter while building a campaign, and internally by createCampaign
 * right before snapshotting.
 */
export async function previewCampaignAudience(
  filter: CampaignAudienceFilter,
): Promise<PreviewResult> {
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

  let query = supabase
    .from("leads")
    .select("id, full_name, phone, whatsapp, marketing_opt_out, status, preferred_city, tags")
    .eq("agency_id", membership.agency_id);

  if (filter.status) {
    query = query.eq("status", filter.status);
  }
  if (filter.city?.trim()) {
    query = query.ilike("preferred_city", `%${filter.city.trim()}%`);
  }
  if (filter.tags.length > 0) {
    // overlaps: lead matches if it has ANY of the selected tags.
    query = query.overlaps("tags", filter.tags);
  }

  const { data: leads, error } = await query;

  if (error) {
    console.error("previewCampaignAudience: query failed", error);
    return {
      ok: false,
      error: { code: "unknown", message: "Impossibile calcolare i destinatari." },
    };
  }

  const rows = leads ?? [];
  let readyCount = 0;
  let excludedMissingPhone = 0;
  let excludedOptOut = 0;
  const preview: CampaignAudiencePreviewItem[] = [];

  for (const lead of rows) {
    const e164 = normalizeToE164(lead.whatsapp ?? lead.phone);
    let excluded = false;
    let exclusionReason: string | null = null;

    if (lead.marketing_opt_out) {
      excluded = true;
      exclusionReason = "Opt-out marketing";
      excludedOptOut += 1;
    } else if (!e164) {
      excluded = true;
      exclusionReason = "Numero mancante o non valido";
      excludedMissingPhone += 1;
    } else {
      readyCount += 1;
    }

    if (preview.length < PREVIEW_LIMIT) {
      preview.push({
        leadId: lead.id,
        fullName: lead.full_name?.trim() || "Senza nome",
        phoneDisplay: lead.whatsapp ?? lead.phone ?? null,
        excluded,
        exclusionReason,
      });
    }
  }

  return {
    ok: true,
    data: {
      totalMatched: rows.length,
      readyCount,
      excludedMissingPhone,
      excludedOptOut,
      preview,
    },
  };
}
