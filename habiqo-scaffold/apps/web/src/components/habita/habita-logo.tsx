import type { PublicAgency } from "@/lib/habita/tenant";

/**
 * Habita · brand logo for an agency's public site.
 *
 * Renders the unified HabitaMi wordmark (SVG at /habitami-logo.svg).
 * The `agency` prop is preserved for backward compatibility with existing
 * callers but is no longer rendered — HabitaMi is now the brand
 * independent of agency city.
 *
 * Size is controlled by the `className` prop. Default: h-10 (40px tall).
 * Width auto-scales to maintain the SVG aspect ratio.
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
      src="/habitami-logo.svg"
      alt="HabitaMi"
      className={`h-10 w-auto ${className}`}
    />
  );
}
