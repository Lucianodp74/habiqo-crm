import { getAgencyBySlug } from "@/lib/habita/tenant";
import { AgencyHero } from "@/components/habita/agency-hero";
import { AgencyFeaturedProperties } from "@/components/habita/agency-featured-properties";
import { AgencyTrustSignals } from "@/components/habita/agency-trust-signals";
import { AgencyAbout } from "@/components/habita/agency-about";
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
      <AgencyAbout agency={agency} />
      <AgencyContact agency={agency} />
    </>
  );
}
