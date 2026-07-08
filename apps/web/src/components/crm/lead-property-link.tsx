"use client";

import { useCallback } from "react";
import { linkPropertyToLead } from "@/lib/actions/link-property-to-lead";
import { PropertySearchField } from "@/components/crm/property-search-field";

interface Props {
  leadId: string;
  sourcePropertyId: string | null;
}

export function LeadPropertyLink({ leadId, sourcePropertyId }: Props) {
  const handleSave = useCallback(async (propertyId: string | null) => {
    await linkPropertyToLead({ leadId, propertyId });
  }, [leadId]);

  return (
    <section className="glass-panel rounded-2xl p-5 sm:p-6 transition-shadow duration-300 hover:shadow-[0_14px_44px_-24px_rgba(24,20,16,0.18)] animate-in-card">
      <h2 className="font-display text-[20px] text-[var(--fg-primary)] mb-2">
        Immobile di interesse
      </h2>
      <p className="text-[12px] text-[var(--fg-muted)] mb-4">
        Collega questo lead a un immobile specifico del catalogo.
      </p>
      <PropertySearchField
        leadId={leadId}
        initialPropertyId={sourcePropertyId}
        onSave={handleSave}
      />
    </section>
  );
}