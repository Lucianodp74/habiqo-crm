"use client";

import {
  deletePipelineStage,
  reorderPipelineStages,
  upsertPipelineStage,
} from "@/lib/actions/pipeline-stages";
import type { PipelineStage } from "@/lib/queries/pipeline-stages";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────

type Props = {
  initialStages: PipelineStage[];
};

type EditingState = {
  id: string;
  name: string;
  color: string;
  shortLabel: string;
};

// ─── Color presets ───────────────────────────────────────────────

const COLOR_PRESETS = [
  "#3B82F6", // blue
  "#8B5CF6", // violet
  "#F59E0B", // amber
  "#EF4444", // red
  "#10B981", // emerald
  "#6B7280", // gray
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
  "#84CC16", // lime
];

// ─── Sub-components ──────────────────────────────────────────────

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {COLOR_PRESETS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
            value === c ? "border-[var(--fg-primary)] scale-110" : "border-transparent"
          }`}
          style={{ backgroundColor: c }}
          title={c}
          aria-label={`Colore ${c}`}
        />
      ))}
      {/* Custom hex input */}
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-6 h-6 rounded cursor-pointer border border-[var(--border-subtle)]"
        title="Colore personalizzato"
      />
    </div>
  );
}

function StageRow({
  stage,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onEdit,
  onDelete,
  isEditing,
  editingState,
  onEditChange,
  onEditSave,
  onEditCancel,
  isSaving,
}: {
  stage: PipelineStage;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  editingState: EditingState | null;
  onEditChange: (patch: Partial<EditingState>) => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  isSaving: boolean;
}) {
  if (isEditing && editingState) {
    return (
      <li className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1">
              Nome stage
            </label>
            <input
              type="text"
              value={editingState.name}
              onChange={(e) => onEditChange({ name: e.target.value })}
              maxLength={60}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--fg-muted)] mb-1">
              Etichetta breve (max 12 caratteri)
            </label>
            <input
              type="text"
              value={editingState.shortLabel}
              onChange={(e) => onEditChange({ shortLabel: e.target.value.slice(0, 12) })}
              maxLength={12}
              placeholder={editingState.name.slice(0, 6)}
              className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--fg-muted)] mb-2">Colore</label>
            <ColorPicker value={editingState.color} onChange={(c) => onEditChange({ color: c })} />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onEditSave}
              disabled={isSaving || !editingState.name.trim()}
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-[var(--color-onyx-900)] text-white hover:bg-[var(--color-onyx-800)] disabled:opacity-50 transition-colors"
            >
              {isSaving ? "Salvo…" : "Salva"}
            </button>
            <button
              type="button"
              onClick={onEditCancel}
              className="px-4 py-1.5 text-sm rounded-lg text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)] transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-4 py-3 group">
      {/* Color dot */}
      <span className="shrink-0 w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-[var(--fg-primary)]">{stage.name}</span>
        {stage.isSystem && (
          <span className="ml-2 text-[10px] font-mono text-[var(--fg-muted)] uppercase tracking-wide">
            sistema
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Move up */}
        <button
          type="button"
          onClick={onMoveUp}
          disabled={index === 0}
          className="p-1.5 rounded-md hover:bg-[var(--bg-sunken)] disabled:opacity-30 transition-colors"
          aria-label="Sposta su"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
        {/* Move down */}
        <button
          type="button"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="p-1.5 rounded-md hover:bg-[var(--bg-sunken)] disabled:opacity-30 transition-colors"
          aria-label="Sposta giù"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {/* Edit */}
        <button
          type="button"
          onClick={onEdit}
          className="p-1.5 rounded-md hover:bg-[var(--bg-sunken)] transition-colors"
          aria-label="Modifica stage"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        {/* Delete (custom stages only) */}
        {!stage.isSystem && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors text-[var(--fg-muted)]"
            aria-label="Elimina stage"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </button>
        )}
      </div>
    </li>
  );
}

// ─── Add new stage form ──────────────────────────────────────────

function AddStageForm({
  onAdd,
  nextSortOrder,
}: {
  onAdd: (stage: { name: string; color: string; shortLabel: string; sortOrder: number }) => void;
  nextSortOrder: number;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#3B82F6");
  const [shortLabel, setShortLabel] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await upsertPipelineStage({
        name: name.trim(),
        shortLabel: shortLabel.trim() || undefined,
        color,
        sortOrder: nextSortOrder,
      });
      if (result.ok) {
        toast.success("Stage aggiunto");
        setName("");
        setColor("#3B82F6");
        setShortLabel("");
        setOpen(false);
        onAdd({
          name: name.trim(),
          color,
          shortLabel: shortLabel.trim(),
          sortOrder: nextSortOrder,
        });
      } else {
        toast.error(result.error.message);
      }
    });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-[var(--border-subtle)] text-sm text-[var(--fg-muted)] hover:border-[var(--color-brass)] hover:text-[var(--fg-primary)] transition-colors"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Aggiungi stage personalizzato
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-brass)]/30 bg-[var(--bg-elevated)] p-4 space-y-3">
      <p className="text-sm font-medium">Nuovo stage</p>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        placeholder="Nome dello stage"
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/40"
      />
      <input
        type="text"
        value={shortLabel}
        onChange={(e) => setShortLabel(e.target.value.slice(0, 12))}
        maxLength={12}
        placeholder="Etichetta breve (opzionale)"
        className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/40"
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !name.trim()}
          className="px-4 py-1.5 text-sm font-medium rounded-lg bg-[var(--color-onyx-900)] text-white hover:bg-[var(--color-onyx-800)] disabled:opacity-50 transition-colors"
        >
          {isPending ? "Aggiungendo…" : "Aggiungi"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-1.5 text-sm rounded-lg text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)] transition-colors"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}

// ─── Main editor ─────────────────────────────────────────────────

export function PipelineStagesEditor({ initialStages }: Props) {
  const [stages, setStages] = useState<PipelineStage[]>(initialStages);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [isPending, startTransition] = useTransition();

  // ── Reorder helpers ─────────────────────────────────────────────

  const move = useCallback(
    (index: number, direction: "up" | "down") => {
      const newStages = [...stages];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= newStages.length) return;

      const tmp = newStages[index]!;
      newStages[index] = newStages[swapIndex]!;
      newStages[swapIndex] = tmp;

      // Optimistic update
      setStages(newStages);

      // Persist
      startTransition(async () => {
        const result = await reorderPipelineStages({
          orderedIds: newStages.map((s) => s.id),
        });
        if (!result.ok) {
          toast.error("Riordino non salvato");
          setStages(stages); // revert
        }
      });
    },
    [stages],
  );

  // ── Edit handlers ───────────────────────────────────────────────

  const startEdit = useCallback((stage: PipelineStage) => {
    setEditingId(stage.id);
    setEditingState({
      id: stage.id,
      name: stage.name,
      color: stage.color,
      shortLabel: stage.shortLabel ?? "",
    });
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingState(null);
  }, []);

  const saveEdit = useCallback(() => {
    if (!editingState) return;
    const { id, name, color, shortLabel } = editingState;
    const stage = stages.find((s) => s.id === id);
    if (!stage) return;

    // Optimistic update
    setStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name, color, shortLabel: shortLabel || null } : s)),
    );
    setEditingId(null);
    setEditingState(null);

    startTransition(async () => {
      const result = await upsertPipelineStage({
        id,
        name,
        shortLabel: shortLabel || undefined,
        color,
        sortOrder: stage.sortOrder,
      });
      if (!result.ok) {
        toast.error(result.error.message);
        // Revert
        setStages((prev) => prev.map((s) => (s.id === id ? stage : s)));
      } else {
        toast.success("Stage aggiornato");
      }
    });
  }, [editingState, stages]);

  // ── Delete handler ──────────────────────────────────────────────

  const handleDelete = useCallback(
    (stage: PipelineStage) => {
      if (stage.isSystem) return;
      if (!confirm(`Eliminare lo stage "${stage.name}"? Questa azione non può essere annullata.`))
        return;

      // Optimistic
      setStages((prev) => prev.filter((s) => s.id !== stage.id));

      startTransition(async () => {
        const result = await deletePipelineStage({ id: stage.id });
        if (!result.ok) {
          toast.error(result.error.message);
          setStages(stages); // revert
        } else {
          toast.success("Stage eliminato");
        }
      });
    },
    [stages],
  );

  // ── Add handler ─────────────────────────────────────────────────

  const handleAdd = useCallback(() => {
    // The actual insert is done inside AddStageForm via server action.
    // We reload the page to pick up the new ID from the DB.
    // Simple and safe — no need for complex state management here.
    window.location.reload();
  }, []);

  // ── Render ──────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {stages.map((stage, index) => (
          <StageRow
            key={stage.id}
            stage={stage}
            index={index}
            total={stages.length}
            onMoveUp={() => move(index, "up")}
            onMoveDown={() => move(index, "down")}
            onEdit={() => startEdit(stage)}
            onDelete={() => handleDelete(stage)}
            isEditing={editingId === stage.id}
            editingState={editingId === stage.id ? editingState : null}
            onEditChange={(patch) =>
              setEditingState((prev) => (prev ? { ...prev, ...patch } : prev))
            }
            onEditSave={saveEdit}
            onEditCancel={cancelEdit}
            isSaving={isPending}
          />
        ))}
      </ul>

      <AddStageForm onAdd={handleAdd} nextSortOrder={stages.length} />

      <p className="text-xs text-[var(--fg-muted)] pt-2">
        Gli stage di sistema non possono essere eliminati. Le modifiche ai nomi e ai colori si
        riflettono immediatamente nella pipeline.
      </p>
    </div>
  );
}
