"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type AppShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

/**
 * Habiquo · responsive app shell.
 *
 * Wraps the (app) layout with mobile drawer behavior:
 *   - Desktop (md+): sidebar always visible as a static flex column. Layout
 *     identical to the pre-refactor behavior.
 *   - Mobile (<md): sticky top header with hamburger trigger. The sidebar
 *     becomes a fixed slide-in drawer with backdrop, body scroll lock,
 *     Escape-to-close, and auto-close on route change.
 *
 * The Sidebar component itself is NOT modified — it stays a server component
 * and is passed in via the `sidebar` slot. AppShell is the only client
 * component, isolating all interactivity in one place.
 */
export function AppShell({ sidebar, children }: AppShellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Auto-close drawer on navigation.
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open on mobile.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Close on Escape key.
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile header — visible only below md breakpoint. */}
      <header
        className="md:hidden sticky top-0 z-30 h-14 flex items-center justify-between px-4 border-b"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Apri menu di navigazione"
          aria-expanded={isOpen}
          aria-controls="app-sidebar"
          className="-ml-2 p-2 rounded-md hover:bg-[var(--bg-sunken)] transition-colors"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
        <span className="font-display text-[17px] tracking-tight">HABIQUO</span>
        <span aria-hidden="true" className="w-8" />
      </header>

      {/* Backdrop — mobile only, fades in when drawer is open. */}
      <div
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Sidebar wrapper:
            - Mobile: fixed slide-in drawer controlled by isOpen.
            - Desktop (md+): static flex column, no transform, no transition. */}
      <div
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex transition-transform duration-300 ease-out md:static md:translate-x-0 md:transition-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {sidebar}
      </div>

      <main className="flex-1 min-w-0 bg-[var(--bg-canvas)]">{children}</main>
    </div>
  );
}
