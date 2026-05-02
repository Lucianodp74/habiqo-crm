/**
 * HABIQO domain types
 * ─────────────────────────────────────────────────────────────
 * These mirror the Postgres schema but live separately so the
 * domain model can evolve independently of generated DB types.
 *
 * For raw DB row types, import from @habiqo/database (auto-generated).
 * For domain types (with computed fields, enums-as-unions), use these.
 */

// ─── Enums ────────────────────────────────────────────────────────

export type AgencyRole = "owner" | "admin" | "agent" | "viewer";

export type LeadStatus = "new" | "qualified" | "in_negotiation" | "won" | "lost";

export type LeadTemperature = "cold" | "warm" | "hot";

export type LeadSource =
  | "valuation"
  | "portal"
  | "manual"
  | "referral"
  | "website"
  | "whatsapp";

export type PropertyStatus = "draft" | "active" | "reserved" | "sold" | "archived";

export type PropertyListingType = "sale" | "rent";

export type EventType =
  | "note"
  | "call"
  | "email"
  | "whatsapp"
  | "visit"
  | "view"
  | "ai_insight"
  | "status_change";

export type UrgencyLevel = "low" | "medium" | "high";

// ─── Result type — discriminated union for all action returns ────

export type ActionResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: ActionErrorCode;
        message: string;
        fields?: Record<string, string[]>;
      };
    };

export type ActionErrorCode =
  | "validation_error"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "ai_quota_exceeded"
  | "db_error"
  | "unknown";

// ─── Core domain entities ────────────────────────────────────────

export type Agency = {
  id: string;
  name: string;
  vatNumber: string | null;
  pecEmail: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
  plan: "starter" | "pro" | "agency" | "enterprise";
  trialEndsAt: Date | null;
  createdAt: Date;
};

export type Profile = {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  phone: string | null;
  locale: string;
};

export type Lead = {
  id: string;
  agencyId: string;
  assignedTo: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  status: LeadStatus;
  temperature: LeadTemperature;
  source: LeadSource;
  sourceDetail: string | null;
  aiScore: number | null;
  conversionProbability: number | null;
  budgetMinEur: number | null;
  budgetMaxEur: number | null;
  preferredZones: string[];
  tags: string[];
  notes: string | null;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LeadEvent = {
  id: string;
  leadId: string;
  type: EventType;
  title: string;
  detail: string | null;
  metadata: Record<string, unknown>;
  actorId: string | null;
  occurredAt: Date;
};

export type LeadInsights = {
  leadId: string;
  sentimentScore: number | null;
  sentimentLabel: string | null;
  urgencyLevel: UrgencyLevel | null;
  urgencyDetail: string | null;
  affordabilityMin: number | null;
  affordabilityMax: number | null;
  affordabilityBasis: string | null;
  nextActionHeadline: string | null;
  nextActionReason: string | null;
  riskIndicators: RiskIndicator[];
  modelVersion: string;
  generatedAt: Date;
};

export type RiskIndicator = {
  level: "low" | "medium" | "high";
  text: string;
};

export type Property = {
  id: string;
  agencyId: string;
  listingType: PropertyListingType;
  status: PropertyStatus;
  title: string;
  description: string | null;
  address: string;
  city: string;
  postalCode: string | null;
  region: string | null;
  priceEur: number;
  rooms: number | null;
  bathrooms: number | null;
  sqm: number | null;
  floor: number | null;
  hasElevator: boolean | null;
  hasGarage: boolean | null;
  energyClass: string | null;
  photos: string[];
  publishedTo: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type PropertyMatch = {
  leadId: string;
  propertyId: string;
  similarity: number;
  reasons: string[];
  computedAt: Date;
};
