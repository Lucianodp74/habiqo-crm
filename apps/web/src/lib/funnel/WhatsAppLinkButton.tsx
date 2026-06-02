"use client";

import {
  buildWhatsAppLink,
  whatsappTemplate,
} from "@/lib/funnel/staleness";

type Props = {
  phone: string | null;
  whatsapp: string | null;
  status: string;
  leadName: string;
  agentName: string;
  agencyName: string;
};

/**
 * Bottone che genera un link wa.me con messaggio precompilato.
 * Apre WhatsApp sul dispositivo con il testo già scritto.
 * Nessuna API esterna — zero costi, zero approvazioni Meta.
 */
export function WhatsAppLinkButton({
  phone,
  whatsapp,
  status,
  leadName,
  agentName,
  agencyName,
}: Props) {
  const message = whatsappTemplate(status, leadName, agentName, agencyName);
  const href = buildWhatsAppLink(phone, whatsapp, message);

  if (!href) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-muted)] px-3 py-2">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Nessun numero WhatsApp
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-[13px] font-medium text-green-700 hover:bg-green-100 hover:border-green-300 transition-all duration-200 group"
    >
      {/* WhatsApp icon */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
        className="shrink-0"
      >
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.533 5.856L.057 23.214a.75.75 0 0 0 .93.93l5.356-1.476A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.535-5.21-1.463l-.373-.223-3.876 1.068 1.068-3.877-.222-.372A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
      </svg>
      Apri WhatsApp
    </a>
  );
}
