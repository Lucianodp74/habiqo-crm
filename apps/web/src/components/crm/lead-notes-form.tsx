"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type Props = {
  leadId: string;
};

export function LeadNotesForm({ leadId }: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  const submit = useCallback(async () => {
    const t = text.trim();
    if (!t) return;
    setPending(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: t }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: string }).error ?? "Errore salvataggio");
      }
      setText("");
      toast.success("Nota aggiunta");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Errore");
    } finally {
      setPending(false);
    }
  }, [leadId, router, text]);

  return (
    <div
      id="lead-notes-section"
      className="glass-panel rounded-2xl p-4 sm:p-5 scroll-mt-28 transition-shadow duration-300 hover:shadow-[0_12px_40px_-24px_rgba(24,20,16,0.15)]"
    >
      <h3 className="font-display text-[18px] text-[var(--fg-primary)] mb-3">Aggiungi nota</h3>
      <textarea
        id="lead-note-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Scrivi un aggiornamento visibile al team…"
        disabled={pending}
        className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 px-3 py-2.5 text-[13px] text-[var(--fg-primary)] placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brass)]/35 resize-y min-h-[88px] disabled:opacity-60 transition-[border-color,box-shadow] duration-200"
      />
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={pending || !text.trim()}
          className="rounded-xl px-5 py-2.5 text-[12px] font-semibold text-[var(--fg-on-onyx)] bg-[var(--color-onyx-900)] hover:opacity-95 disabled:opacity-40 transition-opacity"
        >
          {pending ? "Salvataggio…" : "Pubblica nota"}
        </button>
      </div>
    </div>
  );
}
