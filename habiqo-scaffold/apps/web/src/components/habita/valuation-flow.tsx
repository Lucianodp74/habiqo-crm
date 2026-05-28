"use client";

import { useState, useTransition } from "react";
import { submitValuation } from "@/lib/actions/submit-valuation";

type Props = { agencyId: string; agencyName: string };

const PROPERTY_TYPES = [
  { id: "apartment",   label: "Appartamento", icon: "🏢" },
  { id: "villa",       label: "Villa / Casa",  icon: "🏡" },
  { id: "office",      label: "Ufficio",        icon: "🏬" },
  { id: "commercial",  label: "Commerciale",    icon: "🏪" },
  { id: "land",        label: "Terreno",        icon: "🌿" },
];

const CONDITIONS = [
  { id: "to_renovate", label: "Da ristrutturare", sub: "Necessita interventi" },
  { id: "good",        label: "Buono stato",       sub: "Abitabile subito" },
  { id: "excellent",   label: "Ottimo stato",      sub: "Ristrutturato o nuovo" },
];

const ROOMS_OPTIONS = [1, 2, 3, 4, 5];
const BATHROOMS_OPTIONS = [1, 2, 3];

type Step = 1 | 2 | 3 | 4 | 5;

type FormData = {
  propertyType: string;
  city: string;
  area: string;
  sqm: string;
  rooms: number | null;
  bathrooms: number | null;
  floor: string;
  condition: string;
  fullName: string;
  phone: string;
  email: string;
};

const INITIAL: FormData = {
  propertyType: "",
  city: "", area: "", sqm: "",
  rooms: null, bathrooms: null, floor: "",
  condition: "",
  fullName: "", phone: "", email: "",
};

const STEPS = [
  { n: 1, label: "Tipo immobile" },
  { n: 2, label: "Posizione" },
  { n: 3, label: "Dettagli" },
  { n: 4, label: "I tuoi dati" },
];

