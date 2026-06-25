"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Props = {
  photos: string[];
  alt: string;
  initialIndex?: number;
};

/**
 * Lightbox a schermo intero per la galleria foto dell'immobile.
 * Si attiva al click su qualsiasi foto (cover o thumbnail).
 * Navigazione: freccette on-screen, tasti ←/→, chiusura con X o ESC.
 */
export function PropertyPhotoLightbox({ photos, alt, initialIndex = 0 }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);

  const next = useCallback(() => {
    setOpenIndex((curr) => (curr === null ? null : (curr + 1) % photos.length));
  }, [photos.length]);

  const prev = useCallback(() => {
    setOpenIndex((curr) =>
      curr === null ? null : (curr - 1 + photos.length) % photos.length,
    );
  }, [photos.length]);

  useEffect(() => {
    if (openIndex === null) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [openIndex, close, next, prev]);

  return (
    <>
      {/* Trigger invisibile: avvolge il contenuto passato dal parent tramite data-photo-index */}
      <PhotoTriggerBinder onOpen={setOpenIndex} />

      {openIndex !== null && photos[openIndex] && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label={`Galleria foto: ${alt}`}
          onClick={close}
        >
          {/* Chiudi */}
          <button
            type="button"
            onClick={close}
            aria-label="Chiudi galleria"
            className="absolute top-4 right-4 md:top-6 md:right-6 z-10 size-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>

          {/* Contatore */}
          <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 text-white/70 text-sm font-medium tabular-nums">
            {openIndex + 1} / {photos.length}
          </div>

          {/* Freccia sinistra */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              aria-label="Foto precedente"
              className="absolute left-2 md:left-6 z-10 size-10 md:size-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {/* Immagine */}
          <div
            className="relative w-full h-full max-w-6xl max-h-[85vh] mx-4 md:mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[openIndex]}
              alt={`${alt} — foto ${openIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Freccia destra */}
          {photos.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              aria-label="Foto successiva"
              className="absolute right-2 md:right-6 z-10 size-10 md:size-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Ascolta i click su qualsiasi elemento con [data-photo-index] nella pagina
 * e apre la lightbox sull'indice corrispondente. Evita di dover riscrivere
 * ogni singolo <Image> esistente: basta aggiungere l'attributo data-photo-index
 * e un cursor-pointer agli elementi foto già presenti nel markup.
 */
function PhotoTriggerBinder({ onOpen }: { onOpen: (index: number) => void }) {
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-photo-index]");
      if (!target) return;
      const index = Number(target.dataset.photoIndex);
      if (!Number.isNaN(index)) onOpen(index);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onOpen]);

  return null;
}
