"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ListingFilter = "all" | "sale" | "rent";
type Props = { agencySlug: string; variant?: "light" | "dark" };

export function PropertySearchBar({ agencySlug, variant = "light" }: Props) {
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

  const isDark = variant === "dark";

  return (
    <form
      onSubmit={handleSearch}
      className={`rounded-xl overflow-hidden transition-all ${
        isDark
          ? "bg-black/40 backdrop-blur-xl border border-white/20 shadow-2xl"
          : "bg-[var(--bg-canvas)] border border-[var(--border-subtle)] shadow-sm"
      }`}
    >
      {/* Tipo contratto */}
      <div className="flex gap-1 px-4 pt-3 pb-1.5">
        {(
          [
            { value: "all",  label: "Tutti" },
            { value: "sale", label: "Vendita" },
            { value: "rent", label: "Affitto" },
          ] as { value: ListingFilter; label: string }[]
        ).map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => setListing(value)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              listing === value
                ? isDark
                  ? "bg-white text-black"
                  : "bg-[var(--fg-primary)] text-[var(--bg-canvas)]"
                : isDark
                  ? "text-white/60 hover:text-white"
                  : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Input + CTA */}
      <div className="flex items-center gap-3 px-4 pb-3">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Città o zona…"
          className={`flex-1 text-sm py-1.5 bg-transparent focus:outline-none ${
            isDark
              ? "text-white placeholder:text-white/40"
              : "text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)]"
          }`}
        />
        <button
          type="submit"
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            isDark
              ? "bg-white text-black hover:bg-white/90 shadow-lg"
              : "bg-[var(--fg-primary)] text-[var(--bg-canvas)] hover:opacity-90"
          }`}
        >
          Cerca
        </button>
      </div>
    </form>
  );
}
