import { Button } from "@habiquo/ui";
import Link from "next/link";

export const metadata = { title: "Properties" };

export default function PropertiesPage() {
  return (
    <div className="px-5 py-6 lg:px-10 lg:py-8">
      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)]">
        Properties
      </p>
      <h1 className="font-display text-[34px] leading-[1.05] tracking-tight mt-2">
        Immobili
        <span className="italic text-[var(--accent-deep)]">.</span>
      </h1>
      <p className="text-[14px] text-[var(--fg-secondary)] mt-2 max-w-2xl">
        Qui arriveranno elenco, filtri e schede immobili. Nel frattempo trovi la panoramica completa
        in Dashboard.
      </p>

      <div className="mt-6 flex items-center gap-2">
        <Link href="/dashboard">
          <Button intent="secondary" size="md">
            Torna alla Dashboard
          </Button>
        </Link>
        <Link href="/crm">
          <Button intent="primary" size="md">
            Vai al CRM
          </Button>
        </Link>
      </div>
    </div>
  );
}
