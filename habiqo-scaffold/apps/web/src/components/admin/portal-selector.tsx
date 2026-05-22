"use client";

import { useState, useTransition } from "react";
import { updatePropertyPortals } from "@/lib/actions/update-portals";

const PORTALS = [
  {
    id: "website",
    label: "Sito web",
    sub: "HabitaMi",
    locked: true, // sempre attivo
  },
  {
    id: "immobiliare",
    label: "Immobiliare.it",
    sub: "Feed XML attivo",
    locked: false,
  },
  {
    id: "idealista",
    label: "Idealista",
    sub: "+ Casa.it",
    locked: false,
  },
] as const;

type Props = {
  propertyId: string;
  initialPortals: string[];
  onSaved?: () => void;
};

export function PortalSelector({ propertyId, initialPortals, onSaved }: Props) {
  const [selected, setSelected] = useState<string[]>(
    initialPortals.length > 0 ? initialPortals : ["website"]
  );
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function toggle(portalId: string) {
    if (portalId === "website") return;
    setSelected((prev) =>
      prev.includes(portalId)
        ? prev.filter((p) => p !== portalId)
        : [...prev, portalId]
    );
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      const portals = selected.includes("website")
        ? selected
        : ["website", ...selected];
      await updatePropertyPortals(propertyId, portals);
      setSaved(true);
      onSaved?.();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-widest text-[var(--fg-muted)] mb-2">
        Distribuzione portali
      </p>

      <div className="grid grid-cols-3 gap-2">
        {PORTALS.map((portal) => {
          const isActive = selected.includes(portal.id);
          return (
            <button
              key={portal.id}
              type="button"
              onClick={() => toggle(portal.id)}
              disabled={portal.locked}
              className={`p-3 rounded-md border text-left transition-all ${
                isActive
                  ? "border-[var(--accent-deep)] bg-[var(--color-brass-glow)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] opacity-50"
              } ${portal.locked ? "cursor-default" : "hover:opacity-90"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-[var(--fg-primary)] leading-tight">
                  {portal.label}
                </span>
                <div
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    isActive
                      ? "bg-[var(--accent-deep)]"
                      : "bg-[var(--border-subtle)]"
                  }`}
                />
              </div>
              <span className="text-[9px] text-[var(--fg-muted)]">{portal.sub}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className={`w-full py-2 rounded-md text-xs font-medium transition-all ${
          saved
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-[var(--fg-primary)] text-[var(--bg-canvas)] hover:opacity-90"
        } disabled:opacity-50`}
      >
        {isPending ? "Salvataggio…" : saved ? "✓ Salvato" : "Salva distribuzione"}
      </button>
    </div>
  );
}
