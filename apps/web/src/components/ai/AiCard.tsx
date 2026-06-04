"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────

export type AiCardStatus = "available" | "coming_soon" | "beta";

export type AiCardProps = {
  icon: string;
  title: string;
  description: string;
  status?: AiCardStatus;
  href?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  expandable?: React.ReactNode;
};

// ─── CopyButton — client component per clipboard ─────────────────

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="mt-2 text-[10px] text-[var(--accent-deep)] hover:underline"
    >
      {copied ? "✓ Copiato" : "Copia testo"}
    </button>
  );
}

// ─── StatusBadge ─────────────────────────────────────────────────

function StatusBadge({ status }: { status: AiCardStatus }) {
  if (status === "available") return null;
  const styles = {
    coming_soon: "bg-[var(--bg-sunken)] text-[var(--fg-muted)] border-[var(--border-subtle)]",
    beta: "bg-amber-50 text-amber-700 border-amber-200",
  };
  const labels = {
    coming_soon: "In arrivo",
    beta: "Beta",
  };
  return (
    <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

// ─── AiCard ──────────────────────────────────────────────────────

export function AiCard({
  icon,
  title,
  description,
  status = "available",
  href,
  action,
  expandable,
}: AiCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isComingSoon = status === "coming_soon";
  const isInteractive = !!href || !!action || !!expandable;

  const baseClass = [
    "group relative rounded-2xl border border-[var(--border-subtle)]",
    "bg-[var(--bg-elevated)] p-5 transition-all duration-200",
    isComingSoon ? "opacity-60 cursor-default" : "",
    isInteractive && !isComingSoon
      ? "hover:border-[var(--color-brass)]/40 hover:shadow-[0_8px_24px_-8px_rgba(24,20,16,0.12)] cursor-pointer"
      : "",
    expanded ? "border-[var(--color-brass)]/30 shadow-[0_8px_24px_-8px_rgba(24,20,16,0.12)]" : "",
  ].filter(Boolean).join(" ");

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className="text-2xl leading-none">{icon}</span>
        <StatusBadge status={status} />
      </div>
      <h3 className="text-[14px] font-semibold text-[var(--fg-primary)] mb-1.5 leading-snug">
        {title}
      </h3>
      <p className="text-[12px] text-[var(--fg-muted)] leading-relaxed">
        {description}
      </p>

      {expandable && expanded && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
          {expandable}
        </div>
      )}

      {!isComingSoon && (
        <div className="mt-4 flex items-center gap-2">
          {expandable && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); setExpanded((v) => !v); }}
              className="text-[11px] font-medium text-[var(--accent-deep)] hover:underline"
            >
              {expanded ? "Chiudi ↑" : "Apri →"}
            </button>
          )}
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="text-[11px] font-medium text-[var(--accent-deep)] hover:underline"
            >
              {action.label} →
            </button>
          )}
          {href && !expandable && (
            <span className="text-[11px] font-medium text-[var(--accent-deep)] group-hover:underline">
              Apri →
            </span>
          )}
        </div>
      )}
    </>
  );

  if (href && !isComingSoon) {
    return <Link href={href} className={baseClass}>{inner}</Link>;
  }

  if (expandable && !isComingSoon) {
    return (
      <div
        className={baseClass}
        onClick={() => setExpanded((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
      >
        {inner}
      </div>
    );
  }

  return <div className={baseClass}>{inner}</div>;
}

// ─── AiCardGroup ─────────────────────────────────────────────────

export function AiCardGroup({
  icon,
  label,
  children,
}: {
  icon: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{icon}</span>
        <h2 className="text-[11px] font-mono uppercase tracking-[0.18em] text-[var(--fg-muted)]">
          {label}
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {children}
      </div>
    </section>
  );
}
