import type { Metadata } from "next";
import { notFound } from "next/navigation";
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

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)]">
      <header className="border-b border-[var(--border-subtle)]">
        <div className="container mx-auto px-6 py-6">
          <h1 className="font-display text-2xl text-[var(--fg-primary)]">
            {agency.name}
          </h1>
          {agency.tagline ? (
            <p className="mt-1 text-sm text-[var(--fg-secondary)]">
              {agency.tagline}
            </p>
          ) : null}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--border-subtle)] mt-16">
        <div className="container mx-auto px-6 py-8 text-sm text-[var(--fg-secondary)]">
          <p className="font-medium text-[var(--fg-primary)]">{agency.name}</p>
          {agency.city || agency.region ? (
            <p>{[agency.city, agency.region].filter(Boolean).join(", ")}</p>
          ) : null}
          {agency.phone ? <p>{agency.phone}</p> : null}
          <p className="mt-6 text-xs opacity-60">
            Powered by Habiquo · Smart living. Smart real estate.
          </p>
        </div>
      </footer>
    </div>
  );
}
