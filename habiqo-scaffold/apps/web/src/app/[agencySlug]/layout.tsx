import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HabitaLogo } from "@/components/habita/habita-logo";
import { getAgencyBySlug } from "@/lib/habita/tenant";

type Params = Promise<{ agencySlug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) return { title: "Pagina non trovata" };
  return {
    title: agency.tagline ? `${agency.name} · ${agency.tagline}` : agency.name,
    description: agency.description ?? `${agency.name} – agenzia immobiliare`,
  };
}

// Token light hardcodati inline — garantisce palette paper/onyx/brass
// anche su iPhone con dark mode attivo, senza toccare globals.css.
const LIGHT_TOKENS: React.CSSProperties = {
  colorScheme: "light",
  // @ts-expect-error CSS custom properties
  "--bg-canvas":     "#f6f2e9",
  "--bg-elevated":   "#fcfaf4",
  "--bg-sunken":     "#efe9da",
  "--fg-primary":    "#100d09",
  "--fg-secondary":  "#5c5247",
  "--fg-muted":      "#837a6e",
  "--accent":        "#a77a45",
  "--accent-deep":   "#7c5526",
  "--accent-soft":   "#cba677",
  "--border-subtle": "#e5ddc9",
  "--border-strong": "#d6cdb6",
  backgroundColor:   "#f6f2e9",
  color:             "#100d09",
};

export default async function HabitaAgencyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) notFound();

  const location = [agency.city, agency.region].filter(Boolean).join(", ");

  return (
    <div style={LIGHT_TOKENS} className="flex flex-col">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="border-b border-[var(--border-subtle)] sticky top-0 z-40 bg-[var(--bg-canvas)]/80 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href={`/${agency.slug}`} className="hover:opacity-80 transition-opacity">
            <HabitaLogo agency={agency} className="text-xl" />
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href={`/${agency.slug}/immobili`}
              className="text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors"
            >
              Immobili
            </Link>
            {agency.phone ? (
              <a
                href={`tel:${agency.phone}`}
                className="hidden sm:inline text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors"
              >
                {agency.phone}
              </a>
            ) : null}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border-subtle)] mt-12">
        <div className="container mx-auto px-6 py-10 max-w-5xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm text-[var(--fg-secondary)]">
            <div>
              <p className="font-medium text-[var(--fg-primary)] mb-3">{agency.name}</p>
              {location ? <p className="mb-1">{location}</p> : null}
              {agency.phone ? (
                <a href={`tel:${agency.phone}`} className="hover:text-[var(--fg-primary)] transition-colors">
                  {agency.phone}
                </a>
              ) : null}
            </div>
            <div>
              <p className="font-medium text-[var(--fg-primary)] mb-3">Esplora</p>
              <ul className="space-y-2">
                <li><Link href={`/${agency.slug}/immobili`} className="hover:text-[var(--fg-primary)] transition-colors">Immobili</Link></li>
                <li><Link href={`/${agency.slug}#chi-siamo`} className="hover:text-[var(--fg-primary)] transition-colors">Chi siamo</Link></li>
                <li><Link href={`/${agency.slug}#contatti`} className="hover:text-[var(--fg-primary)] transition-colors">Contatti</Link></li>
              </ul>
            </div>
            <div className="sm:text-right">
              <p className="text-xs opacity-50 mb-1">Powered by <span className="font-medium">Habiquo</span></p>
              <p className="text-xs opacity-50 italic">Smart living. Smart real estate.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
