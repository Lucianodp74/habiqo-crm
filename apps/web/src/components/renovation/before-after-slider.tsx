'use client'
// components/renovation/before-after-slider.tsx
// Destinazione: apps/web/src/components/renovation/before-after-slider.tsx
// ─────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect, useCallback } from 'react'

interface BeforeAfterSliderProps {
  beforeUrl:  string
  afterUrl:   string
  className?: string
}

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  className = '',
}: BeforeAfterSliderProps) {
  const [position, setPosition]   = useState(50)
  const containerRef              = useRef<HTMLDivElement>(null)
  const dragging                  = useRef(false)

  // ── Calcola posizione 0–100 da clientX ────────────────────────
  const getPosition = useCallback((clientX: number): number => {
    const el = containerRef.current
    if (!el) return 50
    const { left, width } = el.getBoundingClientRect()
    return Math.min(98, Math.max(2, ((clientX - left) / width) * 100))
  }, [])

  // ── Event listeners globali (drag fuori dal container) ────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      setPosition(getPosition(e.clientX))
    }
    const onUp = () => { dragging.current = false }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup',   onUp)
    }
  }, [getPosition])

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden select-none cursor-ew-resize ${className}`}
      style={{ aspectRatio: '4/3' }}
      onMouseDown={(e) => {
        dragging.current = true
        setPosition(getPosition(e.clientX))
      }}
      onTouchMove={(e) => {
        setPosition(getPosition(e.touches[0].clientX))
      }}
      onTouchStart={(e) => {
        setPosition(getPosition(e.touches[0].clientX))
      }}
    >
      {/* Immagine PRIMA (layer inferiore, sempre visibile) */}
      <img
        src={beforeUrl}
        alt="Prima"
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Immagine DOPO (layer superiore, clippata a destra dello slider) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src={afterUrl}
          alt="Dopo AI"
          draggable={false}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Linea divisoria verticale */}
      <div
        className="absolute top-0 bottom-0 w-px bg-white pointer-events-none"
        style={{
          left:      `${position}%`,
          transform: 'translateX(-50%)',
          boxShadow: '0 0 12px rgba(0,0,0,0.25)',
        }}
      />

      {/* Handle circolare trascinabile */}
      <div
        className="absolute top-1/2 flex items-center justify-center w-11 h-11 rounded-full bg-white pointer-events-none"
        style={{
          left:      `${position}%`,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 2px 20px rgba(0,0,0,0.2), 0 0 0 1.5px rgba(255,255,255,0.8)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path
            d="M6 4L2 9L6 14M12 4L16 9L12 14"
            stroke="#44403c"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Label PRIMA */}
      <span
        className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full text-white"
        style={{ background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(6px)' }}
      >
        Prima
      </span>

      {/* Label DOPO */}
      <span
        className="absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full text-stone-800"
        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(6px)' }}
      >
        Dopo AI ✦
      </span>
    </div>
  )
}
