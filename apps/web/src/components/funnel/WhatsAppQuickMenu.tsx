"use client";

import { buildWhatsAppLink } from "@/lib/funnel/staleness";
import { useState, useRef, useEffect } from "react";

type Props = {
  phone: string | null;
  whatsapp: string | null;
  status: string;
  leadName: string;
  agentName: string;
  agencyName: string;
};

type TemplateAction = {
  id: string;
  label: string;
  icon: string;
  message: (ctx: { first: string; agentName: string; agencyName: string }) => string;
};

const TEMPLATE_ACTIONS: TemplateAction[] = [
  {
    id: "primo_contatto",
    label: "Primo contatto",
    icon: "👋",
    message: ({ first, agentName, agencyName }) =>
      `Ciao ${first}, sono ${agentName} di ${agencyName}. Ho ricevuto la tua richiesta e volevo contattarti per capire come posso aiutarti. Quando sei disponibile per una breve chiamata?`,
  },
  {
    id: "proponi_visita",
    label: "Proponi visita",
    icon: "🏠",
    message: ({ first, agentName }) =>
      `Ciao ${first}, sono ${agentName}. Ho trovato alcuni immobili che potrebbero fare al caso tuo. Ti andrebbe di fissare una visita questa settimana?`,
  },
  {
    id: "conferma_visita",
    label: "Conferma visita",
    icon: "📅",
    message: ({ first }) =>
      `Ciao ${first}, ti confermo la visita. Hai bisogno di ulteriori informazioni prima di arrivare? Sono a tua disposizione.`,
  },
  {
    id: "aggiorna_trattativa",
    label: "Aggiorna trattativa",
    icon: "🤝",
    message: ({ first }) =>
      `Ciao ${first}, volevo aggiornarti sull'andamento della trattativa. Hai avuto modo di riflettere sulla proposta? Possiamo sentirci?`,
  },
  {
    id: "follow_up",
    label: "Follow-up generico",
    icon: "💬",
    message: ({ first, agentName, agencyName }) =>
      `Ciao ${first}, sono ${agentName} di ${agencyName}. Volevo tenermi in contatto e capire se posso esserti utile. Come stai?`,
  },
];

export function WhatsAppQuickMenu({
  phone,
  whatsapp,
  status,
  leadName,
  agentName,
  agencyName,
}: Props) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const first = leadName.split(" ")[0] ?? leadName;
  const hasNumber = !!(whatsapp || phone);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function isRecommended(id: string): boolean {
    switch (status) {
      case "new":             return id === "primo_contatto";
      case "qualified":       return id === "proponi_visita";
      case "visit_scheduled": return id === "conferma_visita";
      case "in_negotiation":  return id === "aggiorna_trattativa";
      default:                return id === "follow_up";
    }
  }

  if (!hasNumber) {
    return (
      <div className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[var(--border-subtle)] px-4 py-2.5 text-[12px] text-[var(--fg-muted)]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Nessun numero WhatsApp
      </div>
    );
  }

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-2.5 text-[13px] font-medium text-green-700 hover:bg-green-100 hover:border-green-300 transition-all duration-200 select-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="shrink-0">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.123 1.533 5.856L.057 23.214a.75.75 0 0 0 .93.93l5.356-1.476A11.95 11.95 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.693-.535-5.21-1.463l-.373-.223-3.876 1.068 1.068-3.877-.222-.372A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
        </svg>
        WhatsApp
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Overlay per chiudere su click esterno */}
      {open && (
        <div
          className="fixed inset-0 z-[199]"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Dropdown — sopra l'overlay */}
      {open && (
        <div
          className="absolute left-0 top-full mt-1.5 z-[200] w-72 rounded-2xl border border-gray-200 overflow-hidden"
          style={{
            backgroundColor: "#ffffff",
            boxShadow: "0 20px 60px -10px rgba(0,0,0,0.20)",
          }}
        >
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
            <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
              Scegli il messaggio per {first}
            </p>
          </div>

          <ul className="py-1">
            {TEMPLATE_ACTIONS.map((action) => {
              const recommended = isRecommended(action.id);
              const message = action.message({ first, agentName, agencyName });
              const href = buildWhatsAppLink(phone, whatsapp, message);

              return (
                <li key={action.id}>
                  <a
                    href={href ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors group"
                    style={{ pointerEvents: href ? "auto" : "none", opacity: href ? 1 : 0.5 }}
                  >
                    <span className="text-base shrink-0 mt-0.5">{action.icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-medium text-gray-800">
                          {action.label}
                        </span>
                        {recommended && (
                          <span className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                            Consigliato
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {message.slice(0, 80)}…
                      </p>
                    </div>
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="shrink-0 mt-1 text-gray-300 group-hover:text-green-500 transition-colors"
                      aria-hidden
                    >
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-[10px] text-gray-400">
              Il messaggio si apre in WhatsApp già scritto. Tu clicchi invia.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
