/**
 * HABIQUO · Funnel Intelligence — Staleness Engine
 *
 * Calcola quanto tempo è passato dall'ultima attività su un lead
 * e determina se è "freddo" in base allo stage corrente.
 *
 * Nessuna dipendenza esterna. Nessuna chiamata DB.
 * Logica pura — usabile su client e server.
 */

// ─── Soglie per stage (giorni) ────────────────────────────────────
// Dopo quanti giorni di inattività un lead è considerato stale.
const STALE_DAYS_BY_STATUS: Record<string, number> = {
  new:              2,
  qualified:        5,
  visit_scheduled:  3,
  in_negotiation:   7,
  won:              Infinity, // mai stale
  lost:             Infinity, // mai stale
};

const DEFAULT_STALE_DAYS = 5;

export type StalenessLevel = "fresh" | "warning" | "stale" | "critical";

export type StalenessInfo = {
  /** Giorni dall'ultima attività. */
  daysSinceActivity: number;
  /** Il lead è considerato inattivo per il suo stage? */
  isStale: boolean;
  /** Livello di urgenza visiva. */
  level: StalenessLevel;
  /** Etichetta leggibile. Es: "5 giorni fa" */
  label: string;
  /** Soglia di stale per questo stage (giorni). */
  thresholdDays: number;
};

// ─── Calcolo principale ───────────────────────────────────────────

/**
 * Calcola la staleness di un lead dato il suo status e la data
 * dell'ultima attività.
 *
 * @param status      Valore lead_status (es. "new", "qualified")
 * @param lastActivityAt ISO string | null — last_activity_at dal DB
 * @param updatedAt   ISO string | null — fallback
 * @param createdAt   ISO string | null — fallback finale
 */
export function computeStaleness(
  status: string,
  lastActivityAt: string | null,
  updatedAt: string | null,
  createdAt: string | null,
): StalenessInfo {
  const threshold = STALE_DAYS_BY_STATUS[status] ?? DEFAULT_STALE_DAYS;

  // Usa la data più recente disponibile
  const referenceIso = lastActivityAt ?? updatedAt ?? createdAt;
  const referenceDate = referenceIso ? new Date(referenceIso) : null;

  const now = Date.now();
  const daysSinceActivity = referenceDate
    ? Math.floor((now - referenceDate.getTime()) / 86_400_000)
    : 999;

  const isStale = threshold !== Infinity && daysSinceActivity >= threshold;

  // Livello visivo
  let level: StalenessLevel;
  if (threshold === Infinity) {
    level = "fresh";
  } else if (daysSinceActivity >= threshold * 2) {
    level = "critical";
  } else if (daysSinceActivity >= threshold) {
    level = "stale";
  } else if (daysSinceActivity >= threshold * 0.7) {
    level = "warning";
  } else {
    level = "fresh";
  }

  // Label leggibile
  let label: string;
  if (daysSinceActivity === 0) {
    label = "oggi";
  } else if (daysSinceActivity === 1) {
    label = "ieri";
  } else {
    label = `${daysSinceActivity} giorni fa`;
  }

  return { daysSinceActivity, isStale, level, label, thresholdDays: threshold };
}

// ─── Helpers per UI ───────────────────────────────────────────────

/** Colore Tailwind per il badge in base al livello. */
export function stalenessColor(level: StalenessLevel): string {
  switch (level) {
    case "critical": return "text-red-600 bg-red-50 border-red-200";
    case "stale":    return "text-orange-600 bg-orange-50 border-orange-200";
    case "warning":  return "text-amber-600 bg-amber-50 border-amber-200";
    default:         return "text-green-600 bg-green-50 border-green-200";
  }
}

/** Dot color per il badge minimale sulla card. */
export function stalenessDotColor(level: StalenessLevel): string {
  switch (level) {
    case "critical": return "bg-red-500";
    case "stale":    return "bg-orange-400";
    case "warning":  return "bg-amber-400";
    default:         return "bg-green-400";
  }
}

/**
 * Testo suggerito per il next action banner.
 * Basato su stage e giorni di inattività.
 */
export function nextActionSuggestion(
  status: string,
  daysSinceActivity: number,
  leadName: string,
): string {
  const first = leadName.split(" ")[0] ?? leadName;

  switch (status) {
    case "new":
      return daysSinceActivity >= 1
        ? `${first} non è ancora stato contattato. Scrivi ora per fare una buona prima impressione.`
        : `Nuovo lead. Contatta ${first} al più presto.`;
    case "qualified":
      return `${first} è qualificato ma inattivo da ${daysSinceActivity} giorni. Proponi una visita.`;
    case "visit_scheduled":
      return `Visita in programma con ${first}. Conferma l'appuntamento e prepara i documenti.`;
    case "in_negotiation":
      return `La trattativa con ${first} è ferma da ${daysSinceActivity} giorni. Riprendi il contatto.`;
    default:
      return `Ricontatta ${first} per mantenere il rapporto attivo.`;
  }
}

/**
 * Template WhatsApp precompilato per stage.
 * Variabili: {{nome}}, {{agente}}, {{agenzia}}
 */
export function whatsappTemplate(
  status: string,
  leadName: string,
  agentName: string,
  agencyName: string,
): string {
  const first = leadName.split(" ")[0] ?? leadName;

  switch (status) {
    case "new":
      return `Ciao ${first}, sono ${agentName} di ${agencyName}. Ho ricevuto la tua richiesta e volevo contattarti per capire come posso aiutarti. Quando sei disponibile per una breve chiamata?`;
    case "qualified":
      return `Ciao ${first}, sono ${agentName}. Ho selezionato alcuni immobili che potrebbero fare al caso tuo. Possiamo sentirci questa settimana per farteli vedere?`;
    case "visit_scheduled":
      return `Ciao ${first}, ti confermo la visita. Hai bisogno di ulteriori informazioni prima di arrivare? Sono a tua disposizione.`;
    case "in_negotiation":
      return `Ciao ${first}, volevo aggiornarti sull'andamento della trattativa. Hai avuto modo di riflettere sulla proposta? Possiamo sentirci?`;
    default:
      return `Ciao ${first}, sono ${agentName} di ${agencyName}. Volevo tenermi in contatto e capire se posso esserti utile. Come stai?`;
  }
}

/** Costruisce il link wa.me con testo precompilato. */
export function buildWhatsAppLink(
  phone: string | null,
  whatsapp: string | null,
  message: string,
): string | null {
  const raw = (whatsapp ?? phone ?? "").replace(/\D/g, "");
  if (!raw) return null;
  const e164 = raw.startsWith("39") ? raw : `39${raw}`;
  return `https://wa.me/${e164}?text=${encodeURIComponent(message)}`;
}
