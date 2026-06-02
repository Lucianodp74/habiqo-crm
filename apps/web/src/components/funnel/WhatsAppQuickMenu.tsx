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
      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 16px", borderRadius: "12px", border: "1px dashed #d1d5db", fontSize: "12px", color: "#9ca3af" }}>
        Nessun numero WhatsApp
      </div>
    );
  }

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    top: "100%",
    marginTop: "6px",
    zIndex: 9999,
    width: "288px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    backgroundColor: "#ffffff",
    boxShadow: "0 20px 60px -10px rgba(0,0,0,0.25), 0 4px 16px -4px rgba(0,0,0,0.10)",
    overflow: "hidden",
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          borderRadius: "12px",
          border: "1px solid #bbf7d0",
          backgroundColor: "#f0fdf4",
          fontSize: "13px",
          fontWeight: 500,
          color: "#15803d",
          cursor: "pointer",
          transition: "all 0.2s",
          userSelect: "none",
        }}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#15803d" aria-hidden style={{ flexShrink: 0 }}>
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
          style={{ flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
          {/* Menu */}
          <div style={dropdownStyle}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb" }}>
              <p style={{ fontSize: "10px", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", margin: 0 }}>
                Scegli il messaggio per {first}
              </p>
            </div>

            <ul style={{ listStyle: "none", padding: "4px 0", margin: 0 }}>
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
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "10px 12px",
                        textDecoration: "none",
                        backgroundColor: "transparent",
                        transition: "background-color 0.15s",
                        pointerEvents: href ? "auto" : "none",
                        opacity: href ? 1 : 0.5,
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#f9fafb"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                    >
                      <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "2px" }}>{action.icon}</span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "13px", fontWeight: 500, color: "#111827" }}>
                            {action.label}
                          </span>
                          {recommended && (
                            <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "2px 6px", borderRadius: "999px", backgroundColor: "#dcfce7", color: "#15803d" }}>
                              Consigliato
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: "11px", color: "#9ca3af", margin: "2px 0 0", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                          {message.slice(0, 80)}…
                        </p>
                      </div>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" style={{ flexShrink: 0, marginTop: "4px" }} aria-hidden>
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </li>
                );
              })}
            </ul>

            <div style={{ padding: "8px 12px", borderTop: "1px solid #f3f4f6", backgroundColor: "#f9fafb" }}>
              <p style={{ fontSize: "10px", color: "#9ca3af", margin: 0 }}>
                Il messaggio si apre in WhatsApp già scritto. Tu clicchi invia.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
