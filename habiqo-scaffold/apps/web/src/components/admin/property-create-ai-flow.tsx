"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { createDraftProperty } from "@/lib/actions/create-draft-property";
import {
  generatePropertyContent,
  type PropertyAIContent,
} from "@/lib/actions/generate-property-content";
import { updatePropertyContent } from "@/lib/actions/update-property-content";
import { PropertyPhotosManager } from "@/components/admin/property-photos-manager";

// ──────────────────────────────────────────────────────────────────────
// Types & constants
// ──────────────────────────────────────────────────────────────────────

type ContractType = "sale" | "rent";

type FormData = {
  contractType: ContractType | null;
  propertyType: string;
  city: string;
  price: string;
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

const CONTRACT_OPTIONS: ReadonlyArray<{ value: ContractType; label: string }> =
  [
    { value: "sale", label: "Vendita" },
    { value: "rent", label: "Affitto" },
  ];

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
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [aiContent, setAiContent] = useState<PropertyAIContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  const isStep1Valid =
    formData.contractType !== null &&
    formData.propertyType.length > 0 &&
    formData.city.trim().length > 0 &&
    Number(formData.price) > 0 &&
    Number(formData.sqm) > 0;

  const canAdvance =
    !isPending &&
    (currentStep === 1
      ? isStep1Valid
      : currentStep === 2
      ? true
      : currentStep === 3
      ? aiContent !== null
      : true);

  const handleAdvance = () => {
    setError(null);

    // Step 1 → 2: create draft property in DB
    if (currentStep === 1 && !propertyId) {
      startTransition(async () => {
        const result = await createDraftProperty({
          contractType: formData.contractType!,
          propertyType: formData.propertyType,
          city: formData.city.trim(),
          price: Number(formData.price),
          sqm: Number(formData.sqm),
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
        });

        if (result.ok) {
          setPropertyId(result.data.propertyId);
          setCurrentStep(2);
        } else {
          setError(result.error.message);
        }
      });
      return;
    }

    // Step 3 → 4: persist AI content to DB
    if (currentStep === 3 && propertyId && aiContent) {
      startTransition(async () => {
        const result = await updatePropertyContent({
          propertyId,
          title: aiContent.title,
          description: aiContent.description,
          amenities: aiContent.amenities,
          seoTitle: aiContent.seoTitle,
          socialCaption: aiContent.socialCaption,
        });

        if (result.ok) {
          setCurrentStep(4);
        } else {
          setError(result.error.message);
        }
      });
      return;
    }

    // Other transitions: simple advance
    setCurrentStep((s) => Math.min(4, s + 1));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const advanceLabel = (() => {
    if (isPending && currentStep === 1) return "Creazione bozza…";
    if (isPending && currentStep === 3) return "Salvataggio…";
    return "Avanti →";
  })();

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

      {/* ─── Error banner ──────────────────────────────────────────── */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* ─── Step content ───────────────────────────────────────────── */}
      <div className="min-h-[400px]">
        {currentStep === 1 && (
          <Step1Form formData={formData} update={update} />
        )}
        {currentStep === 2 && propertyId && (
          <Step2Photos propertyId={propertyId} />
        )}
        {currentStep === 3 && (
          <Step3AI
            formData={formData}
            content={aiContent}
            setContent={setAiContent}
            setError={setError}
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
            onClick={handleBack}
            disabled={isPending}
            className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Indietro
          </button>
        ) : (
          <div />
        )}
        {currentStep < 4 ? (
          <button
            type="button"
            onClick={handleAdvance}
            disabled={!canAdvance}
            className="px-8 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {advanceLabel}
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
    formData.contractType === "rent" ? "Prezzo (€/mese)" : "Prezzo (€)";

  return (
    <div className="space-y-10">
      <Field label="Tipo di contratto">
        <div className="grid grid-cols-2 gap-3">
          {CONTRACT_OPTIONS.map(({ value, label }) => {
            const isSelected = formData.contractType === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => update("contractType", value)}
                className={`px-6 py-4 border rounded-md text-sm font-medium transition-all ${
                  isSelected
                    ? "border-[var(--fg-primary)] bg-[var(--fg-primary)] text-[var(--bg-canvas)]"
                    : "border-[var(--border-subtle)] text-[var(--fg-primary)] hover:border-[var(--fg-primary)]/40"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Field>

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

      <Field label="Città">
        <input
          type="text"
          value={formData.city}
          onChange={(e) => update("city", e.target.value)}
          placeholder="es. Brindisi"
          className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base placeholder:text-[var(--fg-secondary)]/50 focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
        />
      </Field>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Camere">
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
// Step 2 — Photo upload
// ──────────────────────────────────────────────────────────────────────

function Step2Photos({ propertyId }: { propertyId: string }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--fg-secondary)] mb-2">
          Step 2
        </p>
        <h2 className="font-display text-3xl text-[var(--fg-primary)] mb-3">
          Foto immobile
        </h2>
        <p className="text-sm text-[var(--fg-secondary)]">
          Carica le foto dell'immobile. La prima foto caricata diventa
          automaticamente la cover; puoi cambiarla in qualsiasi momento.
        </p>
      </div>
      <PropertyPhotosManager propertyId={propertyId} initialPhotos={[]} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Step 3 — AI generation + editable review
// ──────────────────────────────────────────────────────────────────────

function Step3AI({
  formData,
  content,
  setContent,
  setError,
}: {
  formData: FormData;
  content: PropertyAIContent | null;
  setContent: (c: PropertyAIContent | null) => void;
  setError: (e: string | null) => void;
}) {
  const [isGenerating, startGenerating] = useTransition();

  const handleGenerate = () => {
    setError(null);
    startGenerating(async () => {
      const result = await generatePropertyContent({
        contractType: formData.contractType!,
        propertyType: formData.propertyType,
        city: formData.city.trim(),
        price: Number(formData.price),
        sqm: Number(formData.sqm),
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
      });

      if (result.ok) {
        setContent(result.data);
      } else {
        setError(result.error.message);
      }
    });
  };

  // Initial state: nothing generated yet
  if (!content && !isGenerating) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--fg-secondary)] mb-2">
            Step 3
          </p>
          <h2 className="font-display text-3xl text-[var(--fg-primary)] mb-3">
            Genera con AI
          </h2>
          <p className="text-sm text-[var(--fg-secondary)] mb-1">
            L'assistente userà i dati del Step 1 per generare titolo,
            descrizione, caratteristiche, SEO title e social caption.
          </p>
          <p className="text-xs text-[var(--fg-secondary)]/70">
            Tempo ~10 secondi · Costo ~€0,01 per generazione
          </p>
        </div>

        <div className="rounded-md border border-dashed border-[var(--border-subtle)] py-16 px-8 text-center">
          <button
            type="button"
            onClick={handleGenerate}
            className="px-8 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
          >
            ✦ Genera con AI
          </button>
        </div>
      </div>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <div className="rounded-md border border-dashed border-[var(--border-subtle)] py-20 px-8 text-center animate-pulse">
        <p className="font-display text-2xl text-[var(--fg-primary)] mb-3">
          L'assistente sta scrivendo…
        </p>
        <p className="text-sm text-[var(--fg-secondary)]">
          GPT-4o sta generando i contenuti per il tuo annuncio
        </p>
      </div>
    );
  }

  // Generated content — editable form
  if (content) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--fg-secondary)] mb-2">
            Step 3 · Rivedi e modifica
          </p>
          <h2 className="font-display text-3xl text-[var(--fg-primary)] mb-3">
            Contenuto generato
          </h2>
          <p className="text-sm text-[var(--fg-secondary)]">
            Modifica liberamente i testi. "Rigenera" produce una nuova
            versione AI partendo dai dati del Step 1.
          </p>
        </div>

        <Field label="Titolo">
          <input
            type="text"
            value={content.title}
            onChange={(e) => setContent({ ...content, title: e.target.value })}
            className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
          />
        </Field>

        <Field label="Descrizione">
          <textarea
            value={content.description}
            onChange={(e) =>
              setContent({ ...content, description: e.target.value })
            }
            rows={8}
            className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base leading-relaxed focus:outline-none focus:border-[var(--fg-primary)] transition-colors resize-y"
          />
        </Field>

        <Field label="Caratteristiche">
          <AmenitiesEditor
            value={content.amenities}
            onChange={(amenities) => setContent({ ...content, amenities })}
          />
        </Field>

        <Field label="SEO title">
          <input
            type="text"
            value={content.seoTitle}
            onChange={(e) =>
              setContent({ ...content, seoTitle: e.target.value })
            }
            className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
          />
        </Field>

        <Field label="Social caption">
          <textarea
            value={content.socialCaption}
            onChange={(e) =>
              setContent({ ...content, socialCaption: e.target.value })
            }
            rows={2}
            className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base focus:outline-none focus:border-[var(--fg-primary)] transition-colors resize-y"
          />
        </Field>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors disabled:opacity-40"
          >
            ↻ Rigenera con AI
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ──────────────────────────────────────────────────────────────────────
// Amenities tag editor (used in Step 3)
// ──────────────────────────────────────────────────────────────────────

function AmenitiesEditor({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [newAmenity, setNewAmenity] = useState("");

  const handleAdd = () => {
    const trimmed = newAmenity.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setNewAmenity("");
      return;
    }
    onChange([...value, trimmed]);
    setNewAmenity("");
  };

  const handleRemove = (idx: number) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((amenity, idx) => (
            <li
              key={`${amenity}-${idx}`}
              className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 border border-[var(--border-subtle)] rounded-full bg-[var(--bg-canvas)]"
            >
              <span className="text-sm text-[var(--fg-primary)]">
                {amenity}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--fg-secondary)] hover:bg-[var(--fg-primary)]/10 hover:text-[var(--fg-primary)] transition-colors text-base leading-none"
                aria-label={`Rimuovi ${amenity}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={newAmenity}
          onChange={(e) => setNewAmenity(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Aggiungi caratteristica e premi Invio…"
          className="flex-1 px-4 py-2.5 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-sm placeholder:text-[var(--fg-secondary)]/50 focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newAmenity.trim()}
          className="px-4 py-2.5 text-sm text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] border border-[var(--border-subtle)] rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Aggiungi
        </button>
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
