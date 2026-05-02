"use client";

import type { PipelineLead } from "@/lib/crm/pipeline";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pill } from "@habiqo/ui";
import { formatRelative, initials } from "@habiqo/utils";
import { GripVertical } from "lucide-react";
import Link from "next/link";

type LeadCardProps = {
  lead: PipelineLead;
};

export function LeadCard({ lead }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] shadow-sm transition-shadow duration-200 ease-out ${
        isDragging
          ? "opacity-90 shadow-lg ring-1 ring-[var(--color-brass)]/30 z-20"
          : "hover:shadow-md"
      }`}
    >
      <div className="flex gap-1 p-2.5">
        <button
          type="button"
          className="mt-0.5 shrink-0 touch-none cursor-grab rounded-md p-1 text-[var(--fg-muted)] hover:bg-[var(--bg-sunken)] hover:text-[var(--fg-primary)] active:cursor-grabbing transition-colors"
          aria-label="Trascina lead"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>

        <Link
          href={`/crm/leads/${lead.id}`}
          className="min-w-0 flex-1 block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]"
        >
          <div className="flex items-start gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-display text-[11px] shrink-0"
              style={{
                background: "var(--color-onyx-900)",
                color: "var(--color-brass-soft)",
              }}
            >
              {initials(lead.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium truncate text-[var(--fg-primary)]">
                {lead.fullName}
              </div>
              <div className="text-[11px] text-[var(--fg-muted)] truncate">
                {lead.lastActivityAt ? formatRelative(lead.lastActivityAt) : "Nessuna attività"}
              </div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <Pill
              tone={
                lead.temperature === "hot"
                  ? "warm"
                  : lead.temperature === "warm"
                    ? "brass"
                    : "neutral"
              }
              dot={lead.temperature === "hot"}
            >
              {lead.temperature === "hot"
                ? "Caldo"
                : lead.temperature === "warm"
                  ? "Tiepido"
                  : "Freddo"}
            </Pill>
            {lead.aiScore != null ? (
              <span className="font-mono text-[10px] text-[var(--accent-deep)] tabular-nums">
                {lead.aiScore}
              </span>
            ) : null}
          </div>
        </Link>
      </div>
    </div>
  );
}

export function LeadCardDragPreview({ lead }: { lead: PipelineLead }) {
  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] shadow-2xl ring-2 ring-[var(--color-brass)]/25 w-[260px] rotate-[1.5deg]">
      <div className="p-3">
        <div className="flex items-start gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-display text-[11px] shrink-0"
            style={{
              background: "var(--color-onyx-900)",
              color: "var(--color-brass-soft)",
            }}
          >
            {initials(lead.fullName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium truncate">{lead.fullName}</div>
            <div className="text-[11px] text-[var(--fg-muted)] truncate">
              {lead.lastActivityAt ? formatRelative(lead.lastActivityAt) : "Nessuna attività"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
