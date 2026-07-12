/**
 * Agency hero/cover photo storage helpers.
 *
 * Reuses the same Storage bucket as property photos (`property-photos`),
 * whose RLS policies are bucket-scoped only (not path-scoped) — so no new
 * bucket or policy is needed for this feature.
 *
 * Path convention:
 *   agencies/{agencyId}/{uuid}.{ext}
 * (root of the agency folder, sibling to `agencies/{agencyId}/properties/...`)
 */
export const AGENCY_HERO_PHOTO_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const AGENCY_HERO_PHOTO_ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export type AgencyHeroPhotoMime = (typeof AGENCY_HERO_PHOTO_ALLOWED_MIMES)[number];

export function buildAgencyHeroPhotoPath(agencyId: string, ext: string): string {
  const cleanExt = ext.replace(/^\./, "").toLowerCase();
  const uuid = crypto.randomUUID();
  return `agencies/${agencyId}/${uuid}.${cleanExt}`;
}

export function mimeToExtension(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}
