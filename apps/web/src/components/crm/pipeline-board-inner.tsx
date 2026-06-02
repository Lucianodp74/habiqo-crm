"use client";

import { mergeLeadRecordIntoPipelineLead } from "@/lib/crm/merge-lead-record";
import {
  PIPELINE_COLUMNS,
  type PipelineColumnDynamic,
  type PipelineLead,
  buildColumnItemsFromLeads,
  buildColumnItemsFromLeadsDynamic,
  columnIdToDbStatus,
  dynamicColumnIdToDbStatus,
  findLeadColumnDynamic,
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
  pointerWithin,
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
  items: Record<string, string[]>;
  sourceColumn: string;
};

export type PipelineBoardProps = {
  initialLeads: PipelineLead[];
  columns?: PipelineColumnDynamic[];
  includeLeadInBoard?: (lead: PipelineLead) => boolean;
};

function removeLeadFromAllColumnsDynamic(
  items: Record<string, string[]>,
  leadId: string,
): Record<string, string[]> {
  const next = { ...items };
  for (const col of Object.keys(items)) {
    next[col] = (items[col] ?? []).filter((id) => id !== leadId);
  }
  return next;
}

function placeLeadInColumnDynamic(
  items: Record<string, string[]>,
  column: string,
  leadId: string,
): Record<string, string[]> {
  const stripped = removeLeadFromAllColumnsDynamic(items, leadId);
  return {
    ...stripped,
    [column]: [...(stripped[column] ?? []), leadId],
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function realtimeFingerprint(lead: PipelineLead): string {
  return `${lead.status}\0${lead.updatedAt ?? ""}\0${lead.assignedToId ?? ""}\0${lead.fullName}`;
}

function resolveColId(id: string, items: Record<string, string[]>): string | undefined {
  if (id in items) return id;
  return findLeadColumnDynamic(items, id);
}

export function PipelineBoard({ initialLeads, columns, includeLeadInBoard }: PipelineBoardProps) {
  const isDynamic = columns !== undefined && columns.length > 0;

  const buildInitialItems = useCallback(() => {
    if (isDynamic) {
      return buildColumnItemsFromLeadsDynamic(initialLeads, columns);
    }
    return buildColumnItemsFromLeads(initialLeads) as Record<string, string[]>;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemsRef = useRef<Record<string, string[]>>(buildInitialItems());
  const [items, setItemsState] = useState<Record<string, string[]>>(buildInitialItems);
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
  const columnsRef = useRef(columns);
  const pulseTimeoutsRef = useRef<number[]>([]);

  includeLeadInBoardRef.current = includeLeadInBoard;
  columnsRef.current = columns;
  useLayoutEffect(() => {
    leadsByIdRef.current = leadsById;
  }, [leadsById]);

  const setItems = useCallback((next: Record<string, string[]>) => {
    itemsRef.current = next;
    setItemsState(next);
  }, []);

  useEffect(() => {
    const next = isDynamic
      ? buildColumnItemsFromLeadsDynamic(initialLeads, columns)
      : (buildColumnItemsFromLeads(initialLeads) as Record<string, string[]>);
    setItems(next);
    setLeadsById(Object.fromEntries(initialLeads.map((l) => [l.id, l])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const resolveColumnForLead = useCallback((lead: PipelineLead): string => {
    const cols = columnsRef.current;
    if (cols && cols.length > 0) {
      const temp = buildColumnItemsFromLeadsDynamic([lead], cols);
      const found = findLeadColumnDynamic(temp, lead.id);
      if (found) return found;
    }
    return statusToColumnId(lead.status);
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
          const next = removeLeadFromAllColumnsDynamic(prev, id);
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
      if (dragLockLeadIdRef.current === id) return;

      const prevLead = leadsByIdRef.current[id] ?? null;
      const merged = mergeLeadRecordIntoPipelineLead(rawNew, prevLead);
      if (!merged) return;

      const fp = realtimeFingerprint(merged);
      if (lastRealtimeFingerprintRef.current.get(id) === fp) return;
      lastRealtimeFingerprintRef.current.set(id, fp);

      if (payload.eventType === "INSERT") {
        if (!shouldInclude(merged)) return;
        const col = resolveColumnForLead(merged);
        const prevItems = itemsRef.current;
        const nextItems = placeLeadInColumnDynamic(prevItems, col, id);
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
            if (!Object.values(prev).some((ids) => ids.includes(id))) return prev;
            const next = removeLeadFromAllColumnsDynamic(prev, id);
            itemsRef.current = next;
            return next;
          });
          lastRealtimeFingerprintRef.current.delete(id);
          return;
        }

        const prevCol = prevLead ? resolveColumnForLead(prevLead) : undefined;
        const nextCol = resolveColumnForLead(merged);
        const prevItems = itemsRef.current;
        const currentCol = findLeadColumnDynamic(prevItems, id);
        const needsMove = currentCol !== nextCol;

        setLeadsById((prev) => ({ ...prev, [id]: merged }));

        if (needsMove) {
          const nextItems = placeLeadInColumnDynamic(prevItems, nextCol, id);
          itemsRef.current = nextItems;
          setItemsState(nextItems);
        }

        if (prevCol !== undefined && prevCol !== nextCol) {
          triggerEnterPulse(id);
        }
      }
    },
    [triggerEnterPulse, resolveColumnForLead],
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
    const sourceColumn = resolveColId(activeIdStr, itemsRef.current);
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

    const activeIdStr = active.id as string;
    const overIdStr = overId as string;
    const current = itemsRef.current;

    const activeContainer = resolveColId(activeIdStr, current);
    const overContainer = resolveColId(overIdStr, current);

    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    const activeItems = current[activeContainer] ?? [];
    const overItems = current[overContainer] ?? [];
    const activeIndex = activeItems.indexOf(activeIdStr);
    if (activeIndex === -1) return;

    let newIndex: number;
    if (overIdStr in current) {
      newIndex = overItems.length;
    } else {
      const overIndex = overItems.indexOf(overIdStr);
      if (overIndex === -1) {
        newIndex = overItems.length;
      } else {
        const isBelowOverItem =
          over &&
          active.rect.current.translated &&
          active.rect.current.translated.top > over.rect.top + over.rect.height;
        newIndex = overIndex + (isBelowOverItem ? 1 : 0);
      }
    }

    const next = {
      ...current,
      [activeContainer]: activeItems.filter((id) => id !== activeIdStr),
      [overContainer]: [
        ...overItems.slice(0, newIndex),
        activeIdStr,
        ...overItems.slice(newIndex),
      ],
    };

    itemsRef.current = next;
    setItemsState(next);
  }, []);

  const onDragCancel = useCallback(() => {
    dragLockLeadIdRef.current = null;
    setActiveId(null);
    const snap = snapshotRef.current;
    if (snap) setItems(snap.items);
  }, [setItems]);

  const onDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const activeIdStr = event.active.id as string;
      setActiveId(null);

      try {
        const snap = snapshotRef.current;
        const { over } = event;

        if (!over) {
          if (snap) setItems(snap.items);
          return;
        }

        const current = itemsRef.current;
        const dropTargetId = over.id as string;
        const destNow = resolveColId(dropTargetId, current);

        if (!snap || !destNow) {
          if (snap) setItems(snap.items);
          return;
        }

        // Same column — handle reorder
        if (snap.sourceColumn === destNow) {
          const colItems = current[destNow] ?? [];
          const oldIndex = colItems.indexOf(activeIdStr);
          const newIndex = colItems.indexOf(dropTargetId);
          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            setItems({
              ...current,
              [destNow]: arrayMove(colItems, oldIndex, newIndex),
            });
          }
          return;
        }

        // Cross-column move — resolve DB status from destNow UUID
        const cols = columnsRef.current;
        let status: string | null = null;
        if (cols && cols.length > 0) {
          status = dynamicColumnIdToDbStatus(destNow, cols);
        } else if (isPipelineColumnId(destNow)) {
          status = columnIdToDbStatus(destNow);
        }

        if (!status) {
          toast.error("Stage personalizzato: spostamento non ancora supportato");
          setItems(snap.items);
          return;
        }

        try {
          const res = await fetch("/api/leads/update-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ leadId: activeIdStr, status }),
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
            const nextRow = { ...row, status: status! };
            lastRealtimeFingerprintRef.current.set(activeIdStr, realtimeFingerprint(nextRow));
            return { ...prev, [activeIdStr]: nextRow };
          });
        } catch (e) {
          setItems(snap.items);
          const revertCol = findLeadColumnDynamic(snap.items, activeIdStr);
          if (revertCol) {
            const cols2 = columnsRef.current;
            const revertedStatus =
              cols2 && cols2.length > 0
                ? dynamicColumnIdToDbStatus(revertCol, cols2)
                : isPipelineColumnId(revertCol)
                  ? columnIdToDbStatus(revertCol)
                  : null;
            if (revertedStatus) {
              setLeadsById((prev) => {
                const row = prev[activeIdStr];
                if (!row) return prev;
                return { ...prev, [activeIdStr]: { ...row, status: revertedStatus } };
              });
            }
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

  const columnsToRender = isDynamic
    ? columns.map((col) => ({
        id: col.id,
        label: col.label,
        shortLabel: col.shortLabel,
        color: col.color,
      }))
    : PIPELINE_COLUMNS.map((col) => ({
        id: col.id,
        label: col.label,
        shortLabel: col.shortLabel,
        color: "#6B7280",
      }));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={onDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory">
        {columnsToRender.map((col) => {
          const leadIds = items[col.id] ?? [];
          return (
            <PipelineColumn
              key={col.id}
              id={col.id}
              label={col.label}
              shortLabel={col.shortLabel}
              color={col.color}
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
