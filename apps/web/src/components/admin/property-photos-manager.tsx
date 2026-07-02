"use client";

import { useRef, useState, useTransition } from "react";

import { deletePropertyPhoto } from "@/lib/actions/delete-property-photo";
import { reorderPropertyPhotos } from "@/lib/actions/reorder-property-photos";
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
  internalCode,
}: {
  propertyId: string;
  initialPhotos: string[];
  internalCode?: string | null;
}) {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [error, setError] = useState<string | null>(null);
  const [uploadingRemaining, setUploadingRemaining] = useState<number>(0);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Drag & drop reorder state ───────────────────────────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

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

  // ── Drag & drop handlers ────────────────────────────────────────
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (dragIndex === null || dragIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    const reordered = [...photos];
    const [moved] = reordered.splice(dragIndex, 1);
    if (moved === undefined) {
      handleDragEnd();
      return;
    }
    reordered.splice(dropIndex, 0, moved);

    setPhotos(reordered);
    handleDragEnd();
    setError(null);
    setIsSavingOrder(true);

    startTransition(async () => {
      const result = await reorderPropertyPhotos({
        propertyId,
        orderedPaths: reordered,
      });

      if (!result.ok) {
        setError(result.error.message);
        // Rollback alla situazione precedente se il salvataggio fallisce.
        setPhotos(photos);
      } else {
        setPhotos(result.data.photos);
      }

      setIsSavingOrder(false);
    });
  };

  const acceptAttr = PROPERTY_PHOTO_ALLOWED_MIMES.join(",");

  return (
    <div className="space-y-6">
      {/* ─── Upload zone ─────────────────────────────────────────── */}
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

      {/* ─── Error banner ────────────────────────────────────────── */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* ─── Hint riordino ───────────────────────────────────────── */}
      {photos.length > 1 && (
        <p className="text-xs text-neutral-500">
          Trascina una foto per cambiarne l&apos;ordine. La prima posizione è sempre la cover.
          {isSavingOrder && <span className="ml-2 text-neutral-700">Salvataggio…</span>}
        </p>
      )}

      {/* ─── Grid ────────────────────────────────────────────────── */}
      {photos.length === 0 ? (
        <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-600">
          Nessuna foto. La prima che carichi sarà automaticamente la cover.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((path, index) => {
            const isCover = index === 0;
            const isDragging = dragIndex === index;
            const isDragOver = dragOverIndex === index && dragIndex !== index;
            const isAiRender = path.includes("ai-render-");

            return (
              <div
                key={path}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`group relative aspect-square overflow-hidden rounded-md border bg-neutral-100 cursor-grab active:cursor-grabbing transition-all ${
                  isDragOver
                    ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-1"
                    : "border-neutral-200"
                } ${isDragging ? "opacity-40" : "opacity-100"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getPropertyPhotoUrl(path)}
                  alt=""
                  className="h-full w-full object-cover pointer-events-none"
                  loading="lazy"
                />

                {/* Cover + Render AI badges */}
                {(isCover || isAiRender) && (
                  <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
                    {isCover && (
                      <div className="rounded bg-neutral-900 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                        Cover
                      </div>
                    )}
                    {isCover && internalCode && (
                      <div className="rounded bg-white/90 px-2 py-0.5 text-[10px] font-medium text-neutral-900 backdrop-blur-sm">
                        {internalCode}
                      </div>
                    )}
                    {isAiRender && (
                      <div className="rounded bg-violet-600 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white">
                        Render AI
                      </div>
                    )}
                  </div>
                )}

                {/* Drag handle indicator (top-right, always visible on hover) */}
                <div className="absolute right-2 top-2 hidden md:flex items-center justify-center rounded bg-black/40 p-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="8" cy="6" r="1" fill="white" stroke="none" />
                    <circle cx="8" cy="12" r="1" fill="white" stroke="none" />
                    <circle cx="8" cy="18" r="1" fill="white" stroke="none" />
                    <circle cx="16" cy="6" r="1" fill="white" stroke="none" />
                    <circle cx="16" cy="12" r="1" fill="white" stroke="none" />
                    <circle cx="16" cy="18" r="1" fill="white" stroke="none" />
                  </svg>
                </div>

                {/* Desktop hover overlay with actions (md+ only) — unchanged behavior. */}
                <div className="absolute inset-0 hidden md:flex items-end justify-center bg-black/0 pb-3 opacity-0 transition-all group-hover:bg-black/45 group-hover:opacity-100">
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

                {/* Mobile-only action bar — always visible. Hidden on md+ where
                     the hover overlay above takes over. Gradient ensures the
                     buttons stay readable over any photo content.
                     Nota: il drag & drop touch su mobile è limitato dal supporto
                     nativo HTML5 drag events — su mobile si consiglia di usare
                     "Imposta cover" per portare una foto in prima posizione. */}
                <div className="md:hidden absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-2 pt-5 pb-2">
                  {!isCover && (
                    <button
                      type="button"
                      onClick={() => handleSetCover(path)}
                      disabled={isPending}
                      className="rounded bg-white px-2 py-1 text-[10px] font-medium text-neutral-900 shadow-sm disabled:opacity-50"
                    >
                      Imposta cover
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(path)}
                    disabled={isPending}
                    className="rounded bg-red-600 px-2 py-1 text-[10px] font-medium text-white shadow-sm disabled:opacity-50"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
