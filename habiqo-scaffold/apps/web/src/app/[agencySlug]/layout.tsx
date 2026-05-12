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

  if (!agency) {
    return { title: "Pagina non trovata" };
  }

  return {
    title: agency.tagline ? `${agency.name} · ${agency.tagline}` : agency.name,
    description:
      agency.description ?? `${agency.name} — agenzia immobiliare`,
  };
}

export default async function HabitaAgencyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const { agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);

  if (!agency) {
    notFound();
  }

  const location = [agency.city, agency.region].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)]">
      <header className="border-b border-[var(--border-subtle)] sticky top-0 z-40 bg-[var(--bg-canvas)]/80 backdrop-blur">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href={`/${agency.slug}`}
            className="hover:opacity-80 transition-opacity"
          >
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

      <footer className="border-t border-[var(--border-subtle)] mt-16">
        <div className="container mx-auto px-6 py-10 text-sm text-[var(--fg-secondary)]">
          <div className="flex flex-wrap justify-between gap-6">
            <div>
              <p className="font-medium text-[var(--fg-primary)]">
                {agency.name}
              </p>
              {location ? <p className="mt-1">{location}</p> : null}
              {agency.phone ? <p className="mt-1">{agency.phone}</p> : null}
            </div>
            <div className="text-right">
              <p className="text-xs opacity-60">
                Powered by <span className="font-medium">Habiquo</span>
              </p>
              <p className="text-xs opacity-60 mt-1 italic">
                Smart living. Smart real estate.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
