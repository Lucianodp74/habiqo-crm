"use client";

import { mergeLeadRecordIntoPipelineLead } from "@/lib/crm/merge-lead-record";
import {
  PIPELINE_COLUMNS,
  PIPELINE_COLUMN_IDS,
  type PipelineColumnId,
  type PipelineLead,
  buildColumnItemsFromLeads,
  columnIdToDbStatus,
  findContainerForDnd,
  findLeadColumn,
  isPipelineColumnId,
  statusToColumnId,
} from "@/lib/crm/pipeline";
import { createClient } from "@/lib/supabase/client";
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
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LeadCard, LeadCardDragPreview } from "./lead-card";
import { PipelineColumn } from "./pipeline-column";

type DragSnapshot = {
  items: Record<PipelineColumnId, string[]>;
  sourceColumn: PipelineColumnId;
};

export type PipelineBoardProps = {
  initialLeads: PipelineLead[];
  /** Realtime INSERT + post-UPDATE visibility: keep in sync with pipeline filters. */
  includeLeadInBoard?: (lead: PipelineLead) => boolean;
};

function removeLeadFromAllColumns(
  items: Record<PipelineColumnId, string[]>,
  leadId: string,
): Record<PipelineColumnId, string[]> {
  const next = { ...items };
  for (const col of PIPELINE_COLUMN_IDS) {
    next[col] = items[col].filter((id) => id !== leadId);
  }
  return next;
}

