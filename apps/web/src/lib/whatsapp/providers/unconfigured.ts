import type { WhatsAppProvider } from "@/lib/whatsapp/provider";

/**
 * Default provider when no real WhatsApp account is connected.
 *
 * Deliberately refuses every send with a clear error instead of
 * pretending to succeed — "NON dichiarare 'inviato' se il sistema non
 * ha realmente confermato l'invio" is a hard requirement from the
 * product brief. This is what keeps the rest of the campaign module
 * (segmentation, snapshotting, history, UI) fully usable and testable
 * while the business decides on and sets up a real provider.
 */
export const unconfiguredProvider: WhatsAppProvider = {
  id: "unconfigured",
  isConfigured: false,
  async sendMessage() {
    return {
      ok: false,
      error:
        "Nessun provider WhatsApp collegato. Configura Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM) oppure Meta WhatsApp Cloud API (WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID) per inviare davvero i messaggi.",
    };
  },
};
