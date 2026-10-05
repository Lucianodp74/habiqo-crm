"use client";

import { updatePropertyVideo } from "@/lib/actions/update-property-video";
import { useState, useTransition } from "react";

export function PropertyVideoField({
  propertyId,
  initialUrl,
}: {
  propertyId: string;
  initialUrl: string | null;
}) {
  const [value, setValue] = useState(initialUrl ?? "");
  const [savedValue, setSavedValue] = useState(initialUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isDirty = value.trim() !== savedValue;

  const handleSave = () => {
    if (!isDirty) return;
    setError(null);

    startTransition(async () => {
      const result = await updatePropertyVideo({ propertyId, videoUrl: value });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      const saved = result.data.videoUrl ?? "";
      setValue(saved);
      setSavedValue(saved);
    });
  };

  return (
    <div className="flex flex-col gap-1 max-w-xl">
      <label
        htmlFor="property-video-url"
        className="text-xs font-medium uppercase tracking-wider text-neutral-500"
      >
        Video dell&apos;immobile (link YouTube o Vimeo)
      </label>
      <div className="flex items-center gap-2">
        <input
          id="property-video-url"
          type="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          disabled={isPending}
          placeholder="https://www.youtube.com/watch?v=…"
          maxLength={500}
          className="w-full rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none disabled:opacity-50"
        />
        {isPending && <span className="text-xs text-neutral-500">Salvataggio…</span>}
        {!isPending && !isDirty && savedValue && (
          <span className="text-xs text-neutral-400">Salvato</span>
        )}
      </div>
      <p className="text-xs text-neutral-400">
        Compare nella pagina pubblica dell&apos;annuncio. Lascia vuoto per toglierlo.
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
