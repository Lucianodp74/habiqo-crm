"use client";

import { useState } from "react";
import Link from "next/link";

// ──────────────────────────────────────────────────────────────────────
// Types & constants
// ──────────────────────────────────────────────────────────────────────

type ContractType = "vendita" | "affitto";

type FormData = {
  contractType: ContractType | null;
  propertyType: string;
  city: string;
  price: string; // kept as string for controlled input
  sqm: string;
  bedrooms: number;
  bathrooms: number;
};

const INITIAL_DATA: FormData = {
  contractType: null,
  propertyType: "",
  city: "",
  price: "",
  sqm: "",
  bedrooms: 2,
  bathrooms: 1,
};

const STEPS = [
  { id: 1, label: "Dati" },
  { id: 2, label: "Foto" },
  { id: 3, label: "AI" },
  { id: 4, label: "Avanzati" },
] as const;

const PROPERTY_TYPES = [
  "Appartamento",
  "Villa",
  "Casa indipendente",
  "Attico",
  "Bilocale",
  "Trilocale",
  "Quadrilocale",
  "Loft",
  "Mansarda",
  "Ufficio",
  "Negozio",
  "Box / Garage",
];

// ──────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────

export function PropertyCreateAIFlow() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isStep1Valid =
    formData.contractType !== null &&
    formData.propertyType.length > 0 &&
    formData.city.trim().length > 0 &&
    Number(formData.price) > 0 &&
    Number(formData.sqm) > 0;

  const canAdvance = currentStep === 1 ? isStep1Valid : true;

  return (
    <div className="space-y-12">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div>
        <Link
          href="/admin/properties"
          className="inline-block text-xs uppercase tracking-widest text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors mb-6"
        >
          ← Torna alla lista
        </Link>
        <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-2">
          Assistente AI
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-[var(--fg-primary)] leading-tight">
          Crea immobile
        </h1>
      </div>

      {/* ─── Progress indicator ─────────────────────────────────────── */}
      <ol className="flex items-center gap-2 sm:gap-3">
        {STEPS.map((step, idx) => {
          const isActive = step.id === currentStep;
          const isDone = step.id < currentStep;
          return (
            <li
              key={step.id}
              className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border text-[11px] font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--fg-primary)] border-[var(--fg-primary)] text-[var(--bg-canvas)]"
                      : isDone
                      ? "bg-[var(--fg-primary)]/10 border-[var(--fg-primary)]/30 text-[var(--fg-primary)]"
                      : "bg-transparent border-[var(--border-subtle)] text-[var(--fg-secondary)]"
                  }`}
                >
                  {step.id}
                </div>
                <span
                  className={`hidden sm:inline text-xs uppercase tracking-widest truncate ${
                    isActive
                      ? "text-[var(--fg-primary)] font-medium"
                      : "text-[var(--fg-secondary)]"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div
                  className={`h-px flex-1 ${
                    isDone
                      ? "bg-[var(--fg-primary)]/30"
                      : "bg-[var(--border-subtle)]"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* ─── Step content ───────────────────────────────────────────── */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <Step1Form formData={formData} update={update} />
        )}
        {currentStep === 2 && (
          <Placeholder
            title="Foto"
            subtitle="Caricamento foto immobile · In arrivo"
          />
        )}
        {currentStep === 3 && (
          <Placeholder
            title="Genera con AI"
            subtitle="L'assistente genera titolo, descrizione, caratteristiche · In arrivo"
          />
        )}
        {currentStep === 4 && (
          <Placeholder
            title="Dati avanzati"
            subtitle="Classe energetica, anno, piano, riscaldamento · In arrivo"
          />
        )}
      </div>

      {/* ─── Navigation ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-[var(--border-subtle)] pt-8">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s - 1)}
            className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors"
          >
            ← Indietro
          </button>
        ) : (
          <div />
        )}
        {currentStep < 4 ? (
          <button
            type="button"
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canAdvance}
            className="px-8 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Avanti →
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="px-8 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-md text-sm font-medium opacity-40 cursor-not-allowed"
          >
            Pubblica · In arrivo
          </button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Step 1 — Basic property info
// ──────────────────────────────────────────────────────────────────────

function Step1Form({
  formData,
  update,
}: {
  formData: FormData;
  update: <K extends keyof FormData>(key: K, value: FormData[K]) => void;
}) {
  const priceLabel =
    formData.contractType === "affitto" ? "Prezzo (€/mese)" : "Prezzo (€)";

  return (
    <div className="space-y-10">
      {/* Contract type — segmented */}
      <Field label="Tipo di contratto">
        <div className="grid grid-cols-2 gap-3">
          {(["vendita", "affitto"] as const).map((option) => {
            const isSelected = formData.contractType === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => update("contractType", option)}
                className={`px-6 py-4 border rounded-md text-sm font-medium capitalize transition-all ${
                  isSelected
                    ? "border-[var(--fg-primary)] bg-[var(--fg-primary)] text-[var(--bg-canvas)]"
                    : "border-[var(--border-subtle)] text-[var(--fg-primary)] hover:border-[var(--fg-primary)]/40"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Property type — dropdown */}
      <Field label="Tipologia">
        <select
          value={formData.propertyType}
          onChange={(e) => update("propertyType", e.target.value)}
          className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
        >
          <option value="" disabled>
            Seleziona tipologia…
          </option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>

      {/* City */}
      <Field label="Città">
        <input
          type="text"
          value={formData.city}
          onChange={(e) => update("city", e.target.value)}
          placeholder="es. Brindisi"
          className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base placeholder:text-[var(--fg-secondary)]/50 focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
        />
      </Field>

      {/* Price + sqm */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label={priceLabel}>
          <SuffixedInput
            value={formData.price}
            onChange={(v) => update("price", v)}
            suffix="€"
            placeholder="0"
          />
        </Field>
        <Field label="Metratura">
          <SuffixedInput
            value={formData.sqm}
            onChange={(v) => update("sqm", v)}
            suffix="mq"
            placeholder="0"
          />
        </Field>
      </div>

      {/* Bedrooms + bathrooms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Camere da letto">
          <RoomCount
            value={formData.bedrooms}
            onChange={(v) => update("bedrooms", v)}
            min={0}
          />
        </Field>
        <Field label="Bagni">
          <RoomCount
            value={formData.bathrooms}
            onChange={(v) => update("bathrooms", v)}
            min={1}
          />
        </Field>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Reusable sub-components
// ──────────────────────────────────────────────────────────────────────

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-[var(--fg-secondary)] mb-3">
        {label}
      </label>
      {children}
    </div>
  );
}

function SuffixedInput({
  value,
  onChange,
  suffix,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  suffix: string;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min="0"
        className="w-full px-4 py-3 pr-14 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base placeholder:text-[var(--fg-secondary)]/50 focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
      />
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--fg-secondary)] pointer-events-none">
        {suffix}
      </span>
    </div>
  );
}

function RoomCount({
  value,
  onChange,
  min,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
}) {
  const options = [0, 1, 2, 3, 4, 5].filter((n) => n >= min);
  return (
    <div className="flex gap-1.5">
      {options.map((n) => {
        const isSelected = value === n;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`flex-1 py-2.5 border rounded-md text-sm font-medium transition-all ${
              isSelected
                ? "border-[var(--fg-primary)] bg-[var(--fg-primary)] text-[var(--bg-canvas)]"
                : "border-[var(--border-subtle)] text-[var(--fg-primary)] hover:border-[var(--fg-primary)]/40"
            }`}
          >
            {n === 5 ? "5+" : n}
          </button>
        );
      })}
    </div>
  );
}

function Placeholder({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-[var(--border-subtle)] py-20 px-8 text-center">
      <p className="font-display text-2xl text-[var(--fg-primary)] mb-3">
        {title}
      </p>
      <p className="text-sm text-[var(--fg-secondary)]">{subtitle}</p>
    </div>
  );
}
