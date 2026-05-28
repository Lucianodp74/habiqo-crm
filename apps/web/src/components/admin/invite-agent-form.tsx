"use client";

import { inviteAgent } from "@/lib/actions/invitations";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type SuccessState = {
  email: string;
  inviteUrl: string;
};

export function InviteAgentForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"agent" | "owner">("agent");
  const [isPending, startTransition] = useTransition();
  const [lastInvite, setLastInvite] = useState<SuccessState | null>(null);

  const handleSubmit = () => {
    if (!email.trim()) {
      toast.error("Inserisci un'email");
      return;
    }

    startTransition(async () => {
      const result = await inviteAgent({ email: email.trim(), role });

      if (result.ok) {
        toast.success(`Invito creato per ${result.invitation.email}`);
        setLastInvite({
          email: result.invitation.email,
          inviteUrl: result.invitation.inviteUrl,
        });
        setEmail("");
        setRole("agent");
      } else {
        toast.error(result.error);
      }
    });
  };

  const copyInviteLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiato negli appunti");
    } catch {
      toast.error("Impossibile copiare il link. Selezionalo manualmente.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Form */}
      <div className="rounded-lg border border-[var(--color-onyx-200)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="invite-email"
              className="mb-1.5 block text-xs font-medium text-[var(--color-onyx-700)]"
            >
              Email del nuovo agente
            </label>
            <input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="mario.rossi@email.com"
              disabled={isPending}
              className="w-full rounded-md border border-[var(--color-onyx-200)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-onyx-900)] outline-none transition-colors focus:border-[var(--color-onyx-900)] disabled:opacity-50"
            />
          </div>

          <div className="sm:w-40">
            <label
              htmlFor="invite-role"
              className="mb-1.5 block text-xs font-medium text-[var(--color-onyx-700)]"
            >
              Ruolo
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as "agent" | "owner")}
              disabled={isPending}
              className="w-full rounded-md border border-[var(--color-onyx-200)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-onyx-900)] outline-none transition-colors focus:border-[var(--color-onyx-900)] disabled:opacity-50"
            >
              <option value="agent">Agente</option>
              <option value="owner">Admin</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="rounded-md bg-[var(--color-onyx-900)] px-5 py-2 text-sm font-medium text-[var(--color-surface)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Invio..." : "Invita"}
          </button>
        </div>
      </div>

      {/* Last successful invite — show link to copy */}
      {lastInvite && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs text-white">
              ✓
            </span>
            <p className="text-sm font-medium text-emerald-900">
              Invito creato per {lastInvite.email}
            </p>
          </div>
          <p className="mb-3 text-xs text-emerald-800">
            Condividi questo link via WhatsApp, email o di persona. Il link
            scade tra 7 giorni.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={lastInvite.inviteUrl}
              readOnly
              onClick={(e) => e.currentTarget.select()}
              className="flex-1 rounded-md border border-emerald-300 bg-white px-3 py-2 text-xs text-[var(--color-onyx-900)] outline-none"
            />
            <button
              type="button"
              onClick={() => copyInviteLink(lastInvite.inviteUrl)}
              className="rounded-md bg-emerald-700 px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              Copia link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
