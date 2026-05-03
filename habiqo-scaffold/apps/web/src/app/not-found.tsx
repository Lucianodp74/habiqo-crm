import { Button } from "@habiqo/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-[10px] tracking-[0.20em] uppercase text-[var(--fg-muted)] mb-3">
        404
      </p>
      <h2 className="font-display text-[28px] mb-3">Pagina non trovata</h2>
      <p className="text-[14px] text-[var(--fg-secondary)] mb-6 max-w-md">
        La pagina che cercavi non esiste o è stata spostata.
      </p>
      <Link href="/dashboard">
        <Button intent="primary">Torna alla dashboard</Button>
      </Link>
    </div>
  );
}
