/**
 * Normalizes a phone/WhatsApp number to E.164 for the sending providers.
 *
 * Same assumption already used elsewhere in the app (see
 * `buildWhatsAppLink` in `@/lib/funnel/staleness.ts`): strip
 * non-digits, assume Italy (+39) when no country code is present.
 * Returns null when there's nothing usable — callers must exclude
 * that recipient rather than guess.
 */
export function normalizeToE164(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (!digits) return null;
  const withCountry = digits.startsWith("39") ? digits : `39${digits}`;
  // An Italian number is 39 + 9 or 10 digits; anything much shorter is
  // almost certainly bad data (e.g. a partial/placeholder entry).
  if (withCountry.length < 11) return null;
  return `+${withCountry}`;
}
