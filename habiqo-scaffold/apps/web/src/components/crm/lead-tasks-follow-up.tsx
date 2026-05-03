"use client";

import { Bell, CalendarClock, CheckCircle2, Circle } from "lucide-react";
import { useCallback, useEffect, useId, useState } from "react";

export type LeadTaskItem = {
  id: string;
  label: string;
  done: boolean;
  /** Etichetta reminder breve (es. "Oggi", "48h") */
  dueLabel: string;
  urgent?: boolean;
};

const STORAGE_PREFIX = "habiqo.leadTasks.";

function defaultTasksForLead(leadId: string): LeadTaskItem[] {
  const n = leadId.charCodeAt(0) % 2;
  const base: LeadTaskItem[] = [
    {
      id: "t1",
      label: "Confermare recap esigenze e budget con il cliente",
      done: false,
      dueLabel: "Oggi",
      urgent: true,
    },
    {
      id: "t2",
      label: "Inviare proposta immobili selezionati (max 3)",
      done: false,
      dueLabel: "48h",
      urgent: false,
    },
    {
      id: "t3",
      label: "Aggiornare stato pipeline dopo il prossimo contatto",
      done: n === 0,
      dueLabel: "Settimana",
      urgent: false,
    },
  ];
  return base;
}

type Props = {
  leadId: string;
};

export function LeadTasksFollowUp({ leadId }: Props) {
  const listId = useId();
  const [tasks, setTasks] = useState<LeadTaskItem[]>(() => defaultTasksForLead(leadId));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + leadId);
      if (raw) {
        const parsed = JSON.parse(raw) as LeadTaskItem[];
        if (
          Array.isArray(parsed) &&
          parsed.every((t) => typeof t?.id === "string" && typeof t?.label === "string")
        ) {
          setTasks(parsed);
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, [leadId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_PREFIX + leadId, JSON.stringify(tasks));
    } catch {
      /* ignore */
    }
  }, [tasks, leadId, hydrated]);

  const toggle = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;

  return (
    <section
      id="lead-tasks-follow-up"
      className="glass-panel rounded-2xl p-5 sm:p-6 transition-shadow duration-300 hover:shadow-[0_12px_40px_-24px_rgba(24,20,16,0.2)] animate-in-card [animation-delay:140ms]"
    >
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[20px] text-[var(--fg-primary)]">Task & follow-up</h2>
          <p className="mt-1 text-[12px] text-[var(--fg-muted)]">
            Checklist locale al browser · {completed}/{total} completati
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-sunken)]/80 px-3 py-1 text-[11px] font-medium text-[var(--fg-secondary)]">
          <CalendarClock className="size-3.5 text-[var(--color-brass)]" aria-hidden />
          Reminder
        </span>
      </header>

      <ul className="space-y-2" id={listId} aria-label="Task e follow-up">
        {tasks.map((t) => (
          <li key={t.id}>
            <label
              className={`group flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-all duration-200 ease-out ${
                t.done
                  ? "border-[var(--border-subtle)]/60 bg-[var(--bg-sunken)]/35 opacity-80"
                  : "border-[var(--border-subtle)]/90 bg-[var(--bg-canvas)]/30 hover:border-[var(--color-brass)]/25 hover:bg-[var(--bg-elevated)]/60"
              }`}
            >
              <input
                type="checkbox"
                className="peer sr-only"
                checked={t.done}
                onChange={() => toggle(t.id)}
              />
              <span className="mt-0.5 shrink-0 text-[var(--fg-muted)] transition-colors duration-200 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-brass)]/40">
                {t.done ? (
                  <CheckCircle2 className="size-5 text-[var(--color-positive)]" aria-hidden />
                ) : (
                  <Circle
                    className="size-5 transition-transform duration-200 group-hover:scale-105"
                    aria-hidden
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <span
                  className={`block text-[13px] leading-snug ${
                    t.done
                      ? "text-[var(--fg-muted)] line-through decoration-[var(--border-subtle)]"
                      : "text-[var(--fg-primary)]"
                  }`}
                >
                  {t.label}
                </span>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-mono uppercase tracking-wide ${
                      t.urgent && !t.done
                        ? "border border-[var(--color-warning)]/35 bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                        : "border border-[var(--border-subtle)] bg-[var(--bg-sunken)]/80 text-[var(--fg-muted)]"
                    }`}
                  >
                    {!t.done && t.urgent ? <Bell className="size-3" aria-hidden /> : null}
                    {t.dueLabel}
                  </span>
                </div>
              </div>
            </label>
          </li>
        ))}
      </ul>
    </section>
  );
}
