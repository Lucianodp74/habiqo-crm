import type { WhatsAppProvider, WhatsAppSendInput } from "@/lib/whatsapp/provider";

/**
 * Meta WhatsApp Cloud API provider (direct integration, no intermediary).
 *
 * Setup needed once the business has a verified Meta Business account,
 * an approved WhatsApp sender number, and a permanent access token:
 *   WHATSAPP_ACCESS_TOKEN
 *   WHATSAPP_PHONE_NUMBER_ID
 *
 * (These two env var names were already present as commented-out
 * placeholders in apps/web/.env.example before this module existed.)
 *
 * Note: Meta requires an approved message template for the first
 * message in a broadcast sent outside a 24h customer-service window.
 * This call sends free-form text/image content, which works within an
 * open conversation window; template support can be layered on later
 * without touching the marketing module.
 */

function getMetaCredentials() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) return null;
  return { accessToken, phoneNumberId };
}

async function sendViaMeta(input: WhatsAppSendInput) {
  const creds = getMetaCredentials();
  if (!creds) {
    return {
      ok: false as const,
      error: "Meta WhatsApp Cloud API non configurata (variabili d'ambiente mancanti).",
    };
  }

  const url = `https://graph.facebook.com/v20.0/${creds.phoneNumberId}/messages`;
  const to = input.to.replace(/^\+/, "");
  const payload: Record<string, unknown> = {
    messaging_product: "whatsapp",
    to,
  };

  if (input.mediaUrl) {
    payload.type = "image";
    payload.image = input.message
      ? { link: input.mediaUrl, caption: input.message }
      : { link: input.mediaUrl };
  } else {
    payload.type = "text";
    payload.text = { body: input.message ?? "" };
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${creds.accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => null)) as {
      messages?: { id?: string }[];
      error?: { message?: string };
    } | null;

    if (!res.ok) {
      return {
        ok: false as const,
        error: json?.error?.message ?? `Meta ha risposto con errore ${res.status}`,
      };
    }
    const messageId = json?.messages?.[0]?.id;
    if (!messageId) {
      return { ok: false as const, error: "Risposta inattesa da Meta (nessun id messaggio)." };
    }
    return { ok: true as const, providerMessageId: messageId };
  } catch (err) {
    return {
      ok: false as const,
      error: err instanceof Error ? err.message : "Errore di rete verso Meta.",
    };
  }
}

export const metaCloudApiProvider: WhatsAppProvider = {
  id: "meta_cloud_api",
  get isConfigured() {
    return getMetaCredentials() !== null;
  },
  sendMessage: sendViaMeta,
};
