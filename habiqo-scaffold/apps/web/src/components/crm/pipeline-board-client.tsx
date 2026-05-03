"use client";

import dynamic from "next/dynamic";
import type { PipelineBoardProps } from "./pipeline-board";

/**
 * Client-only wrapper around PipelineBoard.
 *
 * @dnd-kit calls useId() internally with a global counter that
 * desyncs between SSR and CSR (DndDescribedBy-N), causing hydration
 * mismatch warnings. The fix is to skip SSR for the DnD subtree
 * entirely — it's interactive code with no meaningful server render.
 *
 * The skeleton matches the final layout to avoid layout shift.
 * Data fetching stays in the parent Server Component.
 */

const PipelineBoardInner = dynamic(
  () => import("./pipeline-board-inner").then((m) => m.PipelineBoard),
  {
    ssr: false,
    loading: () => <PipelineBoardSkeleton />,
  },
);

export function PipelineBoard(props: PipelineBoardProps) {
  return <PipelineBoardInner {...props} />;
}

function PipelineBoardSkeleton() {
  return (
    <div aria-hidden className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="min-w-[280px] flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-3"
        >
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="h-3 w-20 rounded-md bg-[var(--bg-sunken)]" />
            <div className="h-3 w-6 rounded-md bg-[var(--bg-sunken)]" />
          </div>
          <div className="space-y-2">
            <div className="h-[78px] rounded-lg bg-[var(--bg-sunken)]" />
            <div className="h-[78px] rounded-lg bg-[var(--bg-sunken)]" />
            <div className="h-[78px] rounded-lg bg-[var(--bg-sunken)]" />
          </div>
        </div>
      ))}
    </div>
  );
}
