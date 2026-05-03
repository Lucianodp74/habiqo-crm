import { Button } from "@habiqo/ui";
import Link from "next/link";

export const metadata = { title: "Deals" };

export default function DealsPage() {
  return (
    <div className="px-5 py-6 lg:px-10 lg:py-8">
      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)]">
        Deals
      </p>
      <h1 className="font-display text-[34px] leading-[1.05] tracking-tight mt-2">
        Trattative
        <span className="italic text-[var(--accent-deep)]">.</span>
      </h1>
      <p className="text-[14px] text-[var(--fg-secondary)] mt-2 max-w-2xl">
        Sezione pipeline in arrivo: fasi, probabilità, valore previsto, attività e promemoria.
      </p>

      <div className="mt-6 flex items-center gap-2">
        <Link href="/dashboard">
          <Button intent="secondary" size="md">
            Torna alla Dashboard
          </Button>
        </Link>
        <Link href="/ai-assistant">
          <Button intent="brass" size="md">
            Suggerisci next step (AI)
          </Button>
        </Link>
      </div>
    </div>
  );
}
