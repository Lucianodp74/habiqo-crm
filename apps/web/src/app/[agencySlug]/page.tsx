import { getAgencyBySlug } from "@/lib/habita/tenant";
import { buildRealEstateAgentSchema, jsonLdScript } from "@/lib/seo/schema";
import { AgencyHero } from "@/components/habita/agency-hero";
import { AgencyFeaturedProperties } from "@/components/habita/agency-featured-properties";
import { AgencyTrustSignals } from "@/components/habita/agency-trust-signals";
import { AgencyAbout } from "@/components/habita/agency-about";
import { RenovationShowcase } from "@/components/habita/renovation-showcase";
import { RenovationRealPreviews } from "@/components/habita/renovation-real-previews";
import { AgencyContact } from "@/components/habita/agency-contact";

type Params = Promise<{ agencySlug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) return { title: "Agenzia non trovata" };

  const url = `https://www.habiquo.it/${agency.slug}`;

  // NOTA (TODO Sprint 2): coverImagePath potrebbe essere un path di storage
  // relativo, non un URL assoluto. Includiamo l'immagine in Open Graph solo
  // se è già un URL http completo, per non generare un tag og:image rotto.
  // Da allineare con il pattern reale usato per le cover image (probabile
  // helper simile a getPropertyPhotoUrl usato per le foto immobile).
  const ogImage =
    agency.coverImagePath && agency.coverImagePath.startsWith("http")
      ? [agency.coverImagePath]
      : undefined;

  return {
    title: agency.name,
    description: agency.tagline ?? agency.description?.slice(0, 160) ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title: agency.name,
      description: agency.tagline ?? undefined,
      url,
      images: ogImage,
    },
  };
}

export default async function HabitaAgencyHomePage({
  params,
}: {
  params: Params;
}) {
  const { agencySlug } = await params;
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) return null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(buildRealEstateAgentSchema(agency))}
      />
      <AgencyHero agency={agency} />
      <AgencyFeaturedProperties agency={agency} />
      <AgencyTrustSignals />
      <RenovationShowcase agencyId={agency.id} agencyName={agency.name} />
      <RenovationRealPreviews agencyId={agency.id} />
      <AgencyAbout agency={agency} />
      <AgencyContact agency={agency} />
    </>
  );
}
