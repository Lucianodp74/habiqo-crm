"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { createDraftProperty } from "@/lib/actions/create-draft-property";
import {
  generatePropertyContent,
  type PropertyAIContent,
} from "@/lib/actions/generate-property-content";
import { updatePropertyContent } from "@/lib/actions/update-property-content";
import { publishProperty } from "@/lib/actions/publish-property";
import { PropertyPhotosManager } from "@/components/admin/property-photos-manager";

// ──────────────────────────────────────────────────────────────────────────────
// Types & constants
// ──────────────────────────────────────────────────────────────────────────────

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
type AdvancedData = {
  address: string;
  postalCode: string;
  region: string;
  floor: string;
  hasElevator: boolean;
  hasGarage: boolean;
  energyClass: string;
};
type PublishedRefs = {
  propertyId: string;
  propertySlug: string;
  agencySlug: string;
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
const INITIAL_ADVANCED: AdvancedData = {
  address: "",
  postalCode: "",
  region: "",
  floor: "",
  hasElevator: false,
  hasGarage: false,
  energyClass: "",
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
const ENERGY_CLASSES = ["A4", "A3", "A2", "A1", "B", "C", "D", "E", "F", "G"];

// ──────────────────────────────────────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────────────────────────────────────

export function PropertyCreateAIFlow() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [aiContent, setAiContent] = useState<PropertyAIContent | null>(null);
  const [advancedData, setAdvancedData] =
    useState<AdvancedData>(INITIAL_ADVANCED);
  const [published, setPublished] = useState<PublishedRefs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  const updateAdvanced = <K extends keyof AdvancedData>(
    key: K,
    value: AdvancedData[K],
  ) => {
    setAdvancedData((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  if (published) {
    return (
      <SuccessView
        propertySlug={published.propertySlug}
        agencySlug={published.agencySlug}
      />
    );
  }

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

  const canPublish = !isPending && propertyId !== null;

  const handleAdvance = () => {
    setError(null);

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

    setCurrentStep((s) => Math.min(4, s + 1));
  };

  const handlePublish = () => {
    if (!propertyId) return;
    setError(null);

    startTransition(async () => {
      const floorNum = advancedData.floor.trim()
        ? Number(advancedData.floor)
        : null;

      const result = await publishProperty({
        propertyId,
        address: advancedData.address.trim() || undefined,
        postalCode: advancedData.postalCode.trim() || undefined,
        region: advancedData.region.trim() || undefined,
        floor: Number.isFinite(floorNum) ? (floorNum as number) : null,
        hasElevator: advancedData.hasElevator,
        hasGarage: advancedData.hasGarage,
        energyClass: advancedData.energyClass || undefined,
      });

      if (result.ok) {
        setPublished(result.data);
      } else {
        setError(result.error.message);
      }
    });
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
    // ─── MOBILE: reduced vertical spacing + bottom padding for sticky nav ───
    <div className="space-y-8 sm:space-y-12 pb-2">

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div>
        <Link
          href="/admin/properties"
          className="inline-block text-xs uppercase tracking-widest text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition-colors mb-6"
        >
          ← Torna alla lista
        </Link>
        <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-2">
          Habiquo Studio
        </p>
        <h1 className="font-display text-4xl md:text-5xl text-[var(--fg-primary)] leading-tight">
          Crea immobile
        </h1>
      </div>

      {/* ─── Progress indicator ──────────────────────────────────────────── */}
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

      {/* ─── Error banner ────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* ─── Step content ────────────────────────────────────────────────── */}
      <div className="min-h-[320px] sm:min-h-[400px]">
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
          <Step4Advanced data={advancedData} update={updateAdvanced} />
        )}
      </div>

      {/* ─── Navigation — sticky on mobile so it stays above the keyboard ── */}
      <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-[var(--bg-canvas)] border-t border-[var(--border-subtle)] flex items-center justify-between md:relative md:bottom-auto md:mx-0 md:px-0 md:py-0 md:pt-8 md:border-t-0">
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
            onClick={handlePublish}
            disabled={!canPublish}
            className="px-8 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isPending ? "Pubblicazione…" : "Pubblica"}
          </button>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 1 — Basic property info
// ──────────────────────────────────────────────────────────────────────────────

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
    <div className="space-y-8 sm:space-y-10">
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

// ──────────────────────────────────────────────────────────────────────────────
// Step 2 — Photo upload
// ──────────────────────────────────────────────────────────────────────────────

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
          Carica le foto dell&apos;immobile. La prima foto caricata diventa
          automaticamente la cover; puoi cambiarla in qualsiasi momento.
        </p>
      </div>
      <PropertyPhotosManager propertyId={propertyId} initialPhotos={[]} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Step 3 — AI generation + editable review
// ──────────────────────────────────────────────────────────────────────────────

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
            L&apos;assistente userà i dati del Step 1 per generare titolo,
            descrizione, caratteristiche, SEO title e social caption.
          </p>
          <p className="text-xs text-[var(--fg-secondary)]/70">
            Tempo ~10 secondi · Costo ~€0,01 per generazione
          </p>
        </div>

        <div className="rounded-md border border-dashed border-[var(--border-subtle)] py-12 sm:py-16 px-8 text-center">
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

  if (isGenerating) {
    return (
      <div className="rounded-md border border-dashed border-[var(--border-subtle)] py-12 sm:py-20 px-8 text-center animate-pulse">
        <p className="font-display text-2xl text-[var(--fg-primary)] mb-3">
          L&apos;assistente sta scrivendo…
        </p>
        <p className="text-sm text-[var(--fg-secondary)]">
          GPT-4o sta generando i contenuti per il tuo annuncio
        </p>
      </div>
    );
  }

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
            Modifica liberamente i testi. &ldquo;Rigenera&rdquo; produce una
            nuova versione AI partendo dai dati del Step 1.
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
            rows={6}
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

// ──────────────────────────────────────────────────────────────────────────────
// Step 4 — Advanced data (all optional)
// ──────────────────────────────────────────────────────────────────────────────

function Step4Advanced({
  data,
  update,
}: {
  data: AdvancedData;
  update: <K extends keyof AdvancedData>(key: K, value: AdvancedData[K]) => void;
}) {
  return (
    <div className="space-y-8 sm:space-y-10">
      <div>
        <p className="text-xs uppercase tracking-widest text-[var(--fg-secondary)] mb-2">
          Step 4
        </p>
        <h2 className="font-display text-3xl text-[var(--fg-primary)] mb-3">
          Dati avanzati
        </h2>
        <p className="text-sm text-[var(--fg-secondary)]">
          Tutti i campi sono opzionali. Puoi pubblicare ora e completare
          questi dettagli in seguito dall&apos;admin.
        </p>
      </div>

      <Field label="Indirizzo completo">
        <input
          type="text"
          value={data.address}
          onChange={(e) => update("address", e.target.value)}
          placeholder="es. Via Roma 24"
          className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base placeholder:text-[var(--fg-secondary)]/50 focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="CAP">
          <input
            type="text"
            value={data.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
            placeholder="es. 72100"
            className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base placeholder:text-[var(--fg-secondary)]/50 focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
          />
        </Field>
        <Field label="Regione">
          <input
            type="text"
            value={data.region}
            onChange={(e) => update("region", e.target.value)}
            placeholder="es. Puglia"
            className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base placeholder:text-[var(--fg-secondary)]/50 focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field label="Piano">
          <input
            type="number"
            inputMode="numeric"
            value={data.floor}
            onChange={(e) => update("floor", e.target.value)}
            placeholder="es. 2"
            className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base placeholder:text-[var(--fg-secondary)]/50 focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
          />
        </Field>
        <Field label="Classe energetica">
          <select
            value={data.energyClass}
            onChange={(e) => update("energyClass", e.target.value)}
            className="w-full px-4 py-3 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-[var(--fg-primary)] text-base focus:outline-none focus:border-[var(--fg-primary)] transition-colors"
          >
            <option value="">Non specificata</option>
            {ENERGY_CLASSES.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Servizi">
        <div className="space-y-3">
          <Toggle
            label="Ascensore"
            value={data.hasElevator}
            onChange={(v) => update("hasElevator", v)}
          />
          <Toggle
            label="Garage / Box auto"
            value={data.hasGarage}
            onChange={(v) => update("hasGarage", v)}
          />
        </div>
      </Field>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Success view
// ──────────────────────────────────────────────────────────────────────────────

function SuccessView({
  propertySlug,
  agencySlug,
}: {
  propertySlug: string;
  agencySlug: string;
}) {
  const publicUrl = `/${agencySlug}/immobili/${propertySlug}`;

  return (
    <div className="py-16 sm:py-20 text-center space-y-6">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--fg-primary)] text-[var(--bg-canvas)] mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h2 className="font-display text-4xl md:text-5xl text-[var(--fg-primary)]">
        Pubblicato
      </h2>
      <p className="text-base text-[var(--fg-secondary)] max-w-md mx-auto">
        Il tuo immobile è ora online e visibile a tutti i visitatori del
        sito agenzia.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-6">
        <Link
          href={publicUrl}
          className="px-8 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Vedi annuncio pubblico →
        </Link>
        <Link
          href="/admin/properties"
          className="px-8 py-3 border border-[var(--border-subtle)] text-[var(--fg-primary)] rounded-md text-sm font-medium hover:border-[var(--fg-primary)]/40 transition-colors"
        >
          Torna alla lista immobili
        </Link>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Amenities tag editor
// ──────────────────────────────────────────────────────────────────────────────

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
              <span className="text-sm text-[var(--fg-primary)]">{amenity}</span>
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

// ──────────────────────────────────────────────────────────────────────────────
// Reusable sub-components
// ──────────────────────────────────────────────────────────────────────────────

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
            className={`flex-1 py-3 border rounded-md text-sm font-medium transition-all ${
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

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between px-4 py-3 border rounded-md text-sm transition-all ${
        value
          ? "border-[var(--fg-primary)] bg-[var(--fg-primary)]/5"
          : "border-[var(--border-subtle)] hover:border-[var(--fg-primary)]/40"
      }`}
    >
      <span className="text-[var(--fg-primary)]">{label}</span>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
          value
            ? "border-[var(--fg-primary)] bg-[var(--fg-primary)] text-[var(--bg-canvas)]"
            : "border-[var(--border-subtle)] text-transparent"
        }`}
        aria-hidden="true"
      >
        ✓
      </span>
    </button>
  );
}
