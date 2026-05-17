import type { PublicAgency } from "@/lib/habita/tenant";

/**
 * Habita · brand logo for an agency's public site.
 *
 * Renders the HabitaMi logo image (currently /habitami-logo.jpeg, in /public).
 * The `agency` prop is preserved for backward compatibility with existing
 * callers but is no longer rendered — HabitaMi is now the unified brand,
 * independent of agency city.
 *
 * Size is controlled by `className` (default: h-12, ~48px tall).
 * Width auto-scales to maintain the source image aspect ratio.
 */
type Props = {
  /** @deprecated agency.city is no longer rendered; kept for back-compat. */
  agency?: Pick<PublicAgency, "city">;
  className?: string;
};

export function HabitaLogo({ className = "" }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/habitami-logo.jpeg"
      alt="HabitaMi"
      className={`h-16 w-auto ${className}`}
    />
  );
}
