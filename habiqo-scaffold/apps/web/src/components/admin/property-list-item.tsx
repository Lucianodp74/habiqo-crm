"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updatePropertyPortals } from "@/lib/actions/update-portals";

const PORTALS = [
  { id: "website",      label: "Sito",          color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "immobiliare",  label: "Imm.it",         color: "bg-amber-50 text-amber-700 border-amber-200" },
  { id: "idealista",    label: "Idealista",       color: "bg-green-50 text-green-700 border-green-200" },
] as const;



type Props = {
  id: string;
  title: string;
  city: string;
  listingType: "sale" | "rent";
  priceFormatted: string;
  coverUrl: string | null;
  photoCount: number;
  isPublic: boolean;
  agencyName: string;
  publishedTo: string[];
};

export function PropertyListItem({
  id, title, city, listingType, priceFormatted,
  coverUrl, photoCount, isPublic, agencyName, publishedTo,
}: Props) {
  const [portals, setPortals] = useState<string[]>(
    publishedTo.length > 0 ? publishedTo : ["website"]
  );
  const [showSelector, setShowSelector] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function togglePortal(portalId: string) {
    if (portalId === "website") return;
    setPortals((prev) =>
      prev.includes(portalId)
        ? prev.filter((p) => p !== portalId)
        : [...prev, portalId]
    );
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      const toSave = portals.includes("website") ? portals : ["website", ...portals];
      await updatePropertyPortals(id, toSave);
      setSaved(true);
      setTimeout(() => setShowSelector(false), 800);
    });
  }

  return (
    <div className="rounded-md border border-neutral-200 bg-white hover:border-neutral-300 transition overflow-hidden">

      {/* ── Riga principale ───────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-stretch gap-3 md:gap-4 p-4">

        {/* Thumbnail */}
        <div className="shrink-0 w-full aspect-[16/9] md:w-24 md:h-24 md:aspect-auto rounded overflow-hidden bg-neutral-100">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-wider text-neutral-400">
              Nessuna foto
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col md:justify-center">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500">
            {listingType === "rent" ? "Affitto" : "Vendita"} · {city}
          </div>
          <div className="mt-0.5 text-base font-medium text-neutral-900 truncate">
            {title}
          </div>
          <div className="mt-1 text-sm text-neutral-700">{priceFormatted}</div>

          {/* Status + portali attivi */}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-500">{agencyName}</span>
            <span className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-500">{photoCount} foto</span>
            <span className="text-neutral-300">·</span>
            {isPublic ? (
              <span className="text-xs text-emerald-700">Pubblicato</span>
            ) : (
              <span className="text-xs text-neutral-400">Bozza</span>
            )}
          </div>

          {/* Badge portali */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PORTALS.map((p) => {
              const active = portals.includes(p.id);
              return (
                <span
                  key={p.id}
                  className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded border transition-opacity ${
                    active ? p.color : "bg-neutral-50 text-neutral-400 border-neutral-200 opacity-50"
                  }`}
                >
                  {active ? "✓" : "–"} {p.label}
                </span>
              );
            })}
          </div>
        </div>

        {/* Desktop actions */}
        <div className="hidden md:flex flex-col items-end justify-center gap-2 pl-3">
          <Link
            href={`/admin/properties/${id}/photos`}
            className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors whitespace-nowrap"
          >
            Gestisci →
          </Link>
          <button
            type="button"
            onClick={() => setShowSelector((v) => !v)}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
          >
            {showSelector ? "Chiudi" : "Portali ↗"}
          </button>
        </div>
      </div>

      {/* ── Mobile actions ────────────────────────────────────── */}
      <div className="md:hidden flex gap-3 px-4 pb-3">
        <Link
          href={`/admin/properties/${id}/photos`}
          className="text-sm text-neutral-600"
        >
          Gestisci →
        </Link>
        <button
          type="button"
          onClick={() => setShowSelector((v) => !v)}
          className="text-sm text-blue-600"
        >
          {showSelector ? "Chiudi" : "Portali"}
        </button>
      </div>

      {/* ── Pannello portali (inline) ─────────────────────────── */}
      {showSelector && (
        <div className="border-t border-neutral-100 px-4 py-4 bg-neutral-50">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400 mb-3">
            Distribuzione portali
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PORTALS.map((portal) => {
              const isActive = portals.includes(portal.id);
              return (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() => togglePortal(portal.id)}
                  disabled={portal.id === "website"}
                  className={`p-3 rounded-md border text-left transition-all ${
                    isActive
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-200 bg-white text-neutral-400 opacity-60"
                  } ${portal.id === "website" ? "cursor-default" : "hover:opacity-90"}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium leading-tight">
                      {portal.label}
                    </span>
                    <div className={`w-2.5 h-2.5 rounded-full ${
                      isActive ? "bg-white" : "bg-neutral-300"
                    }`} />
                  </div>
                  {portal.id === "website" && (
                    <span className="text-[9px] opacity-70">Sempre attivo</span>
                  )}
                  {portal.id === "immobiliare" && (
                    <span className="text-[9px] opacity-70">Feed XML</span>
                  )}
                  {portal.id === "idealista" && (
                    <span className="text-[9px] opacity-70">+ Casa.it</span>
                  )}
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
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-neutral-900 text-white hover:opacity-90"
            } disabled:opacity-50`}
          >
            {isPending ? "Salvataggio…" : saved ? "✓ Salvato" : "Salva distribuzione"}
          </button>
        </div>
      )}
    </div>
  );
}
