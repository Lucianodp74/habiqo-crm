import { z } from "zod";

export const VERSION = "lead-insights@v1";

/**
 * Generates structured AI insights for a lead based on its
 * profile and event timeline.
 */

export const leadInsightsSchema = z.object({
  sentimentScore: z
    .number()
    .min(-1)
    .max(1)
    .describe("Tono delle interazioni, da -1 (negativo) a +1 (positivo)"),
  sentimentLabel: z.string().describe("Etichetta breve in italiano: Positivo, Neutro, Negativo"),
  urgencyLevel: z.enum(["low", "medium", "high"]),
  urgencyDetail: z.string().describe("Spiegazione breve in italiano del livello di urgenza"),
  affordabilityMin: z.number().int().nullable(),
  affordabilityMax: z.number().int().nullable(),
  affordabilityBasis: z
    .string()
    .nullable()
    .describe("Frase italiana che spiega da quali segnali deriva la stima di budget"),
  nextActionHeadline: z
    .string()
    .max(80)
    .describe("Azione consigliata, una frase imperativa breve in italiano"),
  nextActionReason: z
    .string()
    .max(400)
    .describe("Motivazione concreta basata sui dati, in italiano"),
  riskIndicators: z
    .array(
      z.object({
        level: z.enum(["low", "medium", "high"]),
        text: z.string().max(160),
      }),
    )
    .max(5),
});

export type LeadInsightsOutput = z.infer<typeof leadInsightsSchema>;

export const SYSTEM_PROMPT = `Sei un analista senior di un CRM immobiliare italiano (HABIQUO).
Il tuo compito è analizzare il profilo di un lead e i suoi eventi di interazione per produrre
insight azionabili per l'agente immobiliare.

Regole:
- Scrivi sempre in italiano professionale, come un consulente esperto.
- Sii concreto: ogni affermazione deve essere ancorata a un dato presente negli eventi.
- Non inventare informazioni che non sono nei dati. Se mancano, indica "low" come urgenza.
- Le azioni consigliate devono essere specifiche (es. "Proponi visita per Via X entro venerdì")
  non generiche (es. "Contatta il cliente").
- I rischi indicano segnali deboli: visualizzazioni di competitor, calo nei tempi di risposta,
  obiezioni ricorrenti.
- Mai includere copy promozionale o sales-y.
- Output strettamente conforme allo schema JSON richiesto.`;

export type LeadInsightsInput = {
  lead: {
    fullName: string;
    status: string;
    source: string;
    budgetMinEur: number | null;
    budgetMaxEur: number | null;
    preferredZones: string[];
    tags: string[];
    capturedDaysAgo: number;
  };
  events: Array<{
    type: string;
    occurredAt: string;
    title: string;
    detail: string | null;
  }>;
};

export function buildPrompt(input: LeadInsightsInput): string {
  const eventsText = input.events
    .slice(0, 30) // cap context window
    .map((e) => `[${e.occurredAt}] ${e.type.toUpperCase()} · ${e.title}${e.detail ? ` — ${e.detail}` : ""}`)
    .join("\n");

  return `LEAD
────
Nome: ${input.lead.fullName}
Status pipeline: ${input.lead.status}
Sorgente: ${input.lead.source}
Acquisito: ${input.lead.capturedDaysAgo} giorni fa
Budget: ${
    input.lead.budgetMinEur != null && input.lead.budgetMaxEur != null
      ? `€${input.lead.budgetMinEur.toLocaleString("it-IT")} – €${input.lead.budgetMaxEur.toLocaleString("it-IT")}`
      : "non specificato"
  }
Zone preferite: ${input.lead.preferredZones.join(", ") || "non specificate"}
Tag: ${input.lead.tags.join(", ") || "nessuno"}

EVENTI (${input.events.length})
─────
${eventsText || "(nessun evento registrato)"}

Genera gli insight strutturati per questo lead.`;
}
