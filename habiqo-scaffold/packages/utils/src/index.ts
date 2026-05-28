/**
 * Italian-locale formatters and pure utilities.
 * No side effects, no external state.
 */

const EUR = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const EUR_PRECISE = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const NUMBER_IT = new Intl.NumberFormat("it-IT");

/**
 * Format an integer EUR amount using Italian locale.
 * @example formatEur(420000) → "€ 420.000"
 */
export function formatEur(amount: number, opts: { precise?: boolean } = {}): string {
  return (opts.precise ? EUR_PRECISE : EUR).format(amount);
}

/**
 * Compact currency for cards/badges.
 * @example formatEurCompact(420000) → "€420k"
 * @example formatEurCompact(1500000) → "€1,5M"
 */
export function formatEurCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `€${NUMBER_IT.format(Number((amount / 1_000_000).toFixed(1)))}M`;
  }
  if (amount >= 1_000) {
    return `€${Math.round(amount / 1_000)}k`;
  }
  return `€${amount}`;
}

/**
 * Format a budget range.
 * @example formatBudgetRange(420000, 480000) → "€ 420.000 – € 480.000"
 */
export function formatBudgetRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "Non specificato";
  if (min != null && max != null) return `${formatEur(min)} – ${formatEur(max)}`;
  if (min != null) return `da ${formatEur(min)}`;
  if (max != null) return `fino a ${formatEur(max)}`;
  return "Non specificato";
}

// ─── Date formatters ─────────────────────────────────────────────

const DATE_FULL = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATE_SHORT = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
});

const DATETIME = new Intl.DateTimeFormat("it-IT", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** "12 marzo 2026" */
export function formatDate(date: Date | string): string {
  return DATE_FULL.format(typeof date === "string" ? new Date(date) : date);
}

/** "12 mar" */
export function formatDateShort(date: Date | string): string {
  return DATE_SHORT.format(typeof date === "string" ? new Date(date) : date);
}

/** "12 mar, 14:32" */
export function formatDateTime(date: Date | string): string {
  return DATETIME.format(typeof date === "string" ? new Date(date) : date);
}

/**
 * Relative time, Italian.
 * @example formatRelative(date) → "3 minuti fa", "ieri", "2 giorni fa"
 */
export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hour = Math.floor(min / 60);
  const day = Math.floor(hour / 24);

  if (sec < 60) return "adesso";
  if (min < 60) return `${min} minut${min === 1 ? "o" : "i"} fa`;
  if (hour < 24) return `${hour} or${hour === 1 ? "a" : "e"} fa`;
  if (day === 1) return "ieri";
  if (day < 7) return `${day} giorni fa`;
  if (day < 30) return `${Math.floor(day / 7)} settimane fa`;
  if (day < 365) return `${Math.floor(day / 30)} mesi fa`;
  return formatDate(d);
}

// ─── Phone ───────────────────────────────────────────────────────

/**
 * Normalize Italian phone numbers to E.164.
 * @example normalizePhone("333 124 5678") → "+393331245678"
 * @example normalizePhone("+39 333 124 5678") → "+393331245678"
 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 0) return null;
  if (digits.startsWith("39") && digits.length >= 11) return `+${digits}`;
  if (digits.length === 10) return `+39${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  return digits.startsWith("+") ? digits : `+${digits}`;
}

/**
 * Format phone for display: "+39 333 124 5678"
 */
export function formatPhone(e164: string | null): string {
  if (!e164) return "";
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("39") && digits.length === 12) {
    return `+39 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  return e164;
}

// ─── Misc ────────────────────────────────────────────────────────

/**
 * Throw if value is null/undefined. Use to satisfy TS narrowing in places
 * where business logic guarantees a value but the type system can't prove it.
 */
export function invariant<T>(value: T | null | undefined, message: string): asserts value is T {
  if (value == null) {
    throw new Error(`Invariant failed: ${message}`);
  }
}

/**
 * Get initials from a full name. "Marco Bianchi" → "MB"
 */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  const first = parts[0]!.charAt(0);
  const last = parts[parts.length - 1]!.charAt(0);
  return `${first}${last}`.toUpperCase();
}

/**
 * Type-safe Object.keys.
 */
export function objectKeys<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Sleep helper (mostly for testing).
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
