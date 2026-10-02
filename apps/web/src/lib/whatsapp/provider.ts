/**
 * WhatsApp sending adapter — Marketing → Broadcast WhatsApp.
 *
 * This interface exists so the campaign module (segmentation, UI,
 * history, snapshotting) can be built and tested completely before any
 * real WhatsApp Business account is connected, and so swapping the
 * provider later never touches the marketing module itself (per the
 * explicit requirement: "crea una struttura che permetta di collegare
 * WhatsApp senza dover riscrivere il modulo marketing").
 *
 * No provider is ever allowed to report success without the underlying
 * API actually confirming the send — see providers/unconfigured.ts.
 */

export type WhatsAppSendInput = {
  /** E.164 phone number, e.g. "+393331234567". */
  to: string;
  /** Text body / caption. Optional — a campaign can be image-only. */
  message?: string;
  /** Public URL of the attachment (poster), if any. */
  mediaUrl?: string;
};

export type WhatsAppSendResult =
  | { ok: true; providerMessageId: string }
  | { ok: false; error: string };

export interface WhatsAppProvider {
  readonly id: string;
  readonly isConfigured: boolean;
  sendMessage(input: WhatsAppSendInput): Promise<WhatsAppSendResult>;
}
