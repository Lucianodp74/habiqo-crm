"use client";

import { useRef, useState, useTransition } from "react";

import { deletePropertyPhoto } from "@/lib/actions/delete-property-photo";
import { setPropertyPhotoCover } from "@/lib/actions/set-property-photo-cover";
import { uploadPropertyPhoto } from "@/lib/actions/upload-property-photo";
import {
  PROPERTY_PHOTO_ALLOWED_MIMES,
  PROPERTY_PHOTO_MAX_BYTES,
  getPropertyPhotoUrl,
} from "@/lib/storage/property-photos";

const MAX_MB = Math.round(PROPERTY_PHOTO_MAX_BYTES / (1024 * 1024));

export function PropertyPhotosManager({
  propertyId,
  initialPhotos,
}: {
  propertyId: string;
  initialPhotos: string[];
}) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [uploadingRemaining, setUploadingRemaining] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploadingRemaining(files.length);

    startTransition(async () => {
      let currentPhotos = [...photos];
      let remaining = files.length;

      // Upload sequentially: each action reads-modifies-writes the photos
      // array, so parallel uploads would race on the array.
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("propertyId", propertyId);
        fd.append("file", file);

        const result = await uploadPropertyPhoto(fd);

        if (!result.ok) {
          setError(result.error.message);
          break;
        }

        currentPhotos = result.data.photos;
        setPhotos(currentPhotos);
        remaining -= 1;
        setUploadingRemaining(remaining);
      }

      setUploadingRemaining(0);

      // Reset input so the same file can be re-selected after errors.
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

  const handleDelete = (path: string) => {
    if (!confirm("Eliminare questa foto? L'azione è irreversibile.")) return;
    setError(null);

    startTransition(async () => {
      const result = await deletePropertyPhoto({ propertyId, path });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setPhotos(result.data.photos);
    });
  };

  const handleSetCover = (path: string) => {
    if (photos[0] === path) return;
    setError(null);

    startTransition(async () => {
      const result = await setPropertyPhotoCover({ propertyId, path });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setPhotos(result.data.photos);
    });
  };

  const acceptAttr = PROPERTY_PHOTO_ALLOWED_MIMES.join(",");

  return (
    <div className="space-y-6">
      {/* ─── Upload zone ────────────────────────────────────── */}
      <div className="rounded-md border-2 border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-center">
        <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50">
          {uploadingRemaining > 0
            ? `Caricamento… ${uploadingRemaining} rimasti`
            : "Carica foto"}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptAttr}
            className="hidden"
            disabled={isPending}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
        <p className="mt-3 text-xs text-neutral-500">
          JPG, PNG, WEBP, AVIF · Max {MAX_MB} MB per foto · Selezione multipla
          supportata
        </p>
      </div>

      {/* ─── Error banner ───────────────────────────────────── */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* ─── Grid ───────────────────────────────────────────── */}
      {photos.length === 0 ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-600">
          Nessuna foto. La prima che carichi sarà automaticamente la cover.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((path, index) => {
            const isCover = index === 0;
            return (
              <div
                key={path}
                className="group relative aspect-square overflow-hidden rounded-md border border-neutral-200 bg-neutral-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPropertyPhotoUrl(path)}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />

                {/* Cover badge */}
                {isCover && (
                  <div className="absolute left-2 top-2 rounded bg-neutral-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                    Cover
                  </div>
                )}

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 flex items-end justify-center bg-black/0 pb-3 opacity-0 transition-all group-hover:bg-black/45 group-hover:opacity-100">
                  <div className="flex gap-2">
                    {!isCover && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(path)}
                        disabled={isPending}
                        className="rounded bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-900 transition hover:bg-neutral-100 disabled:opacity-50"
                      >
                        Imposta cover
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(path)}
                      disabled={isPending}
                      className="rounded bg-red-600 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      Elimina
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
