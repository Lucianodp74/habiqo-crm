"use client";

import { Button, Pill } from "@habiqo/ui";
import { useId, useState, useTransition } from "react";

const zones = [
  "Milano · Porta Nuova",
  "Milano · Brera",
  "Roma · Prati",
  "Roma · Parioli",
  "Torino · Crocetta",
  "Firenze · Oltrarno",
  "Napoli · Posillipo",
] as const;

type Zone = (typeof zones)[number];
type Condition = "ristrutturato" | "buono" | "da ristrutturare";

const CONDITIONS: ReadonlyArray<{ id: Condition; label: string }> = [
  { id: "ristrutturato", label: "Ristrutturato" },
  { id: "buono", label: "Buono" },
  { id: "da ristrutturare", label: "Da ristrutturare" },
];

function formatEur(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

type Estimate = {
  low: number;
  mid: number;
  high: number;
  confidence: number;
  note: string;
};

function computeEstimate(input: {
  zone: Zone;
  sqm: number;
  rooms: number;
  condition: Condition;
}): Estimate {
  const { zone, sqm, rooms, condition } = input;

  const base = zone.includes("Milano")
    ? 8800
    : zone.includes("Roma")
      ? 7200
      : zone.includes("Firenze")
        ? 6500
        : zone.includes("Napoli")
          ? 6200
          : 4700;

  const conditionMul =
    condition === "ristrutturato" ? 1.12 : condition === "da ristrutturare" ? 0.86 : 1;

  const roomsMul = rooms >= 4 ? 1.06 : rooms === 1 ? 0.94 : 1;

  const safeSqm = Math.max(35, Math.min(220, sqm || 35));
  const pricePerSqm = base * conditionMul * roomsMul;

  const mid = Math.round(pricePerSqm * safeSqm);
  const spread = 0.08 + Math.min(0.06, Math.abs(92 - safeSqm) / 800);

  const low = Math.round(mid * (1 - spread));
  const high = Math.round(mid * (1 + spread));
  const confidence = Math.round((1 - spread) * 100);

  const note =
    condition === "ristrutturato"
      ? "Premium per finiture e tempi di vendita più rapidi."
      : condition === "da ristrutturare"
        ? "Sconto stimato per lavori e rischio di trattativa."
        : "Valore coerente con comparables recenti in zona.";

  return {
    low,
    mid,
    high,
    confidence,
    note,
  };
}

export function AiValuationWidget() {
  const [isPending, startTransition] = useTransition();

  const [zone, setZone] = useState<Zone>(zones[0]);
  const [sqm, setSqm] = useState<string>("92");
  const [rooms, setRooms] = useState<string>("3");
  const [condition, setCondition] = useState<Condition>("buono");

  const [result, setResult] = useState<Estimate | null>(null);

  const sqmNum = Number(sqm) || 0;
  const roomsNum = Number(rooms) || 0;

  const canEstimate = sqmNum >= 30 && roomsNum >= 1;

  const conditionGroupId = useId();
  const zoneId = useId();
  const sqmId = useId();
  const roomsId = useId();

  function onEstimate() {
    if (!canEstimate) return;

    startTransition(async () => {
      await new Promise((r) => setTimeout(r, 420));

      setResult(
        computeEstimate({
          zone,
          sqm: sqmNum,
          rooms: roomsNum,
          condition,
        }),
      );
    });
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.6]"
        style={{
          background:
            "radial-gradient(900px 260px at 0% 0%, rgba(167,122,69,0.12), transparent 60%), radial-gradient(700px 240px at 100% 100%, rgba(16,13,9,0.10), transparent 55%)",
        }}
      />

      <div className="relative">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--fg-muted)]">
          AI valuation
        </p>

        <h3 className="mt-1 font-display text-[20px] leading-tight">Stima immediata</h3>

        <p className="mt-1 text-[12.5px] text-[var(--fg-secondary)]">
          Inserisci i dati base e ottieni un range di prezzo suggerito.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <div>
            <label
              htmlFor={zoneId}
              className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)]"
            >
              Zona
            </label>

            <select
              id={zoneId}
              value={zone}
              onChange={(e) => setZone(e.target.value as Zone)}
              className="h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-[13px] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor={sqmId}
                className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)]"
              >
                MQ
              </label>

              <input
                id={sqmId}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={sqm}
                onChange={(e) => setSqm(e.target.value.replace(/\D/g, ""))}
                className="h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-[13px] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>

            <div>
              <label
                htmlFor={roomsId}
                className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)]"
              >
                Locali
              </label>

              <input
                id={roomsId}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={rooms}
                onChange={(e) => setRooms(e.target.value.replace(/\D/g, ""))}
                className="h-10 w-full rounded-md border border-[var(--border-strong)] bg-[var(--bg-elevated)] px-3 text-[13px] transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          </div>

          <fieldset>
            <legend
              id={conditionGroupId}
              className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)]"
            >
              Stato
            </legend>

            <div
              role="radiogroup"
              aria-labelledby={conditionGroupId}
              className="flex flex-wrap gap-2"
            >
              {CONDITIONS.map((c) => {
                const selected = condition === c.id;

                return (
                  <label
                    key={c.id}
                    className={[
                      "cursor-pointer rounded-md border px-3 py-2 text-[12.5px] transition-colors",
                      selected
                        ? "border-[var(--color-onyx-900)] bg-[var(--color-onyx-900)] text-[var(--fg-on-onyx)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-sunken)] text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]",
                    ].join(" ")}
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={c.id}
                      checked={selected}
                      onChange={() => setCondition(c.id)}
                      className="sr-only"
                    />

                    {c.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            intent="brass"
            size="md"
            onClick={onEstimate}
            loading={isPending}
            disabled={!canEstimate}
          >
            Genera stima
          </Button>

          <Pill tone="neutral">GDPR-safe · dati locali</Pill>
        </div>

        {result ? (
          <div className="mt-4 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sunken)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                  Range suggerito
                </p>

                <div className="mt-1 font-display text-[22px] leading-tight">
                  {formatEur(result.mid)}
                </div>

                <p className="mt-1 text-[12.5px] text-[var(--fg-secondary)]">
                  {formatEur(result.low)} — {formatEur(result.high)}
                </p>
              </div>

              <div className="text-right">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                  Confidenza
                </p>

                <div className="mt-1 font-display text-[22px] leading-none">
                  {result.confidence}%
                </div>
              </div>
            </div>

            <p className="mt-2 text-[12.5px] text-[var(--fg-secondary)]">{result.note}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
