import { getAgencyBySlug } from "@/lib/habita/tenant";
import { AgencyHero } from "@/components/habita/agency-hero";
import { AgencyFeaturedProperties } from "@/components/habita/agency-featured-properties";
import { AgencyTrustSignals } from "@/components/habita/agency-trust-signals";
import { AgencyAbout } from "@/components/habita/agency-about";
import { RenovationShowcase } from "@/components/habita/renovation-showcase";
import { RenovationRealPreviews } from "@/components/habita/renovation-real-previews";
import { AgencyContact } from "@/components/habita/agency-contact";

type Params = Promise<{ agencySlug: string }>;

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

