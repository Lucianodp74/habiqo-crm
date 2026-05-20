/**
 * Habiquo XML Feed — portal mapping tables
 *
 * IDType values for Immobiliare.it building types.
 * Source: Immobiliare.it feed documentation (feed.immobiliare.it)
 *
 * Unmapped types fall back to IDType 4 (Appartamento).
 */

export const IMMOBILIARE_BUILDING_TYPE: Record<string, number> = {
  "Appartamento":       4,
  "Bilocale":           4,
  "Trilocale":          4,
  "Quadrilocale":       4,
  "Villa":              2,
  "Casa indipendente":  7,
  "Attico":             8,
  "Loft":               4,
  "Mansarda":           8,
  "Ufficio":            23,
  "Negozio":            28,
  "Box / Garage":       37,
};

export function getImmobiliareBuildingType(propertyType: string): number {
  return IMMOBILIARE_BUILDING_TYPE[propertyType] ?? 4;
}

/**
 * Immobiliare.it transaction type
 * S = sale (vendita), R = rent (affitto)
 */
export function getImmobiliareTransactionType(listingType: "sale" | "rent"): "S" | "R" {
  return listingType === "sale" ? "S" : "R";
}
