"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, type ChangeEvent } from "react";

type LeadStatusSelectProps = {
  leadId: string;
  currentStatus: string;
};

export function LeadStatusSelect({ leadId, currentStatus }: LeadStatusSelectProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const onChange = useCallback(
    async (e: ChangeEvent<HTMLSelectElement>) => {
      const status = e.target.value;
      setPending(true);
      try {
        const res = await fetch("/api/leads/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId, status }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          console.error(err?.error ?? "Aggiornamento stato fallito");
          return;
        }
        router.refresh();
      } finally {
        setPending(false);
      }
    },
    [leadId, router],
  );

  return (
    <select
      id="lead-status"
      defaultValue={currentStatus}
      disabled={pending}
      className="border rounded-xl px-4 py-2 bg-white disabled:opacity-50"
      onChange={onChange}
      aria-label="Stato lead"
    >
      <option value="new">Nuovo</option>
      <option value="qualified">Qualificato</option>
      <option value="visit_scheduled">Visita programmata</option>
      <option value="in_negotiation">In trattativa</option>
      <option value="won">Chiuso vinto</option>
      <option value="lost">Perso</option>
    </select>
  );
}
