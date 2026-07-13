"use client";

import { useState, useTransition } from "react";
import { updatePropertyLocation } from "@/lib/actions/update-property-location";

type LocationOption = { id: string; name: string };

export function PropertyLocationField({
  propertyId,
  initialLocationId,
  locations,
}: {
  propertyId: string;
  initialLocationId: string | null;
  locations: LocationOption[];
}) {
  const [value, setValue] = useState(initialLocationId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleChange = (newValue: string) => {
    setValue(newValue);
    setSaved(false);
    setError(null);

    startTransition(async () => {
      const result = await updatePropertyLocation({
        propertyId,
        agencyLocationId: newValue || null,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setSaved(true);
    });
  };

  // Se l'agenzia non ha ancora nessuna sede configurata, non mostrare il
  // campo — evita di suggerire una funzionalita' non ancora disponibile.
  if (locations.length === 0) return null;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="property-location"
        className="text-xs font-medium uppercase tracking-wider text-neutral-500"
      >
        Sede
      </label>
      <div className="flex items-center gap-2">
        <select
          id="property-location"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isPending}
          className="w-44 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none disabled:opacity-50 bg-white"
        >
          <option value="">Nessuna sede</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
        {isPending && (
          <span className="text-xs text-neutral-500">Salvataggio…</span>
        )}
        {!isPending && saved && (
          <span className="text-xs text-neutral-400">Salvato</span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
