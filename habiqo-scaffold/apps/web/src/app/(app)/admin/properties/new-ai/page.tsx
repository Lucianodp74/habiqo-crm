import type { Metadata } from "next";
import { PropertyCreateAIFlow } from "@/components/admin/property-create-ai-flow";

export const metadata: Metadata = {
  title: "Crea immobile · Habiquo",
};

export default function NewPropertyAIPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)]">
      <div className="container mx-auto px-6 py-10 sm:py-16 max-w-2xl">
        <PropertyCreateAIFlow />
      </div>
    </div>
  );
}
