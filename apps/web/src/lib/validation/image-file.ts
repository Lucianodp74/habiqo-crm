/**
 * Shared client-side validation for image uploads (size + format).
 *
 * Runs in the browser BEFORE a file is sent to a Server Action, so an
 * oversized file never hits the network layer. Without this, a file
 * larger than the Server Action body size limit (next.config.ts,
 * `serverActions.bodySizeLimit`) is rejected by Next.js itself with a
 * generic error page, instead of the clear application message.
 *
 * IMPORTANT: this is a UX improvement only. It does NOT replace
 * server-side validation — every upload action must keep validating
 * independently, since client-side checks can always be bypassed.
 */

const MIME_LABELS: Record<string, string> = {
  "image/jpeg": "JPG",
  "image/png": "PNG",
  "image/webp": "WEBP",
  "image/avif": "AVIF",
};

export type ImageFileValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateImageFile(
  file: File,
  options: { maxBytes: number; allowedMimes: readonly string[] },
): ImageFileValidationResult {
  if (file.size > options.maxBytes) {
    const maxMb = Math.round(options.maxBytes / (1024 * 1024));
    return {
      ok: false,
      message: `Il file supera i ${maxMb} MB consentiti.`,
    };
  }

  if (!options.allowedMimes.includes(file.type)) {
    const labels = options.allowedMimes
      .map((mime) => MIME_LABELS[mime] ?? mime)
      .join(", ");
    return {
      ok: false,
      message: `Formato non supportato. Accettati: ${labels}.`,
    };
  }

  return { ok: true };
}
