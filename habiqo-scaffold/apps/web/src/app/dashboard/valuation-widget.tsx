"use client";

import { useMemo, useState, useTransition } from "react";
import { Button, Pill } from "@habiqo/ui";

const zones = [
  "Milano · Porta Nuova",
  "Milano · Brera",
  "Roma · Prati",
  "Roma · Parioli",
  "Torino · Crocetta",
  "Firenze · Oltrarno",
  "Napoli · Posillipo",
] as const;

function formatEur(value: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    value,
  );
}

export function AiValuationWidget() {
  const [isPending, startTransition] = useTransition();
  const [zone, setZone] = useState<(typeof zones)[number]>(zones[0]);
  const [sqm, setSqm] = useState<number>(92);
  const [rooms, setRooms] = useState<number>(3);
  const [condition, setCondition] = useState<"ristrutturato" | "buono" | "da ristrutturare">("buono");
  const [result, setResult] = useState<null | {
    low: number;
    mid: number;
    high: number;
    confidence: number;
    note: string;
  }>(null);

  const meta = useMemo(() => {
    const base = zone.includes("Milano")
      ? 8800
      : zone.includes("Roma")
        ? 7200
        : zone.includes("Firenze")
          ? 6500
          : zone.includes("Napoli")
            ? 6200
            : 4700;

    const conditionMul = condition === "ristrutturato" ? 1.12 : condition === "da ristrutturare" ? 0.86 : 1;
    const roomsMul = rooms >= 4 ? 1.06 : rooms === 1 ? 0.94 : 1;

    const pricePerSqm = base * conditionMul * roomsMul;
    const mid = Math.round(pricePerSqm * Math.max(35, Math.min(220, sqm)));
    const spread = 0.08 + Math.min(0.06, Math.abs(92 - sqm) / 800);
    const low = Math.round(mid * (1 - spread));
    const high = Math.round(mid * (1 + spread));
    const confidence = Math.round((1 - spread) * 100);

    const note =
      condition === "ristrutturato"
        ? "Premium per finiture e tempi di vendita più rapidi."
        : condition === "da ristrutturare"
          ? "Sconto stimato per lavori e rischio di trattativa."
          : "Valore coerente con comparables recenti in zona.";

    return { low, mid, high, confidence, note };
  }, [zone, sqm, rooms, condition]);

  function onEstimate() {
    startTransition(async () => {
      // Simulate AI latency
      await new Promise((r) => setTimeout(r, 420));
      setResult(meta);
    });
  }

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.6]"
        style={{
          background:
            "radial-gradient(900px 260px at 0% 0%, rgba(167,122,69,0.12), transparent 60%), radial-gradient(700px 240px at 100% 100%, rgba(16,13,9,0.10), transparent 55%)",
        }}
      />
      <div className="relative">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-[var(--fg-muted)]">AI valuation</p>
        <h3 className="font-display text-[20px] leading-tight mt-1">Stima immediata</h3>
        <p className="text-[12.5px] text-[var(--fg-secondary)] mt-1">
          Inserisci i dati base e ottieni un range di prezzo suggerito.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <label className="block">
            <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--fg-muted)] mb-1.5">
              Zona
            </span>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value as (typeof zones)[number])}
              className="w-full h-10 px-3 rounded-md text-[13px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--fg-muted)] mb-1.5">
                MQ
              </span>
              <input
                inputMode="numeric"
                value={sqm}
                onChange={(e) => setSqm(Number(e.target.value || 0))}
                className="w-full h-10 px-3 rounded-md text-[13px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
              />
            </label>

            <label className="block">
              <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--fg-muted)] mb-1.5">
                Locali
              </span>
              <input
                inputMode="numeric"
                value={rooms}
                onChange={(e) => setRooms(Number(e.target.value || 0))}
                className="w-full h-10 px-3 rounded-md text-[13px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
              />
            </label>
          </div>

          <label className="block">
            <span className="block font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--fg-muted)] mb-1.5">
              Stato
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: "ristrutturato", label: "Ristrutturato" },
                  { id: "buono", label: "Buono" },
                  { id: "da ristrutturare", label: "Da ristrutturare" },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCondition(c.id)}
                  className={[
                    "px-3 py-2 rounded-md text-[12.5px] border transition-colors",
                    condition === c.id
                      ? "bg-[var(--color-onyx-900)] text-[var(--fg-on-onyx)] border-[var(--color-onyx-900)]"
                      : "bg-[var(--bg-sunken)] text-[var(--fg-secondary)] border-[var(--border-subtle)] hover:text-[var(--fg-primary)]",
                  ].join(" ")}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </label>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button intent="brass" size="md" onClick={onEstimate} loading={isPending}>
            Genera stima
          </Button>
          <Pill tone="neutral">GDPR-safe · dati locali</Pill>
        </div>

        {result ? (
          <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sunken)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--fg-muted)]">
                  Range suggerito
                </p>
                <div className="font-display text-[22px] leading-tight mt-1">{formatEur(result.mid)}</div>
                <p className="text-[12.5px] text-[var(--fg-secondary)] mt-1">
                  {formatEur(result.low)} — {formatEur(result.high)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--fg-muted)]">
                  Confidenza
                </p>
                <div className="font-display text-[22px] leading-none mt-1">{result.confidence}%</div>
              </div>
            </div>
            <p className="text-[12.5px] text-[var(--fg-secondary)] mt-2">{result.note}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

