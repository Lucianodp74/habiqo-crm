"use server";

import { openai } from "@/lib/ai/openai";
import type { ActionResult } from "@habiquo/types";

// ──────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────

export type PropertyAIInput = {
  contractType: "vendita" | "affitto";
  propertyType: string;
  city: string;
  price: number;
  sqm: number;
  bedrooms: number;
  bathrooms: number;
};

export type PropertyAIContent = {
  title: string;
  description: string;
  amenities: string[];
  seoTitle: string;
  socialCaption: string;
};

type GenerateResult = ActionResult<PropertyAIContent>;

// ──────────────────────────────────────────────────────────────────────
// Messages
// ──────────────────────────────────────────────────────────────────────

const MSG = {
  VALIDATION: "Dati immobile incompleti per generare il contenuto.",
  EMPTY_RESPONSE: "Risposta AI vuota. Riprova.",
  INVALID_JSON: "Risposta AI non in JSON valido. Riprova.",
  INVALID_FORMAT: "Risposta AI con formato incompleto. Riprova.",
  API_ERROR: "Errore di comunicazione con l'AI. Riprova.",
} as const;

// ──────────────────────────────────────────────────────────────────────
// Prompt building
// ──────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Sei un copywriter immobiliare italiano premium.
Scrivi annunci per un'agenzia indipendente di alta qualità.

Linee guida:
- Tono editoriale, professionale, sobrio
- Italiano corretto e naturale
- Niente parole hype tipo "fantastico", "incredibile", "imperdibile", "occasione"
- Niente esagerazioni o invenzioni: descrivi solo quello che è derivabile dai dati forniti
- Niente claim non verificabili tipo "in zona prestigiosa" senza contesto
- Stile diretto, non rivolgersi al lettore in seconda persona singolare`;

function buildUserPrompt(input: PropertyAIInput): string {
  const priceFormatted =
    input.contractType === "vendita"
      ? `${input.price.toLocaleString("it-IT")} €`
      : `${input.price.toLocaleString("it-IT")} €/mese`;

  return `Genera contenuto per questo immobile.

Dati:
- Contratto: ${input.contractType}
- Tipologia: ${input.propertyType}
- Città: ${input.city}
- Prezzo: ${priceFormatted}
- Metratura: ${input.sqm} mq
- Camere: ${input.bedrooms}
- Bagni: ${input.bathrooms}

Restituisci ESCLUSIVAMENTE un oggetto JSON valido (senza markdown, senza testo prima o dopo) con esattamente questi campi:

{
  "title": string (massimo 60 caratteri, evocativo ma sobrio, in italiano),
  "description": string (3-4 paragrafi separati da \\n\\n, descrive l'immobile e il target ideale, tono editoriale),
  "amenities": array di 5-8 stringhe (caratteristiche e accessori plausibili e tipici per questa tipologia e metratura, in italiano),
  "seoTitle": string (massimo 60 caratteri, ottimizzato per la ricerca, include città e tipologia),
  "socialCaption": string (1-2 frasi adatte a Instagram o Facebook, italiano naturale, massimo 1 emoji)
}`;
}

// ──────────────────────────────────────────────────────────────────────
// Validation helpers
// ──────────────────────────────────────────────────────────────────────

function isInputValid(input: PropertyAIInput): boolean {
  return (
    !!input.city?.trim() &&
    !!input.propertyType?.trim() &&
    !!input.contractType &&
    Number.isFinite(input.price) &&
    input.price > 0 &&
    Number.isFinite(input.sqm) &&
    input.sqm > 0 &&
    input.bedrooms >= 0 &&
    input.bathrooms >= 0
  );
}

function isContentValid(raw: unknown): raw is PropertyAIContent {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return (
    typeof o.title === "string" &&
    typeof o.description === "string" &&
    Array.isArray(o.amenities) &&
    o.amenities.every((a) => typeof a === "string") &&
    typeof o.seoTitle === "string" &&
    typeof o.socialCaption === "string"
  );
}

// ──────────────────────────────────────────────────────────────────────
// Server action
// ──────────────────────────────────────────────────────────────────────

/**
 * Generates AI property listing content from minimal form data.
 * Uses GPT-4o via OpenAI API. Form-data only (no photo vision).
 *
 * Returns Italian copy: title, description, amenities, SEO title,
 * social caption. The caller is responsible for displaying the result
 * for review and persisting it after confirmation.
 */
export async function generatePropertyContent(
  input: PropertyAIInput,
): Promise<GenerateResult> {
  if (!isInputValid(input)) {
    return {
      ok: false,
      error: { code: "validation_error", message: MSG.VALIDATION },
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return {
        ok: false,
        error: { code: "unknown", message: MSG.EMPTY_RESPONSE },
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return {
        ok: false,
        error: { code: "unknown", message: MSG.INVALID_JSON },
      };
    }

    if (!isContentValid(parsed)) {
      return {
        ok: false,
        error: { code: "unknown", message: MSG.INVALID_FORMAT },
      };
    }

    return { ok: true, data: parsed };
  } catch (err) {
    console.error("generatePropertyContent: API error", err);
    return {
      ok: false,
      error: { code: "unknown", message: MSG.API_ERROR },
    };
  }
}
