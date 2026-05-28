"use client";

import { revokeInvitation } from "@/lib/actions/invitations";
import type { PendingInvitation } from "@/lib/queries/team";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type PendingInvitationsListProps = {
  invitations: PendingInvitation[];
};

function formatDate(iso: string): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return "—";
  }
}

function daysUntil(iso: string): number {
  try {
    const date = new Date(iso);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}

export function PendingInvitationsList({
  invitations,
}: PendingInvitationsListProps) {
  if (invitations.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-onyx-200)] bg-[var(--color-surface)] px-6 py-8 text-center">
        <p className="text-sm text-[var(--color-onyx-600)]">
          Nessun invito pendente al momento.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-onyx-200)] bg-[var(--color-surface)]">
      <ul className="divide-y divide-[var(--color-onyx-200)]">
        {invitations.map((invite) => (
          <InvitationRow key={invite.id} invitation={invite} />
        ))}
      </ul>
    </div>
  );
}

function InvitationRow({ invitation }: { invitation: PendingInvitation }) {
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const days = daysUntil(invitation.expiresAt);
  const isExpiringSoon = days <= 2 && days >= 0;
  const isExpired = days < 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(invitation.inviteUrl);
      toast.success("Link copiato negli appunti");
    } catch {
      toast.error("Impossibile copiare il link");
    }
  };

  const handleRevoke = () => {
    startTransition(async () => {
      const result = await revokeInvitation(invitation.id);
      if (result.ok) {
        toast.success(`Invito a ${invitation.email} revocato`);
      } else {
        toast.error(result.error ?? "Errore revocando l'invito");
      }
      setConfirmOpen(false);
    });
  };

  return (
    <li className="px-6 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-[var(--color-onyx-900)]">
              {invitation.email}
            </p>
            <span className="inline-flex items-center rounded-full bg-[var(--color-onyx-100)] px-2 py-0.5 text-xs text-[var(--color-onyx-700)]">
              {invitation.role === "owner" ? "Admin" : "Agente"}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--color-onyx-600)]">
            Invitato il {formatDate(invitation.createdAt)}
            {" · "}
            {isExpired ? (
              <span className="font-medium text-red-600">Scaduto</span>
            ) : isExpiringSoon ? (
              <span className="font-medium text-amber-600">
                Scade tra {days} {days === 1 ? "giorno" : "giorni"}
              </span>
            ) : (
              <>Scade il {formatDate(invitation.expiresAt)}</>
            )}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={isPending}
            className="rounded-md border border-[var(--color-onyx-300)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-onyx-700)] transition-colors hover:bg-[var(--color-onyx-100)] disabled:opacity-50"
          >
            Copia link
          </button>

          {confirmOpen ? (
            <>
              <button
                type="button"
                onClick={handleRevoke}
                disabled={isPending}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "Revoca..." : "Conferma"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={isPending}
                className="rounded-md border border-[var(--color-onyx-300)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[var(--color-onyx-700)] hover:bg-[var(--color-onyx-100)] disabled:opacity-50"
              >
                Annulla
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={isPending}
              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              Revoca
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
