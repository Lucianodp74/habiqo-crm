import type { PublicProperty } from "@/lib/habita/properties";

type Props = {
  property: PublicProperty;
};

/**
 * Habita · property gallery (placeholder).
 *
 * No real images yet — we'll wire this to Supabase Storage in a
 * later phase. For now: subtle gradient with "Foto in arrivo" label.
 */
export function PropertyGallery({ property: _property }: Props) {
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
