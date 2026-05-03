import { Button } from "@habiqo/ui";
import Link from "next/link";

export const metadata = { title: "AI Assistant" };

export default function AiAssistantPage() {
  return (
    <div className="px-5 py-6 lg:px-10 lg:py-8">
      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)]">
        AI Assistant
      </p>
      <h1 className="font-display text-[34px] leading-[1.05] tracking-tight mt-2">
        Assistente AI
        <span className="italic text-[var(--accent-deep)]">.</span>
      </h1>
      <p className="text-[14px] text-[var(--fg-secondary)] mt-2 max-w-2xl">
        Chat e strumenti in arrivo: follow-up automatici, riepiloghi lead, proposte, analisi delle
        obiezioni e script chiamate.
      </p>

      <div className="mt-6 flex items-center gap-2">
        <Link href="/dashboard">
          <Button intent="secondary" size="md">
            Torna alla Dashboard
          </Button>
        </Link>
        <Link href="/crm">
          <Button intent="primary" size="md">
            Apri Leads
          </Button>
        </Link>
      </div>
    </div>
  );
}
