'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

function scrollTo(id: string) {
  document.getElementById(id.replace('#', ''))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const NAV_LINKS = [
  { label: 'Funzionalità',   href: '#funzionalita'   },
  { label: 'AI Renovation',  href: '#ai-renovation'  },
  { label: 'Founder Access', href: '#founder-access'  },
]

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [open,     setOpen]     = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background:     scrolled ? 'rgba(250,249,246,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom:   scrolled ? '1px solid rgba(0,0,0,0.06)' : '1px solid transparent',
      }}
    >
      <nav className="max-w-[1200px] mx-auto px-6 lg:px-16 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link href="/"
          className="font-display text-[18px] font-bold text-[#1a1a18] tracking-tight hover:opacity-80 transition-opacity">
          HABIQUO
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(link => (
            <button
              key={link.href}
              onClick={() => scrollTo(link.href)}
              className="text-[13px] text-[#6b6660] hover:text-[#1a1a18] transition-colors bg-transparent border-none cursor-pointer"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {link.label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login"
            className="text-[13px] text-[#6b6660] hover:text-[#1a1a18] transition-colors"
            style={{ fontFamily: 'system-ui, sans-serif' }}>
            Accedi
          </Link>
          <Link href="/register"
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#1a1a18] text-white text-[13px] font-medium hover:bg-[#2d2d2a] transition-colors"
            style={{ fontFamily: 'system-ui, sans-serif' }}>
            Richiedi demo
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-[#1a1a18]"
          onClick={() => setOpen(v => !v)}
          aria-label="Menu"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[#FAF9F6] border-t border-[rgba(0,0,0,0.06)] px-6 py-6 space-y-4">
          {NAV_LINKS.map(link => (
            <button
              key={link.href}
              onClick={() => { scrollTo(link.href); setOpen(false) }}
              className="block w-full text-left text-[15px] text-[#44403c] hover:text-[#1a1a18] transition-colors py-1 bg-transparent border-none cursor-pointer"
              style={{ fontFamily: 'system-ui, sans-serif' }}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-4 border-t border-[rgba(0,0,0,0.06)] flex flex-col gap-3">
            <Link href="/login" onClick={() => setOpen(false)}
              className="text-[14px] text-center text-[#6b6660] py-2"
              style={{ fontFamily: 'system-ui, sans-serif' }}>
              Accedi
            </Link>
            <Link href="/register" onClick={() => setOpen(false)}
              className="text-center py-3 rounded-full bg-[#1a1a18] text-white text-[14px] font-medium"
              style={{ fontFamily: 'system-ui, sans-serif' }}>
              Richiedi demo privata
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

