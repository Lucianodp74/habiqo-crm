"use client";

import { useRef, useState, useTransition } from "react";

import {
  removeAgencyHeroPhoto,
  uploadAgencyHeroPhoto,
} from "@/lib/actions/upload-agency-hero-photo";
import { getPropertyPhotoUrl } from "@/lib/storage/property-photos";
import {
  AGENCY_HERO_PHOTO_ALLOWED_MIMES,
  AGENCY_HERO_PHOTO_MAX_BYTES,
} from "@/lib/storage/agency-photos";

const MAX_MB = Math.round(AGENCY_HERO_PHOTO_MAX_BYTES / (1024 * 1024));

export function AgencyCoverPhotoManager({
  agencyId,
  initialCoverImagePath,
}: {
  agencyId: string;
  initialCoverImagePath: string | null;
}) {
  const [coverPath, setCoverPath] = useState<string | null>(initialCoverImagePath);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setError(null);

    startTransition(async () => {
      const fd = new FormData();
      fd.append("agencyId", agencyId);
      fd.append("file", file);

      const result = await uploadAgencyHeroPhoto(fd);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setCoverPath(result.data.path);
      if (fileInputRef.current) fileInputRef.current.value = "";
    });
  };

  const handleRemove = () => {
    if (
      !confirm(
        "Rimuovere la foto Hero? Il sito tornerà a mostrare automaticamente un immobile in evidenza.",
      )
    )
      return;
    setError(null);

    startTransition(async () => {
      const result = await removeAgencyHeroPhoto(agencyId);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setCoverPath(null);
    });
  };

  const acceptAttr = AGENCY_HERO_PHOTO_ALLOWED_MIMES.join(",");

  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Foto Hero del sito</h2>
        <p className="mt-1 text-sm text-neutral-600">
          L&apos;immagine di sfondo mostrata in cima alla tua pagina pubblica. Resta
          fissa indipendentemente dagli immobili che carichi — gli immobili
          continuano a essere promossi separatamente sotto la foto.
        </p>
      </div>

      {coverPath ? (
        <div className="relative w-full max-w-md aspect-video overflow-hidden rounded-md border border-neutral-200 bg-neutral-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getPropertyPhotoUrl(coverPath)}
            alt="Foto Hero del sito"
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-6 max-w-md text-center text-sm text-neutral-600">
          Nessuna foto impostata — il sito mostra automaticamente un immobile in
          evidenza.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 max-w-md">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50">
          {isPending ? "Caricamento…" : coverPath ? "Sostituisci foto" : "Carica foto"}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptAttr}
            className="hidden"
            disabled={isPending}
            onChange={(e) => handleFile(e.target.files)}
          />
        </label>
        {coverPath && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={isPending}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            Rimuovi
          </button>
        )}
      </div>

      <p className="text-xs text-neutral-500 max-w-md">
        Dimensioni consigliate: 1920×1080 px · Formati supportati: JPG, PNG, WEBP ·
        Limite massimo: {MAX_MB} MB
      </p>
    </section>
  );
}
