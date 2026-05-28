"use client";

import { NON_SPECIFICATO } from "@/lib/crm/missing-value";
import { CalendarPlus, Mail, MessageSquarePlus, Phone, StickyNote } from "lucide-react";
import { useCallback } from "react";

type Props = {
  fullName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
};

const actionBase =
  "group inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)]/80 px-3.5 py-2.5 text-[12px] font-medium text-[var(--fg-secondary)] transition-all duration-200 ease-out hover:border-[var(--color-brass)]/35 hover:bg-[var(--bg-sunken)]/90 hover:text-[var(--fg-primary)] hover:shadow-[0_8px_24px_-12px_rgba(24,20,16,0.25)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]/40";

function digitsForWa(raw: string | null): string {
  if (!raw) return "";
  return raw.replace(/\D/g, "");
}

function buildWhatsAppHref(phone: string | null, whatsapp: string | null): string | null {
  const raw = digitsForWa(whatsapp || phone);
  if (!raw.length) return null;
  const e164 = raw.startsWith("39") ? raw : raw.startsWith("3") ? `39${raw}` : raw;
  return `https://wa.me/${e164}`;
}

export function LeadQuickActions({ fullName, email, phone, whatsapp }: Props) {
  const scrollToNotes = useCallback(() => {
    const el = document.getElementById("lead-notes-section");
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      document.getElementById("lead-note-input")?.focus();
    }, 400);
  }, []);

  const visitTitle = encodeURIComponent(`Visita · ${fullName}`);
  const visitDetails = encodeURIComponent(
    "Lead HABIQUO — verifica indirizzo, documentazione e agenda commerciale.",
  );
  const calendarHref = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${visitTitle}&details=${visitDetails}`;

  const telHref = phone ? `tel:${phone.replace(/\s/g, "")}` : null;
  const mailHref = email
    ? `mailto:${email}?subject=${encodeURIComponent(`Lead: ${fullName}`)}`
    : null;
  const waHref = buildWhatsAppHref(phone, whatsapp);

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {telHref ? (
        <a href={telHref} className={actionBase}>
          <Phone
            className="size-3.5 text-[var(--color-brass-deep)] transition-transform duration-200 group-hover:scale-110"
            aria-hidden
          />
          Chiama
        </a>
      ) : (
        <span
          className={`${actionBase} cursor-not-allowed opacity-45 hover:shadow-none hover:scale-100`}
          title={NON_SPECIFICATO}
        >
          <Phone className="size-3.5 opacity-60" aria-hidden />
          Chiama
        </span>
      )}
      {waHref ? (
        <a href={waHref} target="_blank" rel="noopener noreferrer" className={actionBase}>
          <MessageSquarePlus
            className="size-3.5 text-[var(--color-positive)] transition-transform duration-200 group-hover:scale-110"
            aria-hidden
          />
          WhatsApp
        </a>
      ) : (
        <span className={`${actionBase} cursor-not-allowed opacity-45`} title={NON_SPECIFICATO}>
          <MessageSquarePlus className="size-3.5 opacity-60" aria-hidden />
          WhatsApp
        </span>
      )}
      {mailHref ? (
        <a href={mailHref} className={actionBase}>
          <Mail
            className="size-3.5 text-[var(--fg-secondary)] transition-transform duration-200 group-hover:scale-110"
            aria-hidden
          />
          Email
        </a>
      ) : (
        <span className={`${actionBase} cursor-not-allowed opacity-45`} title={NON_SPECIFICATO}>
          <Mail className="size-3.5 opacity-60" aria-hidden />
          Email
        </span>
      )}
      <a href={calendarHref} target="_blank" rel="noopener noreferrer" className={actionBase}>
        <CalendarPlus
          className="size-3.5 text-[var(--color-brass)] transition-transform duration-200 group-hover:scale-110"
          aria-hidden
        />
        Pianifica visita
      </a>
      <button type="button" onClick={scrollToNotes} className={actionBase}>
        <StickyNote
          className="size-3.5 text-[var(--fg-muted)] transition-transform duration-200 group-hover:scale-110 group-hover:text-[var(--color-brass-deep)]"
          aria-hidden
        />
        Nuova nota
      </button>
    </div>
  );
}
