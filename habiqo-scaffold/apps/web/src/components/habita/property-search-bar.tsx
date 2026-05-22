"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ListingFilter = "all" | "sale" | "rent";

type Props = {
  agencySlug: string;
  variant?: "light" | "dark";
};

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

  const pillBase = "px-4 py-1.5 rounded-full text-xs font-medium transition-all";
  const pillActive = isDark
    ? "bg-white text-[#1a1a1a]"
    : "bg-[var(--fg-primary)] text-[var(--bg-canvas)]";
  const pillInactive = isDark
    ? "text-white/70 hover:text-white"
    : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]";

  const containerClass = isDark
    ? "rounded-xl border border-white/20 bg-white/10 backdrop-blur-md overflow-hidden"
    : "rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] overflow-hidden";

  const inputClass = isDark
    ? "flex-1 py-2 text-sm bg-transparent text-white placeholder:text-white/50 focus:outline-none"
    : "flex-1 py-2 text-sm bg-transparent text-[var(--fg-primary)] placeholder:text-[var(--fg-secondary)]/50 focus:outline-none";

  const btnClass = isDark
    ? "px-5 py-2 bg-white text-[#1a1a1a] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
    : "px-5 py-2 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity";

  return (
    <form onSubmit={handleSearch} className={containerClass}>
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
            className={`${pillBase} ${listing === value ? pillActive : pillInactive}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-3 pb-3">
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Città o zona…"
          className={inputClass}
        />
        <button type="submit" className={btnClass}>
          Cerca
        </button>
      </div>
    </form>
  );
}
