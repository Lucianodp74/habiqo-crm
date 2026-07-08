"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPropertyPhotoUrl } from "@/lib/storage/property-photos";

interface PropertyResult {
  id: string;
  title: string;
  city: string;
  internal_code: string | null;
  photos: string[];
  listing_type: "sale" | "rent";
  price_eur: number;
}

interface Props {
  initialPropertyId?: string | null;
  initialPropertyTitle?: string | null;
  onSave: (propertyId: string | null) => Promise<void>;
}

export function PropertySearchField({ initialPropertyId, initialPropertyTitle, onSave }: Props) {
  const [query, setQuery] = useState(initialPropertyTitle ?? "");
  const [results, setResults] = useState<PropertyResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(initialPropertyId ?? null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setIsOpen(false); return; }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/properties/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setSelectedId(null);
    setSaved(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  };

  const handleSelect = async (property: PropertyResult) => {
    setQuery(`${property.internal_code ? `[${property.internal_code}] ` : ""}${property.title} — ${property.city}`);
    setSelectedId(property.id);
    setIsOpen(false);
    setResults([]);
    setIsSaving(true);
    setSaved(false);
    await onSave(property.id);
    setIsSaving(false);
    setSaved(true);
  };

  const handleClear = async () => {
    setQuery("");
    setSelectedId(null);
    setSaved(false);
    setIsSaving(true);
    await onSave(null);
    setIsSaving(false);
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={handleInput}
            onFocus={() => query.length >= 2 && results.length > 0 && setIsOpen(true)}
            placeholder="Cerca per codice, titolo o città..."
            className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-2 text-sm text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/30"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="size-4 animate-spin rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--fg-secondary)]" />
            </div>
          )}
        </div>
        {selectedId && (
          <button
            type="button"
            onClick={handleClear}
            disabled={isSaving}
            className="rounded-lg border border-[var(--border-subtle)] px-3 py-2 text-xs text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors disabled:opacity-50"
          >
            Rimuovi
          </button>
        )}
      </div>
      {isSaving && <p className="mt-1 text-xs text-[var(--fg-muted)]">Salvataggio...</p>}
      {saved && !isSaving && <p className="mt-1 text-xs text-green-600">Immobile collegato ✓</p>}
      {isOpen && results.length > 0 && (
        <div className="absolute z-[200] mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-lg overflow-hidden">
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--bg-sunken)] transition-colors"
            >
              {p.photos?.[0] && (
                <img
                  src={getPropertyPhotoUrl(p.photos[0])}
                  alt=""
                  className="size-10 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--fg-primary)] truncate">
                  {p.internal_code && <span className="text-amber-700 mr-1">[{p.internal_code}]</span>}
                  {p.title}
                </p>
                <p className="text-xs text-[var(--fg-secondary)]">
                  {p.city} · {p.listing_type === "rent" ? "Affitto" : "Vendita"} ·{" "}
                  {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(p.price_eur)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
      {isOpen && results.length === 0 && !isLoading && query.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-3 text-sm text-[var(--fg-muted)]">
          Nessun immobile trovato per "{query}"
        </div>
      )}
    </div>
  );
}