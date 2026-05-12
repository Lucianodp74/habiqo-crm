import { getAgencyBySlug } from "@/lib/habita/tenant";
import { AgencyHero } from "@/components/habita/agency-hero";
import { AgencyAbout } from "@/components/habita/agency-about";
import { AgencyContact } from "@/components/habita/agency-contact";

type Params = Promise<{ agencySlug: string }>;

export default async function HabitaAgencyHomePage({
  params,
}: {
  params: Params;
}) {
  const { agencySlug } = await params;
  // Layout already enforced existence via notFound(); React.cache makes this
  // call free (deduplicated within the same request).
  const agency = await getAgencyBySlug(agencySlug);
  if (!agency) return null;

  return (
    <>
      <AgencyHero agency={agency} />
      <AgencyAbout agency={agency} />
      <AgencyContact agency={agency} />
    </>
  );
}
