import type { WhatsAppProvider, WhatsAppSendInput } from "@/lib/whatsapp/provider";

/**
 * Twilio WhatsApp Business API provider.
 *
 * Setup needed once the business has a Twilio account with WhatsApp
 * enabled (either the Twilio Sandbox for testing, or an approved
 * WhatsApp Business sender for real broadcast):
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_WHATSAPP_FROM   (E.164, e.g. "+14155238886" for the sandbox)
 *
 * Note: Twilio (like Meta) requires an approved message template for
 * the first message in a broadcast sent outside a 24h customer-service
 * window. This call sends free-form content; template support can be
 * layered on later (campaign_templates already exists for reusable
 * text) without touching the marketing module.
 */

function getTwilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM;
  if (!accountSid || !authToken || !fromNumber) return null;
  return { accountSid, authToken, fromNumber };
}

async function sendViaTwilio(input: WhatsAppSendInput) {
  const creds = getTwilioCredentials();
  if (!creds) {
    return {
      ok: false as const,
      error: "Twilio non configurato (variabili d'ambiente mancanti).",
    };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`;
  const body = new URLSearchParams();
  body.set("To", `whatsapp:${input.to}`);
  body.set("From", `whatsapp:${creds.fromNumber}`);
  if (input.message) body.set("Body", input.message);
  if (input.mediaUrl) body.set("MediaUrl", input.mediaUrl);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " + Buffer.from(`${creds.accountSid}:${creds.authToken}`).toString("base64"),
      },
      body,
    });
    const json = (await res.json().catch(() => null)) as { sid?: string; message?: string } | null;

    if (!res.ok) {
      return {
        ok: false as const,
        error: json?.message ?? `Twilio ha risposto con errore ${res.status}`,
      };
    }
    if (!json?.sid) {
      return { ok: false as const, error: "Risposta inattesa da Twilio (nessun sid)." };
    }
    return { ok: true as const, providerMessageId: json.sid };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Errore di rete verso Twilio.",
    };
  }
}

export const twilioProvider: WhatsAppProvider = {
  id: "twilio",
  get isConfigured() {
    return getTwilioCredentials() !== null;
  },
  sendMessage: sendViaTwilio,
};
