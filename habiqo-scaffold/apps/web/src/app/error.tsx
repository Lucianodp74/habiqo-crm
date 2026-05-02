"use client";

import { useEffect } from "react";
import { Button } from "@habiqo/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: wire to Sentry once configured
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60dvh] flex flex-col items-center justify-center px-6 text-center">
      <h2 className="font-display text-[28px] mb-3">Qualcosa è andato storto</h2>
      <p className="text-[14px] text-[var(--fg-secondary)] mb-6 max-w-md">
        Abbiamo registrato il problema. Puoi riprovare oppure tornare alla pagina precedente.
      </p>
      <div className="flex gap-2">
        <Button intent="primary" onClick={reset}>
          Riprova
        </Button>
        <Button intent="secondary" onClick={() => history.back()}>
          Indietro
        </Button>
      </div>
      {error.digest ? (
        <p className="font-mono text-[10px] text-[var(--fg-muted)] mt-6">
          ref: {error.digest}
        </p>
      ) : null}
    </div>
  );
}
