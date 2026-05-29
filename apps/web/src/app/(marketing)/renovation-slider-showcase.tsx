'use client'

import { useState, useRef, useCallback } from 'react'

interface Render {
  id:           string
  original_url: string
  result_url:   string
  style:        string | null
}

interface Props {
  renders: Render[]
}

function Slider({ before, after }: { before: string; after: string }) {
  const [pos, setPos]   = useState(50)
  const [drag, setDrag] = useState(false)
  const containerRef    = useRef<HTMLDivElement>(null)

  const updatePos = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pct  = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setPos(pct)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl select-none cursor-col-resize"
      style={{ aspectRatio: '16/9' }}
      onMouseDown={e => { setDrag(true); updatePos(e.clientX) }}
      onMouseMove={e => { if (drag) updatePos(e.clientX) }}
      onMouseUp={() => setDrag(false)}
      onMouseLeave={() => setDrag(false)}
      onTouchStart={e => { const t = e.touches.item(0); if (t) { setDrag(true); updatePos(t.clientX) } }}
      onTouchMove={e => { const t = e.touches.item(0); if (drag && t) updatePos(t.clientX) }}
      onTouchEnd={() => setDrag(false)}
    >
      <img src={after} alt="Dopo" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
        <img
          src={before}
          alt="Prima"
          className="absolute inset-0 h-full object-cover"
          style={{ width: pos > 0 ? `${(10000 / pos).toFixed(1)}%` : '100%', maxWidth: 'none' }}
          draggable={false}
        />
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)]" style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1a18" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3L4 7l4 4M16 3l4 4-4 4M4 7h16"/>
          </svg>
        </div>
      </div>
      <span className="absolute bottom-4 left-4 bg-[rgba(0,0,0,0.6)] backdrop-blur-sm text-white text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full">Prima</span>
      <span className="absolute bottom-4 right-4 bg-[rgba(166,124,82,0.9)] backdrop-blur-sm text-white text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-full">Dopo AI</span>
    </div>
  )
}

export function RenovationSliderShowcase({ renders }: Props) {
  const [active, setActive] = useState(0)
  const render = renders[active]
  if (!render) return null

  return (
    <div>
      <Slider before={render.original_url} after={render.result_url} />
      {renders.length > 1 && (
        <div className="flex gap-3 mt-4 justify-center">
          {renders.map((r, i) => (
            <button
              key={r.id}
              onClick={() => setActive(i)}
              className={`w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === active ? 'border-[#a67c52]' : 'border-transparent opacity-50 hover:opacity-75'}`}
            >
              <img src={r.result_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
