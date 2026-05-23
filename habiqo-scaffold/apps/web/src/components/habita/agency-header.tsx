"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { PublicAgency } from "@/lib/habita/tenant";

type Props = { agency: PublicAgency; agencySlug: string };

export function AgencyHeader({ agency, agencySlug }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isTransparent = !scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isTransparent
          ? "bg-transparent border-transparent"
          : "bg-[var(--bg-canvas)]/95 backdrop-blur-md border-b border-[var(--border-subtle)]"
      }`}
    >
      <div className="px-8 md:px-16 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href={`/${agencySlug}`} className="flex items-center gap-3">
          <span
            className={`font-display text-xl tracking-tight transition-colors ${
              isTransparent ? "text-white" : "text-[var(--fg-primary)]"
            }`}
          >
            {agency.name}
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-6">
          <Link
            href={`/${agencySlug}/immobili`}
            className={`text-sm transition-colors hidden sm:block ${
              isTransparent
                ? "text-white/80 hover:text-white"
                : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
            }`}
          >
            Immobili
          </Link>
          <Link
            href={`/${agencySlug}/valuta-casa`}
            className={`text-sm transition-colors hidden sm:block ${
              isTransparent
                ? "text-white/80 hover:text-white"
                : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
            }`}
          >
            Valuta casa
          </Link>
          <Link
            href={`/${agencySlug}#chi-siamo`}
            className={`text-sm transition-colors hidden md:block ${
              isTransparent
                ? "text-white/80 hover:text-white"
                : "text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
            }`}
          >
            Chi siamo
          </Link>
          {agency.phone && (
            <a
              href={`tel:${agency.phone}`}
              className={`text-sm font-medium transition-all px-4 py-1.5 rounded-full ${
                isTransparent
                  ? "text-white border border-white/30 hover:bg-white/10"
                  : "text-[var(--fg-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              {agency.phone}
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
