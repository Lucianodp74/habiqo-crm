import type { Metadata } from "next";
import { PropertyCreateAIFlow } from "@/components/admin/property-create-ai-flow";
import { listAgencyLocations } from "@/lib/actions/list-agency-locations";

export const metadata: Metadata = {
  title: "Crea immobile · Habiquo",
};

export default async function NewPropertyAIPage() {
  const locations = await listAgencyLocations();

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)]">
      <div className="container mx-auto px-6 py-10 sm:py-16 max-w-2xl">
        <PropertyCreateAIFlow locations={locations} />
      </div>
    </div>
  );
}
