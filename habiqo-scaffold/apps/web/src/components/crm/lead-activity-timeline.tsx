"use client";

import type { LeadTimelineEvent } from "@/lib/queries/lead-events";
import { formatRelative } from "@habiqo/utils";
import {
  Activity,
  type LucideIcon,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Sparkles,
  StickyNote,
} from "lucide-react";

type EventVisual = {
  Icon: LucideIcon;
  label: string;
  badge: string;
  ring: string;
};

function visualForType(type: string): EventVisual {
  switch (type) {
    case "call":
      return {
        Icon: Phone,
        label: "Chiamata",
        badge: "border-emerald-500/25 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200/90",
        ring: "ring-emerald-500/20",
      };
    case "email":
      return {
        Icon: Mail,
        label: "Email",
        badge: "border-sky-500/25 bg-sky-500/10 text-sky-900 dark:text-sky-200/90",
        ring: "ring-sky-500/20",
      };
    case "whatsapp":
      return {
        Icon: MessageSquare,
        label: "WhatsApp",
        badge: "border-green-500/25 bg-green-500/10 text-green-900 dark:text-green-200/90",
        ring: "ring-green-500/20",
      };
    case "visit":
      return {
        Icon: MapPin,
        label: "Visita",
        badge: "border-violet-500/25 bg-violet-500/10 text-violet-900 dark:text-violet-200/90",
        ring: "ring-violet-500/20",
      };
    case "note":
      return {
        Icon: StickyNote,
        label: "Nota",
        badge:
          "border-[var(--color-brass)]/30 bg-[var(--color-brass)]/10 text-[var(--color-brass-deep)]",
        ring: "ring-[var(--color-brass)]/15",
      };
    case "status_change":
      return {
        Icon: RefreshCw,
        label: "Stato",
        badge: "border-amber-500/25 bg-amber-500/10 text-amber-900 dark:text-amber-200/90",
        ring: "ring-amber-500/20",
      };
    case "ai_insight":
      return {
        Icon: Sparkles,
        label: "AI",
        badge: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-900 dark:text-fuchsia-200/85",
        ring: "ring-fuchsia-500/20",
      };
    default:
      return {
        Icon: Activity,
        label: type.replace(/_/g, " "),
        badge: "border-[var(--border-subtle)] bg-[var(--bg-sunken)] text-[var(--fg-secondary)]",
        ring: "ring-[var(--border-subtle)]/60",
      };
  }
}

type Props = {
  events: LeadTimelineEvent[];
};

export function LeadActivityTimeline({ events }: Props) {
  if (!events.length) {
    return (
      <p className="text-[13px] text-[var(--fg-muted)] py-10 text-center border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-sunken)]/30">
        Nessuna attività registrata. Usa la quick action &quot;Nuova nota&quot; o pubblica qui
        sotto.
      </p>
    );
  }

  return (
    <ul className="relative space-y-0">
      {events.map((ev, i) => {
        const v = visualForType(ev.type);
        const Icon = v.Icon;
        return (
          <li
            key={ev.id}
            className="group relative pl-10 pb-7 last:pb-1 animate-in-card"
            style={{ animationDelay: `${Math.min(i * 45, 420)}ms` }}
          >
            <span
              className={`absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-[var(--fg-secondary)] shadow-sm ring-1 ${v.ring} transition-transform duration-200 ease-out group-hover:scale-[1.04]`}
            >
              <Icon className="size-4" aria-hidden />
            </span>
            {i < events.length - 1 ? (
              <span
                className="absolute left-[15px] top-9 bottom-0 w-px bg-gradient-to-b from-[var(--border-subtle)] to-transparent"
                aria-hidden
              />
            ) : null}
            <article className="group rounded-2xl border border-[var(--border-subtle)]/80 bg-[var(--bg-sunken)]/35 px-4 py-3 transition-all duration-200 ease-out hover:border-[var(--color-brass)]/25 hover:bg-[var(--bg-elevated)]/50 hover:shadow-[0_10px_36px_-20px_rgba(24,20,16,0.18)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${v.badge}`}
                    >
                      {v.label}
                    </span>
                    <h3 className="text-[14px] font-medium leading-snug text-[var(--fg-primary)]">
                      {ev.title}
                    </h3>
                  </div>
                  {ev.detail ? (
                    <p className="text-[12px] leading-relaxed text-[var(--fg-secondary)] whitespace-pre-wrap">
                      {ev.detail}
                    </p>
                  ) : null}
                </div>
                <time
                  className="shrink-0 rounded-md border border-transparent bg-[var(--bg-sunken)]/50 px-2 py-1 font-mono text-[10px] text-[var(--fg-muted)] transition-colors duration-200 group-hover:border-[var(--border-subtle)] group-hover:text-[var(--fg-secondary)]"
                  dateTime={ev.occurredAt}
                >
                  {formatRelative(ev.occurredAt)}
                </time>
              </div>
              <p className="mt-3 border-t border-[var(--border-subtle)]/60 pt-2.5 text-[10px] text-[var(--fg-muted)]">
                {ev.actorName ? (
                  <span className="font-medium text-[var(--fg-secondary)]">{ev.actorName}</span>
                ) : null}
                {ev.actorName ? (
                  <span className="mx-1.5 text-[var(--border-subtle)]">·</span>
                ) : null}
                <span className="font-mono uppercase tracking-wide">
                  {ev.type.replace(/_/g, " ")}
                </span>
              </p>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
