/**
 * Property photos storage helpers.
 *
 * Path convention (set in `buildPropertyPhotoPath`):
 *   agencies/{agencyId}/properties/{propertyId}/{uuid}.{ext}
 *
 * Cover-image convention (enforced by server actions, not by DB):
 *   `properties.photos[0]` is the cover image. `photos[1..]` are the
 *   gallery in display order. The `setPropertyPhotoCover` server
 *   action moves a chosen path to index 0 to "set as cover".
 */

export const PROPERTY_PHOTOS_BUCKET = "property-photos";
export const PROPERTY_PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const PROPERTY_PHOTO_ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
export type PropertyPhotoMime = (typeof PROPERTY_PHOTO_ALLOWED_MIMES)[number];

/**
 * Build a storage path for a new property photo.
 * Returns a path like:
 *   agencies/{agencyId}/properties/{propertyId}/{uuid}.{ext}
 *
 * The UUID prevents filename collisions when the same image is uploaded
 * multiple times, and makes paths effectively immutable (good for caching).
 */
export function buildPropertyPhotoPath(
  agencyId: string,
  propertyId: string,
  ext: string,
): string {
  const cleanExt = ext.replace(/^\./, "").toLowerCase();
  const uuid = crypto.randomUUID();
  return `agencies/${agencyId}/properties/${propertyId}/${uuid}.${cleanExt}`;
}

/**
 * Convert a MIME type to a file extension for storage paths.
 */
export function mimeToExtension(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

/**
 * Build the public URL for a stored photo path.
 *
 * Uses NEXT_PUBLIC_SUPABASE_URL so it works in both server and client
 * components without needing to instantiate a Supabase client. Pure URL
 * construction is faster than `supabase.storage.getPublicUrl()` and
 * doesn't require an async boundary.
 */
export function getPropertyPhotoUrl(path: string): string {
  // Se è già un URL assoluto (es. foto hero caricate nella root del bucket), usalo direttamente.
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not configured. Cannot build photo URL.",
    );
  }
  return `${supabaseUrl}/storage/v1/object/public/${PROPERTY_PHOTOS_BUCKET}/${path}`;
}

/**
 * Convenience: map an array of paths to public URLs.
 * Empty input yields an empty array.
 */
export function getPropertyPhotoUrls(paths: string[]): string[] {
  return paths.map(getPropertyPhotoUrl);
}
