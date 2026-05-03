import { NON_SPECIFICATO } from "@/lib/crm/missing-value";
import type { PipelineLead } from "./pipeline";

export function formatCurrencyEur(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return NON_SPECIFICATO;
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatBudgetRange(
  lead: Pick<PipelineLead, "budgetMinEur" | "budgetMaxEur">,
): string {
  const min = lead.budgetMinEur;
  const max = lead.budgetMaxEur;
  if (min == null && max == null) return NON_SPECIFICATO;
  if (min != null && max != null) return `${formatCurrencyEur(min)} – ${formatCurrencyEur(max)}`;
  return formatCurrencyEur(min ?? max);
}

export function formatZones(zones: string[], max = 2): string {
  if (!zones.length) return NON_SPECIFICATO;
  const shown = zones.slice(0, max);
  return shown.join(", ") + (zones.length > max ? "…" : "");
}

const SOURCE_LABELS: Record<string, string> = {
  valuation: "Valutazione",
  portal: "Portale",
  idealista: "Idealista",
  facebook: "Facebook",
  manual: "Manuale",
  referral: "Referral",
  website: "Website",
  whatsapp: "WhatsApp",
};

export function formatLeadSource(source: string, detail: string | null): string {
  const d = detail?.toLowerCase() ?? "";
  if (source === "portal" && d.includes("idealista")) return "Idealista";
  return SOURCE_LABELS[source] ?? source;
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  apartment: "Appartamento",
  villa: "Villa",
  townhouse: "Villetta",
  office: "Ufficio",
  land: "Terreno",
  commercial: "Commerciale",
};

export function formatPropertyType(raw: string | null): string {
  if (!raw) return NON_SPECIFICATO;
  const key = raw.toLowerCase();
  return PROPERTY_TYPE_LABELS[key] ?? raw;
}

export type DisplayUrgency = "low" | "medium" | "high" | "critical";

export function resolveDisplayUrgency(lead: PipelineLead): DisplayUrgency {
  const p = lead.leadPriority;
  if (p === "low" || p === "medium" || p === "high" || p === "critical") return p;
  const insight = lead.insightUrgency;
  if (insight === "high") return "high";
  if (insight === "medium") return "medium";
  if (insight === "low") return "low";
  if (lead.temperature === "hot") return "high";
  if (lead.temperature === "warm") return "medium";
  return "low";
}

export function urgencyLabel(u: DisplayUrgency): string {
  const labels: Record<DisplayUrgency, string> = {
    low: "Bassa",
    medium: "Media",
    high: "Alta",
    critical: "Critica",
  };
  return labels[u];
}
