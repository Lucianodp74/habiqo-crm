import type { WhatsAppProvider } from "@/lib/whatsapp/provider";
import { metaCloudApiProvider } from "@/lib/whatsapp/providers/meta-cloud-api";
import { twilioProvider } from "@/lib/whatsapp/providers/twilio";
import { unconfiguredProvider } from "@/lib/whatsapp/providers/unconfigured";

/**
 * Picks whichever real provider has credentials configured, or falls
 * back to the explicit "unconfigured" provider — never silently no-ops.
 * Meta takes priority when both happen to be configured (no intermediary).
 */
export function getWhatsAppProvider(): WhatsAppProvider {
  if (metaCloudApiProvider.isConfigured) return metaCloudApiProvider;
  if (twilioProvider.isConfigured) return twilioProvider;
  return unconfiguredProvider;
}
