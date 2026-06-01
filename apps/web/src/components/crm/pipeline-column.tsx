"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { ReactNode } from "react";

type PipelineColumnProps = {
  /** Column identifier — PipelineColumnId (static) or UUID (dynamic). */
  id: string;
  label: string;
  shortLabel: string;
  count: number;
  leadIds: string[];
  children: ReactNode;
  /** Optional hex color for the column accent dot. Defaults to muted. */
  color?: string;
};

export function PipelineColumn({
  id,
  label,
  shortLabel,
  count,
  leadIds,
  children,
  color,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <section
      ref={setNodeRef}
      className={`min-w-[min(100%,280px)] w-[280px] shrink-0 snap-start flex flex-col rounded-2xl transition-[box-shadow,border-color,background] duration-300 ease-out glass-panel ${
        isOver
          ? "border-[var(--color-brass-soft)] shadow-[0_8px_30px_-12px_rgba(24,20,16,0.35)] ring-1 ring-[var(--color-brass)]/35"
          : ""
      }`}
    >
      <header className="flex items-center justify-between gap-2 px-3 pt-3 pb-2 border-b border-[var(--border-subtle)]/80">
        <div className="flex items-center gap-2 min-w-0">
          {/* Color accent dot — only shown when a custom color is provided */}
          {color && (
            <span
              className="shrink-0 w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
          )}
          <div className="min-w-0">
            <h2 className="text-[11px] font-medium tracking-wide text-[var(--fg-primary)] truncate">
              {label}
            </h2>
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--fg-muted)] truncate sm:hidden">
              {shortLabel}
            </p>
          </div>
        </div>
        <span
          className="font-mono text-[10px] tabular-nums text-[var(--fg-muted)] shrink-0 px-2 py-0.5 rounded-md bg-[var(--bg-sunken)]"
          aria-label={`${count} lead in colonna`}
        >
          {count}
        </span>
      </header>

      <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
        <div className="flex-1 flex flex-col gap-2 p-2.5 min-h-[140px]">{children}</div>
      </SortableContext>
    </section>
  );
}
