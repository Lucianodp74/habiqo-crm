"use client";

import { useState, useTransition } from "react";
import { updatePropertyInternalCode } from "@/lib/actions/update-property-internal-code";

export function PropertyInternalCodeField({
  propertyId,
  initialCode,
}: {
  propertyId: string;
  initialCode: string | null;
}) {
  const [value, setValue] = useState(initialCode ?? "");
  const [savedValue, setSavedValue] = useState(initialCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty = value !== savedValue;

  const handleSave = () => {
    if (!isDirty) return;
    setError(null);

    startTransition(async () => {
      const result = await updatePropertyInternalCode({
        propertyId,
        internalCode: value,
      });

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      const saved = result.data.internalCode ?? "";
      setValue(saved);
      setSavedValue(saved);
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor="property-internal-code"
        className="text-xs font-medium uppercase tracking-wider text-neutral-500"
      >
        Codice immobile (uso interno)
      </label>
      <div className="flex items-center gap-2">
        <input
          id="property-internal-code"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.currentTarget.blur();
            }
          }}
          disabled={isPending}
          placeholder="Es. TA-001, SGI-12…"
          maxLength={40}
          className="w-44 rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
        />
        {isPending && (
          <span className="text-xs text-neutral-500">Salvataggio…</span>
        )}
        {!isPending && !isDirty && savedValue && (
          <span className="text-xs text-neutral-400">Salvato</span>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