function placeLeadInColumn(
  items: Record<PipelineColumnId, string[]>,
  column: PipelineColumnId,
  leadId: string,
): Record<PipelineColumnId, string[]> {
  const stripped = removeLeadFromAllColumns(items, leadId);
  return {
    ...stripped,
    [column]: [...stripped[column], leadId],
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function realtimeFingerprint(lead: PipelineLead): string {
  return `${lead.status}\0${lead.updatedAt ?? ""}\0${lead.assignedToId ?? ""}\0${lead.fullName}`;
}

export function PipelineBoard({ initialLeads, includeLeadInBoard }: PipelineBoardProps) {
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
  const [enterPulseLeadIds, setEnterPulseLeadIds] = useState<ReadonlySet<string>>(() => new Set());

  const snapshotRef = useRef<DragSnapshot | null>(null);
  const dragLockLeadIdRef = useRef<string | null>(null);
  const includeLeadInBoardRef = useRef(includeLeadInBoard);
  const lastRealtimeFingerprintRef = useRef<Map<string, string>>(new Map());
  const leadsByIdRef = useRef(leadsById);
  const pulseTimeoutsRef = useRef<number[]>([]);

  includeLeadInBoardRef.current = includeLeadInBoard;
  useLayoutEffect(() => {
    leadsByIdRef.current = leadsById;
  }, [leadsById]);

  const setItems = useCallback((next: Record<PipelineColumnId, string[]>) => {
    itemsRef.current = next;
    setItemsState(next);
  }, []);

  useEffect(() => {
    const next = buildColumnItemsFromLeads(initialLeads);
    setItems(next);
    setLeadsById(Object.fromEntries(initialLeads.map((l) => [l.id, l])));
  }, [initialLeads, setItems]);

  useEffect(() => {
    return () => {
      for (const tid of pulseTimeoutsRef.current) {
        window.clearTimeout(tid);
      }
      pulseTimeoutsRef.current = [];
    };
  }, []);

  const triggerEnterPulse = useCallback((leadId: string) => {
    setEnterPulseLeadIds((prev) => {
      const n = new Set(prev);
      n.add(leadId);
      return n;
    });
    const tid = window.setTimeout(() => {
      setEnterPulseLeadIds((prev) => {
        const n = new Set(prev);
        n.delete(leadId);
        return n;
      });
      pulseTimeoutsRef.current = pulseTimeoutsRef.current.filter((x) => x !== tid);
    }, 700);
    pulseTimeoutsRef.current.push(tid);
  }, []);

  const applyRealtimePayload = useCallback(
    (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
      const shouldInclude = (lead: PipelineLead) =>
        includeLeadInBoardRef.current ? includeLeadInBoardRef.current(lead) : true;

      if (payload.eventType === "DELETE") {
        const oldRow = payload.old;
        if (!isRecord(oldRow)) return;
        const id = oldRow.id;
        if (typeof id !== "string") return;

        setLeadsById((prev) => {
          if (!(id in prev)) return prev;
          const { [id]: _, ...rest } = prev;
          return rest;
        });
        setItemsState((prev) => {
          const next = removeLeadFromAllColumns(prev, id);
          itemsRef.current = next;
          return next;
        });
        lastRealtimeFingerprintRef.current.delete(id);
        return;
      }

      const rawNew = payload.new;
      if (!isRecord(rawNew)) return;

      const id = rawNew.id;
      if (typeof id !== "string") return;

      // During drag, avoid reordering / merging the card being dragged (optimistic column vs DB echo).
      if (dragLockLeadIdRef.current === id) return;

      const prevLead = leadsByIdRef.current[id] ?? null;
      const merged = mergeLeadRecordIntoPipelineLead(rawNew, prevLead);
      if (!merged) return;

      const fp = realtimeFingerprint(merged);
      if (lastRealtimeFingerprintRef.current.get(id) === fp) return;
      lastRealtimeFingerprintRef.current.set(id, fp);

      if (payload.eventType === "INSERT") {
        if (!shouldInclude(merged)) return;
        const col = statusToColumnId(merged.status);
        const prevItems = itemsRef.current;
        const nextItems = placeLeadInColumn(prevItems, col, id);
        itemsRef.current = nextItems;
        setLeadsById((prev) => ({ ...prev, [id]: merged }));
        setItemsState(nextItems);
        triggerEnterPulse(id);
        return;
      }

      if (payload.eventType === "UPDATE") {
        const included = shouldInclude(merged);
        if (!included) {
          setLeadsById((prev) => {
            if (!(id in prev)) return prev;
            const { [id]: _, ...rest } = prev;
            return rest;
          });
          setItemsState((prev) => {
            if (!PIPELINE_COLUMN_IDS.some((c) => prev[c].includes(id))) return prev;
            const next = removeLeadFromAllColumns(prev, id);
            itemsRef.current = next;
            return next;
          });
          lastRealtimeFingerprintRef.current.delete(id);
          return;
        }

        const prevCol = prevLead ? statusToColumnId(prevLead.status) : undefined;
        const nextCol = statusToColumnId(merged.status);
        const prevItems = itemsRef.current;
        const currentCol = findLeadColumn(prevItems, id);
        const needsMove = currentCol !== nextCol;

        setLeadsById((prev) => ({ ...prev, [id]: merged }));

        if (needsMove) {
          const nextItems = placeLeadInColumn(prevItems, nextCol, id);
          itemsRef.current = nextItems;
          setItemsState(nextItems);
        }

        if (prevCol !== undefined && prevCol !== nextCol) {
          triggerEnterPulse(id);
        }
      }
    },
    [triggerEnterPulse],
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("crm-pipeline-leads")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          try {
            applyRealtimePayload(payload);
          } catch (e) {
            console.error("[crm-pipeline-realtime]", e);
          }
        },
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" && err) {
          console.error("[crm-pipeline-realtime] subscribe", err);
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [applyRealtimePayload]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const onDragStart = useCallback((event: DragStartEvent) => {
    const activeIdStr = event.active.id as string;
    const sourceColumn = findContainerForDnd(itemsRef.current, activeIdStr);
    if (!sourceColumn) return;
    dragLockLeadIdRef.current = activeIdStr;
    snapshotRef.current = {
      items: structuredClone(itemsRef.current),
      sourceColumn,
    };
    setActiveId(activeIdStr);
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
    dragLockLeadIdRef.current = null;
    setActiveId(null);
    const snap = snapshotRef.current;
    if (snap) {
      setItems(snap.items);
    }
  }, [setItems]);

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const activeIdStr = event.active.id as string;
      setActiveId(null);

      try {
        const snap = snapshotRef.current;
        let working = itemsRef.current;

        const { over } = event;
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
            const body: unknown = await res.json().catch(() => ({}));
            const msg =
              isRecord(body) && typeof body.error === "string"
                ? body.error
                : "Aggiornamento fallito";
            throw new Error(msg);
          }
          setLeadsById((prev) => {
            const row = prev[activeIdStr];
            if (!row) return prev;
            const nextRow = { ...row, status };
            lastRealtimeFingerprintRef.current.set(activeIdStr, realtimeFingerprint(nextRow));
            return { ...prev, [activeIdStr]: nextRow };
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
      } finally {
        dragLockLeadIdRef.current = null;
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
                  return <LeadCard key={id} lead={lead} surfacePulse={enterPulseLeadIds.has(id)} />;
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
