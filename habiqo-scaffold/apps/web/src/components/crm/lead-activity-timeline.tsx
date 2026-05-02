"use client";

import type { LeadTimelineEvent } from "@/lib/queries/lead-events";
import { formatRelative } from "@habiqo/utils";
import {
  Activity,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  RefreshCw,
  Sparkles,
  StickyNote,
} from "lucide-react";

function iconForType(type: string) {
  switch (type) {
    case "call":
      return Phone;
    case "email":
      return Mail;
    case "whatsapp":
      return MessageSquare;
    case "visit":
      return MapPin;
    case "note":
      return StickyNote;
    case "status_change":
      return RefreshCw;
    case "ai_insight":
      return Sparkles;
    default:
      return Activity;
  }
}

type Props = {
  events: LeadTimelineEvent[];
};

export function LeadActivityTimeline({ events }: Props) {
  if (!events.length) {
    return (
      <p className="text-[13px] text-[var(--fg-muted)] py-8 text-center border border-dashed border-[var(--border-subtle)] rounded-xl">
        Nessuna attività registrata. Aggiungi una nota qui sotto.
      </p>
    );
  }

  return (
    <ul className="space-y-0">
      {events.map((ev, i) => {
        const Icon = iconForType(ev.type);
        return (
          <li
            key={ev.id}
            className="relative pl-9 pb-6 last:pb-0 animate-in-card"
            style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
          >
            <span className="absolute left-0 top-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-sunken)] text-[var(--fg-secondary)]">
              <Icon className="size-3.5" aria-hidden />
            </span>
            {i < events.length - 1 ? (
              <span
                className="absolute left-[13px] top-8 bottom-0 w-px bg-[var(--border-subtle)]"
                aria-hidden
              />
            ) : null}
            <div className="rounded-xl border border-[var(--border-subtle)]/80 bg-[var(--bg-sunken)]/40 px-3 py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[13px] font-medium text-[var(--fg-primary)]">{ev.title}</p>
                <time
                  className="font-mono text-[10px] text-[var(--fg-muted)] shrink-0"
                  dateTime={ev.occurredAt}
                >
                  {formatRelative(ev.occurredAt)}
                </time>
              </div>
              {ev.detail ? (
                <p className="mt-1 text-[12px] text-[var(--fg-secondary)] whitespace-pre-wrap">
                  {ev.detail}
                </p>
              ) : null}
              <p className="mt-1.5 text-[10px] text-[var(--fg-muted)]">
                {ev.actorName ? `${ev.actorName} · ` : null}
                <span className="font-mono uppercase tracking-wide">
                  {ev.type.replace("_", " ")}
                </span>
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
