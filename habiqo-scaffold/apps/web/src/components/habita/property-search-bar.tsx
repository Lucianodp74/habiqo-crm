"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ListingFilter = "all" | "sale" | "rent";

export function PropertySearchBar({ agencySlug }: { agencySlug: string }) {
  const [listing, setListing] = useState<ListingFilter>("all");
  const [city, setCity] = useState("");
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (listing !== "all") params.set("tipo", listing);
    if (city.trim()) params.set("citta", city.trim());
    const qs = params.toString();
    router.push(`/${agencySlug}/immobili${qs ? `?${qs}` : ""}`);
  }

  const pill =
    "px-4 py-1.5 rounded-full text-xs font-medium transition-all";
  const pillActive =
    "bg-[var(--fg-primary)] text-[var(--bg-canvas)]";
  const pillInactive =
    "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]";

  return (
    <form
      onSubmit={handleSearch}
      className="mt-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] overflow-hidden"
    >
      {/* ── Tipo contratto ─────────────────────────────────────── */}
      <div className="flex gap-1 px-3 pt-3 pb-1">
        {(
          [
            { value: "all", label: "Tutti" },
            { value: "sale", label: "Vendita" },
            { value: "rent", label: "Affitto" },
          ] as { value: ListingFilter; label: string }[]
        ).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setListing(value)}
            className={`${pill} ${listing === value ? pillActive : pillInactive}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Input + CTA ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 pb-3">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Città o zona…"
          className="flex-1 py-2 text-sm bg-transparent text-[var(--fg-primary)] placeholder:text-[var(--fg-secondary)]/50 focus:outline-none"
        />
        <button
          type="submit"
          className="px-5 py-2 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Cerca
        </button>
      </div>
    </form>
  );
}
