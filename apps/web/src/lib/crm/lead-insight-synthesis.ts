import type { PipelineLead } from "@/lib/crm/pipeline";
import type { LeadTimelineEvent } from "@/lib/queries/lead-events";

export type LeadInsightSynthesis = {
  activitySummary: string;
  conversionPct: number;
  nextAction: string;
  nextActionRationale: string;
  signals: string[];
};

function parseIso(iso: string): number {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
}

function daysBetween(a: number, b: number): number {
  return Math.floor(Math.abs(a - b) / (24 * 60 * 60 * 1000));
}

function statusConversionBase(status: string): number {
  switch (status) {
    case "won":
      return 96;
    case "lost":
      return 4;
    case "in_negotiation":
      return 68;
    case "visit_scheduled":
      return 58;
    case "qualified":
      return 44;
    default:
      return 28;
  }
}

function temperatureDelta(temp: string): number {
  if (temp === "hot") return 10;
  if (temp === "warm") return 5;
  if (temp === "cold") return -4;
  return 0;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/**
 * Sintesi CRM deterministica da lead + timeline (nessuna chiamata esterna).
 * Testi in italiano, tono consulenziale premium.
 */
export function synthesizeLeadInsight(
  lead: PipelineLead,
  events: LeadTimelineEvent[],
): LeadInsightSynthesis {
  const now = Date.now();
  const recentCutoff = now - 14 * 24 * 60 * 60 * 1000;

  const recent = events.filter((e) => parseIso(e.occurredAt) >= recentCutoff);
  const byType = (t: string) => recent.filter((e) => e.type === t).length;

  const nNote = byType("note");
  const nCall = byType("call");
  const nWhatsapp = byType("whatsapp");
  const nEmail = byType("email");
  const nVisit = byType("visit");
  const nStatus = byType("status_change");

  const last = events[0];
  const lastLabel = last
    ? `${last.title.toLowerCase()} (${daysBetween(now, parseIso(last.occurredAt))}g fa)`
    : "nessun evento registrato";

  let activitySummary: string;
  if (events.length === 0) {
    activitySummary =
      "Timeline ancora vuota: il profilo non ha tracciamento operativo. Inizia con una nota o un contatto per alimentare il segnale CRM.";
  } else if (recent.length === 0) {
    activitySummary = `Ultimo touchpoint: ${lastLabel}. Negli ultimi 14 giorni non ci sono stati aggiornamenti: rischio disattivazione del lead.`;
  } else {
    const parts: string[] = [];
    parts.push(`${recent.length} attività negli ultimi 14 giorni`);
    if (nNote) parts.push(`${nNote} nota/e`);
    if (nCall) parts.push(`${nCall} chiamata/e`);
    if (nWhatsapp) parts.push(`${nWhatsapp} WhatsApp`);
    if (nEmail) parts.push(`${nEmail} email`);
    if (nVisit) parts.push(`${nVisit} visita/e`);
    if (nStatus) parts.push(`${nStatus} cambio stato`);
    activitySummary = `${parts.join(" · ")}. Ultimo evento: ${lastLabel}.`;
  }

  let base = statusConversionBase(lead.status) + temperatureDelta(lead.temperature);
  if (lead.aiScore != null) {
    base = Math.round(0.45 * base + 0.55 * lead.aiScore);
  }
  if (recent.length >= 4) base += 4;
  if (recent.length === 0 && events.length > 0) base -= 8;
  const conversionPct = clamp(base, 6, 94);

  const signals: string[] = [];
  if (lead.temperature === "hot") signals.push("Temperatura calda: priorità nella coda contatti.");
  if (lead.leadPriority === "critical" || lead.leadPriority === "high") {
    signals.push("Priorità operativa elevata sul lead.");
  }
  if (nVisit === 0 && lead.status !== "won" && lead.status !== "lost") {
    signals.push("Nessuna visita di recente: opportunità di qualificazione sul campo.");
  }
  if (nCall === 0 && nWhatsapp === 0 && recent.length > 0) {
    signals.push("Canali diretti sotto-utilizzati rispetto ad altri touchpoint.");
  }
  if (signals.length === 0) {
    signals.push("Profilo bilanciato: mantieni ritmo contatti e aggiorna stato dopo ogni passo.");
  }

  let nextAction: string;
  let nextActionRationale: string;

  if (lead.status === "won" || lead.status === "lost") {
    nextAction =
      lead.status === "won"
        ? "Chiudi cartella amministrativa e attiva post-vendita."
        : "Archivia motivazione e reimposta nurturing su lookalike.";
    nextActionRationale =
      lead.status === "won"
        ? "Lead concluso positivamente: riduci rumore operativo e focalizza fulfillment."
        : "Chiusura negativa: documenta il motivo per analytics e pipeline future.";
  } else if (nVisit === 0 && (lead.status === "qualified" || lead.status === "visit_scheduled")) {
    nextAction = "Conferma data e luogo visita, invia promemoria e checklist documenti.";
    nextActionRationale =
      "La fase richiede ancoraggio logistico: riduce no-show e accelera la trattativa.";
  } else if (nCall === 0 && nWhatsapp === 0) {
    nextAction = "Apri un canale diretto (chiamata breve o WhatsApp) entro 24h.";
    nextActionRationale =
      "Manca un touchpoint umano recente: aumenta fiducia e velocità di risposta.";
  } else if (nNote === 0) {
    nextAction = "Registra una nota sintetica con prossimo passo e owner.";
    nextActionRationale = "Allinea il team su contesto e responsabilità senza perdere contesto.";
  } else {
    nextAction = "Aggiorna stato pipeline dopo l’ultimo contatto e pianifica follow-up.";
    nextActionRationale =
      "Mantieni allineamento tra timeline reale e fase commerciale per forecasting pulito.";
  }

  return {
    activitySummary,
    conversionPct,
    nextAction,
    nextActionRationale,
    signals: signals.slice(0, 3),
  };
}
