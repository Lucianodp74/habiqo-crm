import type { PublicProperty } from "@/lib/habita/properties";
import { getPropertyPhotoUrl } from "@/lib/storage/property-photos";

type Props = {
  property: PublicProperty;
};

/**
 * Habita · property gallery.
 *
 * Renders real photos when available:
 *   - Hero (16:9) using `photos[0]` as cover
 *   - Thumbnail row below for the rest, capped at 4 visible
 *   - If more than 5 photos total, the 4th thumb shows a "+ N altre" overlay
 *
 * Falls back to the original placeholder gradient when no photos exist.
 */
export function PropertyGallery({ property }: Props) {
  const photos = property.photos;

  if (photos.length === 0) {
    return (
      <div
        className="aspect-[16/9] rounded-lg overflow-hidden flex items-center justify-center"
        style={{
          background:
            "linear-gradient(135deg, var(--bg-canvas) 0%, color-mix(in srgb, var(--accent-deep) 12%, var(--bg-canvas)) 100%)",
        }}
      >
        <span className="text-xs uppercase tracking-widest text-[var(--fg-secondary)] opacity-50">
          Foto in arrivo
        </span>
      </div>
    );
  }

  const cover = photos[0]!;
  const rest = photos.slice(1);
  const thumbsVisible = rest.slice(0, 4);
  const overflow = rest.length - thumbsVisible.length;

  return (
    <div className="space-y-2">
      {/* Hero */}
      <div className="aspect-[16/9] rounded-lg overflow-hidden bg-[var(--bg-canvas)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getPropertyPhotoUrl(cover)}
          alt={property.title}
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {thumbsVisible.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {thumbsVisible.map((path, index) => {
            const isLastAndHasOverflow =
              index === thumbsVisible.length - 1 && overflow > 0;
            return (
              <div
                key={path}
                className="relative aspect-square rounded-md overflow-hidden bg-[var(--bg-canvas)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPropertyPhotoUrl(path)}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {isLastAndHasOverflow ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55 text-white">
                    <span className="font-mono text-[11px] tracking-widest uppercase">
                      + {overflow} altre
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
