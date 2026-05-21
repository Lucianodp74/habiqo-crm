import { ThemeToggle } from "@/components/shared/theme-toggle";
import { initials } from "@habiquo/utils";
import Link from "next/link";

type SidebarProps = {
  userName: string;
  avatarUrl: string | null;
  agencySlug: string | null;
};

const NAV = [
  { href: "/dashboard",        label: "Dashboard overview" },
  { href: "/admin/properties", label: "Immobili" },
  { href: "/crm/leads",        label: "Leads" },
  { href: "/deals",            label: "Deals" },
  { href: "/ai-assistant",     label: "AI Assistant" },
] as const;

const ADMIN_NAV = [
  { href: "/admin/agency",     label: "Impostazioni agenzia" },
  { href: "/admin/properties", label: "Gestione immobili" },
] as const;

export function Sidebar({ userName, avatarUrl, agencySlug }: SidebarProps) {
  return (
    <aside
      className="w-[220px] shrink-0 border-r border-[var(--border-subtle)] flex flex-col"
      style={{ background: "var(--bg-elevated)" }}
    >
      {/* ── Brand ──────────────────────────────────────────────────── */}
      <div className="px-5 py-6 border-b border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="block">
            <span className="font-display text-[20px] tracking-tight">HABIQUO</span>
            <span className="block font-mono text-[9px] tracking-[0.20em] uppercase text-[var(--fg-muted)] mt-0.5">
              Smart real estate
            </span>
          </Link>

          {/* Link al sito pubblico HabitaMi */}
          {agencySlug ? (
            <a
              href={`/${agencySlug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Vedi sito pubblico"
              className="flex items-center justify-center w-7 h-7 rounded-md text-[var(--fg-muted)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-sunken)] transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          ) : null}
        </div>
      </div>

      {/* ── Nav ────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-0.5">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block px-3 py-2 rounded-md text-[13px] text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--fg-primary)] transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 mb-2 px-3 text-[10px] font-mono uppercase tracking-[0.18em] text-[var(--fg-muted)]">
          Admin
        </div>
        <ul className="space-y-0.5">
          {ADMIN_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block px-3 py-2 rounded-md text-[13px] text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--fg-primary)] transition-colors"
              >
                {item.label}
              </Link>
            </li>
          ))}
          {agencySlug ? (
            <li>
              <a
                href={`/${agencySlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-[13px] text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)] hover:text-[var(--fg-primary)] transition-colors"
              >
                Sito pubblico
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="opacity-50"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            </li>
          ) : null}
        </ul>
      </nav>

      {/* ── User ───────────────────────────────────────────────────── */}
      <div className="px-3 py-4 border-t border-[var(--border-subtle)] space-y-3">
        <div className="flex justify-center px-2">
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-display text-[12px]"
            style={{
              background: "var(--color-onyx-900)",
              color: "var(--color-brass-soft)",
            }}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              initials(userName)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium truncate">{userName}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
