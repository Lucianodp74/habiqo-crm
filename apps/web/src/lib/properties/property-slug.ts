/**
 * Slug of a public property page: /{agencySlug}/immobili/{slug}.
 *
 * Must always satisfy the database constraint properties_slug_format_chk
 * (migration 0012): lowercase a-z, 0-9 and "-", starting and ending with
 * a letter or digit, at most 60 characters.
 *
 * The slug is derived from the title but never changes it: only the slug
 * is shortened.
 */

/** Same pattern as properties_slug_format_chk. */
export const PROPERTY_SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])?$/;
export const PROPERTY_SLUG_MAX_LENGTH = 60;

const SUFFIX_LENGTH = 5;
const SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const FALLBACK_BASE = "immobile";

/**
 * Lowercase, accents removed ("Città" -> "citta"), every run of other
 * characters (spaces, punctuation, emoji, symbols) turned into one "-",
 * no leading or trailing "-".
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "") // combining marks left by NFD (accents)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Exactly SUFFIX_LENGTH random characters from [a-z0-9]. */
export function randomSlugSuffix(): string {
  const bytes = new Uint8Array(SUFFIX_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += SUFFIX_ALPHABET[b % SUFFIX_ALPHABET.length];
  return out;
}

/**
 * "{base}-{suffix}" with the base cut so the whole slug fits in 60
 * characters. The cut never leaves a trailing "-"; an empty base (title
 * with only emoji or symbols) falls back to "immobile".
 */
export function generateUniqueSlug(title: string, suffix: string = randomSlugSuffix()): string {
  const cleanSuffix = slugify(suffix).slice(0, SUFFIX_LENGTH) || randomSlugSuffix();
  const maxBase = PROPERTY_SLUG_MAX_LENGTH - 1 - cleanSuffix.length;
  const base = slugify(title).slice(0, maxBase).replace(/-+$/, "") || FALLBACK_BASE;
  return `${base}-${cleanSuffix}`;
}

export function isValidPropertySlug(slug: string): boolean {
  return PROPERTY_SLUG_PATTERN.test(slug);
}
