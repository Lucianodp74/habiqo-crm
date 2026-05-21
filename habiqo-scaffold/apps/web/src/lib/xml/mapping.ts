/**
 * Habiquo XML Feed — portal mapping tables
 */

// ─── Immobiliare.it ───────────────────────────────────────────────────────────

export const IMMOBILIARE_BUILDING_TYPE: Record<string, number> = {
  "Appartamento":      4,
  "Bilocale":          4,
  "Trilocale":         4,
  "Quadrilocale":      4,
  "Villa":             2,
  "Casa indipendente": 7,
  "Attico":            8,
  "Loft":              4,
  "Mansarda":          8,
  "Ufficio":           23,
  "Negozio":           28,
  "Box / Garage":      37,
};

export function getImmobiliareBuildingType(propertyType: string): number {
  return IMMOBILIARE_BUILDING_TYPE[propertyType] ?? 4;
}

export function getImmobiliareTransactionType(listingType: "sale" | "rent"): "S" | "R" {
  return listingType === "sale" ? "S" : "R";
}

// ─── Idealista ────────────────────────────────────────────────────────────────
// Property type codes used by Idealista IT for gestionali import.
// Source: Idealista partner documentation (standard ITA market).

export const IDEALISTA_PROPERTY_TYPE: Record<string, string> = {
  "Appartamento":      "flat",
  "Bilocale":          "flat",
  "Trilocale":         "flat",
  "Quadrilocale":      "flat",
  "Villa":             "house",
  "Casa indipendente": "house",
  "Attico":            "penthouse",
  "Loft":              "flat",
  "Mansarda":          "penthouse",
  "Ufficio":           "office",
  "Negozio":           "shop",
  "Box / Garage":      "garage",
};

export function getIdealistaPropertyType(propertyType: string): string {
  return IDEALISTA_PROPERTY_TYPE[propertyType] ?? "flat";
}

export function getIdealistaOperation(listingType: "sale" | "rent"): string {
  return listingType === "sale" ? "sale" : "rent";
}
