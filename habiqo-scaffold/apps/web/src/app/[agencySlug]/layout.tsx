import React from "react";
import { getAgencyBySlug } from "@/lib/habita/tenant";
import { notFound } from "next/navigation";
import { AgencyHeader } from "@/components/habita/agency-header";

const LIGHT_TOKENS: React.CSSProperties = {
  "--bg-canvas":       "#FAF9F7",
  "--bg-elevated":     "#F5F3EF",
  "--bg-sunken":       "#EFECE6",
  "--fg-primary":      "#1A1814",
  "--fg-secondary":    "#6B6560",
  "--fg-muted":        "#9C9490",
  "--border-subtle":   "#E8E4DE",
  "--accent-deep":     "#8B7355",
  "--color-brass-glow":"#F5EDD8",
} as const;

type Params = Promise<{ agencySlug: string }>;

export default async function AgencyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) notFound();

  return (
    <div style={LIGHT_TOKENS} className="flex flex-col">

      {/* ── Header trasparente con scroll ─────────────────────── */}
      <AgencyHeader agency={agency} agencySlug={agencySlug} />

      {/* ── Contenuto ─────────────────────────────────────────── */}
      <main>{children}</main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border-subtle)]">
        <div className="px-8 md:px-16 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-[var(--fg-secondary)]">
            <div>
              <p className="font-medium text-[var(--fg-primary)] mb-2">{agency.name}</p>
              {agency.city && <p>{agency.city}{agency.region ? `, ${agency.region}` : ""}</p>}
              {agency.phone && <p>{agency.phone}</p>}
            </div>
            <div>
              <p className="font-medium text-[var(--fg-primary)] mb-2">Esplora</p>
              <ul className="space-y-1">
                <li><a href={`/${agencySlug}/immobili`} className="hover:text-[var(--fg-primary)] transition-colors">Immobili</a></li>
                <li><a href={`/${agencySlug}#chi-siamo`} className="hover:text-[var(--fg-primary)] transition-colors">Chi siamo</a></li>
                <li><a href={`/${agencySlug}#contatti`} className="hover:text-[var(--fg-primary)] transition-colors">Contatti</a></li>
              </ul>
            </div>
            <div className="text-right text-xs text-[var(--fg-muted)]">
              <p>Powered by <span className="text-[var(--accent-deep)]">Habiquo</span></p>
              <p className="italic">Smart living. Smart real estate.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
