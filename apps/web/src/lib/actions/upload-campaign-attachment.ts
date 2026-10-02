"use server";

import {
  CAMPAIGN_ATTACHMENTS_BUCKET,
  CAMPAIGN_ATTACHMENT_ALLOWED_MIMES,
  CAMPAIGN_ATTACHMENT_MAX_BYTES,
  type CampaignAttachmentMime,
  buildCampaignAttachmentPath,
  campaignAttachmentMimeToExtension,
} from "@/lib/storage/campaign-attachments";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiquo/types";

const MSG = {
  VALIDATION: "Dati non validi.",
  UNAUTHENTICATED: "Sessione scaduta. Effettua di nuovo l'accesso.",
  FORBIDDEN: "Non hai i permessi per creare campagne.",
  FILE_MISSING: "File mancante.",
  FILE_TOO_LARGE: "Il file supera i 5 MB consentiti.",
  FILE_TYPE_NOT_ALLOWED: "Formato non supportato. Accettati: JPG, PNG, PDF.",
  UPLOAD_FAILED: "Caricamento fallito. Riprova.",
} as const;

const WRITE_ROLES = ["owner", "admin", "agent"] as const;

type UploadResult = ActionResult<{ path: string; mime: string }>;

/**
 * Carica l'allegato (locandina/immagine o PDF) di una campagna, PRIMA che
 * la campagna esista come riga — il path è ancora scollegato dal
 * campaign_id reale, quindi usiamo un identificatore temporaneo come
 * sotto-cartella; createCampaign si limita a salvare il path ricevuto.
 *
 * Il file viene caricato subito così l'utente vede l'anteprima prima di
 * arrivare allo schermo di conferma, come richiesto dal flusso
 * Destinatari → Testo → Locandina → Anteprima → Conferma → Invio.
 */
export async function uploadCampaignAttachment(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: { code: "validation_error", message: MSG.FILE_MISSING } };
  }
  if (file.size > CAMPAIGN_ATTACHMENT_MAX_BYTES) {
    return { ok: false, error: { code: "validation_error", message: MSG.FILE_TOO_LARGE } };
  }
  if (!CAMPAIGN_ATTACHMENT_ALLOWED_MIMES.includes(file.type as CampaignAttachmentMime)) {
    return { ok: false, error: { code: "validation_error", message: MSG.FILE_TYPE_NOT_ALLOWED } };
  }

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

  const ext = campaignAttachmentMimeToExtension(file.type);
  // Nessuna campagna esiste ancora in questo momento del flusso: usiamo
  // "draft" come segmento di percorso, l'id reale non serve per la
  // sicurezza (RLS/ruolo già verificati sopra) ma solo per organizzare i
  // file nel bucket.
  const path = buildCampaignAttachmentPath(membership.agency_id, "draft", ext);

  const { error: uploadError } = await supabase.storage
    .from(CAMPAIGN_ATTACHMENTS_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) {
    console.error("uploadCampaignAttachment: upload failed", uploadError);
    return { ok: false, error: { code: "unknown", message: MSG.UPLOAD_FAILED } };
  }

  return { ok: true, data: { path, mime: file.type } };
}
