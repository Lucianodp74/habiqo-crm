"use client";

import { sendCampaign } from "@/lib/actions/send-campaign";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

type Props = {
  campaignId: string;
  pendingCount: number;
};

export function SendCampaignButton({ campaignId, pendingCount }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSend() {
    startTransition(async () => {
      const result = await sendCampaign(campaignId);
      if (result.ok) {
        toast.success(
          `Invio completato: ${result.data.sent} inviati, ${result.data.failed} falliti.`,
        );
        setConfirming(false);
        router.refresh();
      } else {
        toast.error(result.error.message);
      }
    });
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl px-4 py-2.5 text-[12px] font-semibold text-[var(--fg-on-onyx)] bg-[var(--color-onyx-900)] hover:opacity-95 transition-opacity whitespace-nowrap"
      >
        Invia campagna
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-[var(--fg-secondary)]">
        Inviare a {pendingCount} destinatari?
      </span>
      <button
        type="button"
        onClick={handleSend}
        disabled={isPending}
        className="rounded-xl px-4 py-2.5 text-[12px] font-semibold text-white bg-green-700 hover:bg-green-800 disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {isPending ? "Invio in corso…" : "Conferma invio"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={isPending}
        className="rounded-xl px-3 py-2.5 text-[12px] text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)] transition-colors"
      >
        Annulla
      </button>
    </div>
  );
}
