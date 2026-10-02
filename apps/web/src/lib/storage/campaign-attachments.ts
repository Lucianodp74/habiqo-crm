/**
 * Campaign attachment storage helpers (Marketing → Broadcast WhatsApp).
 *
 * Mirrors the property-photos pattern exactly (see
 * `@/lib/storage/property-photos`): public bucket, UUID-named paths,
 * membership/role enforcement happens in the server action, not here.
 *
 * Path convention:
 *   agencies/{agencyId}/campaigns/{campaignId}/{uuid}.{ext}
 *
 * Public reads are required here (not just a style choice): a WhatsApp
 * provider (Twilio, Meta Cloud API) fetches the media by URL when
 * sending, so the file must be reachable without auth.
 */

export const CAMPAIGN_ATTACHMENTS_BUCKET = "campaign-attachments";
export const CAMPAIGN_ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const CAMPAIGN_ATTACHMENT_ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;
export type CampaignAttachmentMime = (typeof CAMPAIGN_ATTACHMENT_ALLOWED_MIMES)[number];

export function buildCampaignAttachmentPath(
  agencyId: string,
  campaignId: string,
  ext: string,
): string {
  const cleanExt = ext.replace(/^\./, "").toLowerCase();
  const uuid = crypto.randomUUID();
  return `agencies/${agencyId}/campaigns/${campaignId}/${uuid}.${cleanExt}`;
}

export function campaignAttachmentMimeToExtension(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "application/pdf":
      return "pdf";
    default:
      return "bin";
  }
}

export function getCampaignAttachmentUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured. Cannot build attachment URL.");
  }
  return `${supabaseUrl}/storage/v1/object/public/${CAMPAIGN_ATTACHMENTS_BUCKET}/${path}`;
}
