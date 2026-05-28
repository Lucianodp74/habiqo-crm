/**
 * Habiquo XML Feed — shared types
 *
 * NormalizedProperty is the internal representation used by all
 * portal formatters. Each formatter maps from NormalizedProperty
 * to the portal-specific XML schema.
 */

export type ListingType = "sale" | "rent";

export interface NormalizedProperty {
  id: string;
  title: string;
  description: string | null;
  listingType: ListingType;
  propertyType: string;
  price: number;
  surfaceSqm: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  address: string | null;
  city: string;
  postalCode: string | null;
  region: string | null;
  floor: number | null;
  hasElevator: boolean;
  hasGarage: boolean;
  energyClass: string | null;
  photos: string[];
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface NormalizedAgency {
  id: string;
  slug: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
}
