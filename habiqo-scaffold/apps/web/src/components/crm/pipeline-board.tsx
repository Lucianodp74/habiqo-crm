"use client";

import {
  PIPELINE_COLUMNS,
  type PipelineColumnId,
  type PipelineLead,
  buildColumnItemsFromLeads,
  columnIdToDbStatus,
  findContainerForDnd,
  findLeadColumn,
  isPipelineColumnId,
} from "@/lib/crm/pipeline";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LeadCard, LeadCardDragPreview } from "./lead-card";
import { PipelineColumn } from "./pipeline-column";

type DragSnapshot = {
  items: Record<PipelineColumnId, string[]>;
  sourceColumn: PipelineColumnId;
};

export type PipelineBoardProps = {
  initialLeads: PipelineLead[];
};

export function PipelineBoard({ initialLeads }: PipelineBoardProps) {
  const itemsRef = useRef<Record<PipelineColumnId, string[]>>(
    buildColumnItemsFromLeads(initialLeads),
  );
  const [items, setItemsState] = useState<Record<PipelineColumnId, string[]>>(() => {
    const initial = buildColumnItemsFromLeads(initialLeads);
    itemsRef.current = initial;
    return initial;
  });
  const [leadsById, setLeadsById] = useState<Record<string, PipelineLead>>(() =>
    Object.fromEntries(initialLeads.map((l) => [l.id, l])),
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const snapshotRef = useRef<DragSnapshot | null>(null);

  const setItems = useCallback((next: Record<PipelineColumnId, string[]>) => {
    itemsRef.current = next;
    setItemsState(next);
  }, []);

  useEffect(() => {
    const next = buildColumnItemsFromLeads(initialLeads);
    setItems(next);
    setLeadsById(Object.fromEntries(initialLeads.map((l) => [l.id, l])));
  }, [initialLeads, setItems]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    const sourceColumn = findContainerForDnd(itemsRef.current, event.active.id as string);
    if (!sourceColumn) return;
    snapshotRef.current = {
      items: structuredClone(itemsRef.current),
      sourceColumn,
    };
    setActiveId(event.active.id as string);
  }, []);

  const onDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    const overId = over?.id;
    if (overId == null || active.id === overId) return;

    setItemsState((prev) => {
      const activeContainer = findContainerForDnd(prev, active.id as string);
      const overContainer = findContainerForDnd(prev, overId as string);
      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return prev;
      }

      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const activeIndex = activeItems.indexOf(active.id as string);
      if (activeIndex === -1) return prev;

      const activeIdStr = active.id as string;
      const overIdStr = overId as string;

      let newIndex: number;
      if (isPipelineColumnId(overIdStr)) {
        newIndex = overItems.length;
      } else {
        const overIndex = overItems.indexOf(overIdStr);
        if (overIndex === -1) return prev;
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        const modifier = isBelowOverItem ? 1 : 0;
        newIndex = overIndex + modifier;
      }

      const next = {
        ...prev,
        [activeContainer]: activeItems.filter((id) => id !== activeIdStr),
        [overContainer]: [
          ...overItems.slice(0, newIndex),
          activeIdStr,
          ...overItems.slice(newIndex),
        ],
      };
      itemsRef.current = next;
      return next;
    });
  }, []);

  const onDragCancel = useCallback(() => {
    setActiveId(null);
    const snap = snapshotRef.current;
    if (snap) {
      setItems(snap.items);
    }
  }, [setItems]);

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      const activeIdStr = active.id as string;
      setActiveId(null);

      const snap = snapshotRef.current;
      let working = itemsRef.current;

      if (!over) {
        if (snap) setItems(snap.items);
        return;
      }

      const activeContainer = findContainerForDnd(working, activeIdStr);
      const overContainer = findContainerForDnd(working, over.id as string);

      if (!activeContainer || !overContainer) {
        if (snap) setItems(snap.items);
        return;
      }

      if (activeContainer === overContainer) {
        const oldIndex = working[activeContainer].indexOf(activeIdStr);
        const newIndex = working[activeContainer].indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          working = {
            ...working,
            [activeContainer]: arrayMove(working[activeContainer], oldIndex, newIndex),
          };
          setItems(working);
        }
      }

      if (!snap) return;

      const destNow = findContainerForDnd(working, activeIdStr);
      if (!destNow || snap.sourceColumn === destNow) return;

      const status = columnIdToDbStatus(destNow);

      try {
        const res = await fetch("/api/leads/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leadId: activeIdStr, status: destNow }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Aggiornamento fallito");
        }
        setLeadsById((prev) => {
          const row = prev[activeIdStr];
          if (!row) return prev;
          return { ...prev, [activeIdStr]: { ...row, status } };
        });
      } catch (e) {
        setItems(snap.items);
        const col = findLeadColumn(snap.items, activeIdStr);
        if (col) {
          const reverted = columnIdToDbStatus(col);
          setLeadsById((prev) => {
            const row = prev[activeIdStr];
            if (!row) return prev;
            return { ...prev, [activeIdStr]: { ...row, status: reverted } };
          });
        }
        toast.error(e instanceof Error ? e.message : "Impossibile aggiornare lo stato");
      }
    },
    [setItems],
  );

  const activeLead = activeId ? leadsById[activeId] : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory">
        {PIPELINE_COLUMNS.map((col) => {
          const leadIds = items[col.id];
          return (
            <PipelineColumn
              key={col.id}
              id={col.id}
              label={col.label}
              shortLabel={col.shortLabel}
              count={leadIds.length}
              leadIds={leadIds}
            >
              {leadIds.length === 0 ? (
                <p className="text-[12px] text-[var(--fg-muted)] px-2 py-8 text-center border border-dashed border-[var(--border-subtle)] rounded-xl bg-[var(--bg-sunken)]/40">
                  Nessun lead
                </p>
              ) : (
                leadIds.map((id) => {
                  const lead = leadsById[id];
                  if (!lead) return null;
                  return <LeadCard key={id} lead={lead} />;
                })
              )}
            </PipelineColumn>
          );
        })}
      </div>

      <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.18, 0.67, 0.6, 1)" }}>
        {activeLead ? <LeadCardDragPreview lead={activeLead} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
