import type { PublicAgency } from "@/lib/habita/tenant";

/**
 * Habita · brand logo for an agency's public site.
 *
 * Composition:
 *   "Habita" (constant, regular Fraunces, onyx)
 *   + space
 *   + agency.city (variable, italic Fraunces, brass-deep)
 *
 * If `agency.city` is null/empty, only "Habita" is shown.
 * Size and weight are inherited from the parent via `className`,
 * so this component can be reused in header, footer, hero, etc.
 */
type Props = {
  agency: Pick<PublicAgency, "city">;
  className?: string;
};

export function HabitaLogo({ agency, className = "" }: Props) {
  return (
    <span className={`font-display tracking-tight ${className}`}>
      <span className="text-[var(--fg-primary)]">Habita</span>
      {agency.city ? (
        <>
          {" "}
          <span className="italic text-[var(--accent-deep)]">
            {agency.city}
          </span>
        </>
      ) : null}
    </span>
  );
}