export function ValuationFlow({ agencyId, agencyName }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function set(key: keyof FormData, value: string | number | null) {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  }

  function next() {
    if (step === 1 && !form.propertyType) { setError("Seleziona il tipo di immobile."); return; }
    if (step === 2 && !form.city.trim()) { setError("Inserisci la città."); return; }
    setStep((s) => (s + 1) as Step);
    setError("");
  }

  function back() {
    setStep((s) => (s - 1) as Step);
    setError("");
  }

  function handleSubmit() {
    if (!form.fullName.trim()) { setError("Inserisci il tuo nome."); return; }
    if (!form.phone.trim()) { setError("Inserisci il tuo telefono."); return; }

    startTransition(async () => {
      const result = await submitValuation({
        agencyId,
        propertyType: form.propertyType,
        city: form.city,
        area: form.area || undefined,
        sqm: form.sqm ? parseInt(form.sqm) : undefined,
        rooms: form.rooms ?? undefined,
        bathrooms: form.bathrooms ?? undefined,
        floor: form.floor ? parseInt(form.floor) : undefined,
        condition: form.condition || undefined,
        fullName: form.fullName,
        phone: form.phone,
        email: form.email || undefined,
      });

      if (result.ok) {
        setDone(true);
      } else {
        setError(result.error);
      }
    });
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-20">
        <div className="w-16 h-16 rounded-full bg-[var(--color-brass-glow)] border border-[var(--accent-deep)]/30 flex items-center justify-center text-2xl mb-8">
          ✓
        </div>
        <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-4">Richiesta inviata</p>
        <h2 className="font-display text-3xl md:text-4xl text-[var(--fg-primary)] mb-4">
          Grazie, {form.fullName.split(" ")[0]}.
        </h2>
        <p className="text-base text-[var(--fg-secondary)] max-w-sm leading-relaxed mb-2">
          Un consulente di <strong>{agencyName}</strong> ti contatterà al più presto
          con una valutazione personalizzata per il tuo immobile.
        </p>
        <p className="text-sm text-[var(--fg-muted)] mt-6">
          Ti contatteremo al: <strong>{form.phone}</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col">

      {/* Progress bar */}
      <div className="px-6 md:px-12 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-2">
          {STEPS.map((s) => (
            <div key={s.n} className="flex items-center gap-3">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                step === s.n
                  ? "bg-[var(--fg-primary)] text-[var(--bg-canvas)]"
                  : step > s.n
                    ? "bg-[var(--accent-deep)] text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--fg-muted)]"
              }`}>
                {step > s.n ? "✓" : s.n}
              </div>
              {s.n < STEPS.length && (
                <div className={`h-px flex-1 w-8 transition-all ${step > s.n ? "bg-[var(--accent-deep)]" : "bg-[var(--border-subtle)]"}`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--fg-muted)] mt-2">
          {STEPS.find(s => s.n === step)?.label} — Passo {step} di 4
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 px-6 md:px-12 pb-6">

        {/* STEP 1 — Property type */}
        {step === 1 && (
          <div>
            <h2 className="font-display text-2xl md:text-3xl text-[var(--fg-primary)] mb-2">
              Che tipo di immobile hai?
            </h2>
            <p className="text-sm text-[var(--fg-secondary)] mb-8">Seleziona la categoria più adatta.</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {PROPERTY_TYPES.map((pt) => (
                <button key={pt.id} type="button"
                  onClick={() => { set("propertyType", pt.id); setError(""); }}
                  className={`p-5 rounded-xl border text-left transition-all ${
                    form.propertyType === pt.id
                      ? "border-[var(--fg-primary)] bg-[var(--fg-primary)] text-[var(--bg-canvas)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--fg-primary)]/30"
                  }`}
                >
                  <div className="text-2xl mb-3">{pt.icon}</div>
                  <p className="text-sm font-medium">{pt.label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Location */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-2xl md:text-3xl text-[var(--fg-primary)] mb-2">
              Dove si trova l'immobile?
            </h2>
            <p className="text-sm text-[var(--fg-secondary)] mb-8">Inserisci la posizione per una valutazione più precisa.</p>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                  Città <span className="text-[var(--accent-deep)]">*</span>
                </label>
                <input type="text" value={form.city}
                  onChange={e => set("city", e.target.value)}
                  placeholder="es. Foggia"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-sm focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                  Zona o quartiere <span className="text-[var(--fg-muted)] normal-case">(opzionale)</span>
                </label>
                <input type="text" value={form.area}
                  onChange={e => set("area", e.target.value)}
                  placeholder="es. Centro storico, Parco dei Dauni…"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-sm focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Details */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-2xl md:text-3xl text-[var(--fg-primary)] mb-2">
              Descrivi il tuo immobile.
            </h2>
            <p className="text-sm text-[var(--fg-secondary)] mb-8">Più informazioni ci dai, più precisa sarà la valutazione.</p>
            <div className="grid md:grid-cols-2 gap-6 max-w-xl">
              {/* Sqm */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-2">Superficie (m²)</label>
                <input type="number" value={form.sqm}
                  onChange={e => set("sqm", e.target.value)}
                  placeholder="es. 80"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-sm focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
                />
              </div>
              {/* Floor */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-2">Piano</label>
                <input type="number" value={form.floor}
                  onChange={e => set("floor", e.target.value)}
                  placeholder="es. 2 (0 = terra)"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-sm focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
                />
              </div>
              {/* Rooms */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-3">Camere</label>
                <div className="flex gap-2">
                  {ROOMS_OPTIONS.map(n => (
                    <button key={n} type="button"
                      onClick={() => set("rooms", n)}
                      className={`w-10 h-10 rounded-lg border text-sm font-medium transition-all ${
                        form.rooms === n
                          ? "border-[var(--fg-primary)] bg-[var(--fg-primary)] text-[var(--bg-canvas)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--fg-primary)]/40"
                      }`}
                    >{n}{n === 5 ? "+" : ""}</button>
                  ))}
                </div>
              </div>
              {/* Bathrooms */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-3">Bagni</label>
                <div className="flex gap-2">
                  {BATHROOMS_OPTIONS.map(n => (
                    <button key={n} type="button"
                      onClick={() => set("bathrooms", n)}
                      className={`w-10 h-10 rounded-lg border text-sm font-medium transition-all ${
                        form.bathrooms === n
                          ? "border-[var(--fg-primary)] bg-[var(--fg-primary)] text-[var(--bg-canvas)]"
                          : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--fg-primary)]/40"
                      }`}
                    >{n}{n === 3 ? "+" : ""}</button>
                  ))}
                </div>
              </div>
            </div>
            {/* Condition */}
            <div className="mt-6 max-w-xl">
              <label className="block text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-3">Stato dell'immobile</label>
              <div className="grid grid-cols-3 gap-3">
                {CONDITIONS.map(c => (
                  <button key={c.id} type="button"
                    onClick={() => set("condition", c.id)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.condition === c.id
                        ? "border-[var(--fg-primary)] bg-[var(--fg-primary)] text-[var(--bg-canvas)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--fg-primary)]/30"
                    }`}
                  >
                    <p className="text-xs font-semibold mb-0.5">{c.label}</p>
                    <p className={`text-[10px] ${form.condition === c.id ? "text-white/60" : "text-[var(--fg-muted)]"}`}>{c.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4 — Seller info */}
        {step === 4 && (
          <div>
            <h2 className="font-display text-2xl md:text-3xl text-[var(--fg-primary)] mb-2">
              Come ti contatto?
            </h2>
            <p className="text-sm text-[var(--fg-secondary)] mb-8">
              Un consulente di <strong>{agencyName}</strong> ti risponderà personalmente
              con la valutazione del tuo immobile.
            </p>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                  Nome e cognome <span className="text-[var(--accent-deep)]">*</span>
                </label>
                <input type="text" value={form.fullName}
                  onChange={e => set("fullName", e.target.value)}
                  placeholder="Mario Rossi"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-sm focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                  Telefono <span className="text-[var(--accent-deep)]">*</span>
                </label>
                <input type="tel" value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                  placeholder="+39 320 000 0000"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-sm focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                  Email <span className="text-[var(--fg-muted)] normal-case">(opzionale)</span>
                </label>
                <input type="email" value={form.email}
                  onChange={e => set("email", e.target.value)}
                  placeholder="mario@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-sm focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
                />
              </div>
              <p className="text-xs text-[var(--fg-muted)] leading-relaxed pt-2">
                I tuoi dati sono trattati nel rispetto della privacy e utilizzati
                solo per contattarti con la valutazione richiesta.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="mt-4 text-sm text-red-700 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
            {error}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 md:px-12 pb-8 flex items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-6">
        {step > 1 ? (
          <button type="button" onClick={back}
            className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors">
            ← Indietro
          </button>
        ) : <div />}

        {step < 4 ? (
          <button type="button" onClick={next}
            className="px-8 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            Avanti →
          </button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={isPending}
            className="px-8 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending ? "Invio in corso…" : "Richiedi valutazione →"}
          </button>
        )}
      </div>
    </div>
  );
}
