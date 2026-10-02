"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  type CampaignTemplate,
  createCampaignTemplate,
  deleteCampaignTemplate,
} from "@/lib/actions/campaign-templates";
import { createCampaign } from "@/lib/actions/create-campaign";
import { previewCampaignAudience } from "@/lib/actions/preview-campaign-audience";
import type { CampaignAudiencePreview } from "@/lib/actions/preview-campaign-audience";
import { sendCampaign } from "@/lib/actions/send-campaign";
import { uploadCampaignAttachment } from "@/lib/actions/upload-campaign-attachment";

type Props = {
  availableTags: string[];
  templates: CampaignTemplate[];
};

type Step = 1 | 2 | 3 | 4 | 5;

const LEAD_STATUSES = [
  { value: "", label: "Tutti gli stati" },
  { value: "new", label: "Nuovo" },
  { value: "qualified", label: "Qualificato" },
  { value: "in_negotiation", label: "In trattativa" },
  { value: "won", label: "Vinto" },
  { value: "lost", label: "Perso" },
] as const;

export function CampaignWizard({ availableTags, templates: initialTemplates }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  // ── Step 1: Destinatari ──────────────────────────────────────────
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [preview, setPreview] = useState<CampaignAudiencePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshPreview = useCallback(() => {
    setPreviewLoading(true);
    void previewCampaignAudience({ tags: selectedTags, status: status || null, city: city || null })
      .then((result) => {
        if (result.ok) setPreview(result.data);
        else toast.error(result.error.message);
      })
      .finally(() => setPreviewLoading(false));
  }, [selectedTags, status, city]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(refreshPreview, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [refreshPreview]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  // ── Step 2: Testo ─────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState(initialTemplates);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  function applyTemplate(body: string) {
    setMessage(body);
  }

  function handleSaveTemplate() {
    if (!templateName.trim() || !message.trim()) return;
    setSavingTemplate(true);
    void createCampaignTemplate({ name: templateName.trim(), body: message })
      .then((result) => {
        if (result.ok) {
          setTemplates((prev) => [
            {
              id: result.data.id,
              name: templateName.trim(),
              body: message,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);
          setTemplateName("");
          toast.success("Template salvato");
        } else {
          toast.error(result.error.message);
        }
      })
      .finally(() => setSavingTemplate(false));
  }

  function handleDeleteTemplate(id: string) {
    void deleteCampaignTemplate(id).then((result) => {
      if (result.ok) setTemplates((prev) => prev.filter((t) => t.id !== id));
      else toast.error(result.error.message);
    });
  }

  // ── Step 3: Locandina ─────────────────────────────────────────────
  const [attachmentPath, setAttachmentPath] = useState<string | null>(null);
  const [attachmentMime, setAttachmentMime] = useState<string | null>(null);
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const localUrl = URL.createObjectURL(file);
    setAttachmentPreviewUrl(localUrl);

    const formData = new FormData();
    formData.append("file", file);
    void uploadCampaignAttachment(formData)
      .then((result) => {
        if (result.ok) {
          setAttachmentPath(result.data.path);
          setAttachmentMime(result.data.mime);
        } else {
          toast.error(result.error.message);
          setAttachmentPreviewUrl(null);
        }
      })
      .finally(() => setUploading(false));
  }

  function removeAttachment() {
    setAttachmentPath(null);
    setAttachmentMime(null);
    setAttachmentPreviewUrl(null);
  }

  // ── Step 5: Invio ─────────────────────────────────────────────────
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isSubmitting, startSubmit] = useTransition();

  const readyCount = preview?.readyCount ?? 0;
  const canProceedToMessage = readyCount > 0;
  const canProceedToAttachment = name.trim().length > 0;
  const hasMessageOrAttachment = message.trim().length > 0 || !!attachmentPath;

  function handleSubmit() {
    if (!hasMessageOrAttachment) {
      toast.error("Aggiungi almeno un messaggio o una locandina.");
      return;
    }
    startSubmit(async () => {
      const result = await createCampaign({
        name: name.trim(),
        message: message.trim() || null,
        attachmentPath,
        attachmentMime,
        filter: { tags: selectedTags, status: status || null, city: city || null },
        scheduledAt:
          sendMode === "schedule" && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      });

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      if (sendMode === "now") {
        const sendResult = await sendCampaign(result.data.campaignId);
        if (!sendResult.ok) {
          toast.error(`Campagna creata, ma l'invio non è riuscito: ${sendResult.error.message}`);
          router.push(`/admin/marketing/campaigns/${result.data.campaignId}`);
          return;
        }
        toast.success(
          `Campagna inviata: ${sendResult.data.sent} inviati, ${sendResult.data.failed} falliti.`,
        );
      } else {
        toast.success("Campagna programmata e salvata come bozza.");
      }

      router.push(`/admin/marketing/campaigns/${result.data.campaignId}`);
    });
  }

  return (
    <div className="space-y-6">
      <StepIndicator step={step} />

      {step === 1 && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-[18px] text-[var(--fg-primary)]">Destinatari</h2>

          {availableTags.length > 0 ? (
            <div>
              <span className="block text-[11px] uppercase tracking-wide text-[var(--fg-muted)] mb-2">
                Tag
              </span>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
                      selectedTags.includes(tag)
                        ? "bg-[var(--color-onyx-900)] text-[var(--fg-on-onyx)] border-[var(--color-onyx-900)]"
                        : "border-[var(--border-subtle)] text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)]"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-[var(--fg-muted)]">
              Nessun tag trovato sui tuoi lead. Puoi comunque filtrare per stato o città.
            </p>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="campaign-lead-status"
                className="block text-[11px] uppercase tracking-wide text-[var(--fg-muted)] mb-1.5"
              >
                Stato lead
              </label>
              <select
                id="campaign-lead-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 px-3 py-2 text-[13px] text-[var(--fg-primary)]"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="campaign-city"
                className="block text-[11px] uppercase tracking-wide text-[var(--fg-muted)] mb-1.5"
              >
                Città (opzionale)
              </label>
              <input
                id="campaign-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="es. Milano"
                className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 px-3 py-2 text-[13px] text-[var(--fg-primary)]"
              />
            </div>
          </div>

          <div className="rounded-xl bg-[var(--bg-sunken)] px-4 py-3 flex items-center justify-between">
            <div className="text-[13px] text-[var(--fg-primary)]">
              {previewLoading ? (
                "Calcolo destinatari…"
              ) : preview ? (
                <>
                  <span className="font-semibold">Destinatari: {preview.totalMatched}</span>
                  <span className="text-[var(--fg-muted)]">
                    {" "}
                    · {preview.readyCount} pronti all&apos;invio
                    {preview.excludedMissingPhone > 0
                      ? ` · ${preview.excludedMissingPhone} esclusi (numero mancante/non valido)`
                      : ""}
                    {preview.excludedOptOut > 0
                      ? ` · ${preview.excludedOptOut} esclusi (opt-out)`
                      : ""}
                  </span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>

          {preview && preview.preview.length > 0 && (
            <details className="text-[13px]">
              <summary className="cursor-pointer text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]">
                Anteprima destinatari ({Math.min(preview.preview.length, 20)} di{" "}
                {preview.totalMatched})
              </summary>
              <ul className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                {preview.preview.map((p) => (
                  <li
                    key={p.leadId}
                    className="flex items-center justify-between px-2 py-1 rounded-lg hover:bg-[var(--bg-sunken)]"
                  >
                    <span
                      className={
                        p.excluded
                          ? "text-[var(--fg-muted)] line-through"
                          : "text-[var(--fg-primary)]"
                      }
                    >
                      {p.fullName}
                    </span>
                    <span className="text-[var(--fg-muted)] text-[11px]">
                      {p.excluded ? p.exclusionReason : p.phoneDisplay}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              disabled={!canProceedToMessage}
              onClick={() => setStep(2)}
              className="rounded-xl px-5 py-2.5 text-[12px] font-semibold text-[var(--fg-on-onyx)] bg-[var(--color-onyx-900)] hover:opacity-95 disabled:opacity-40 transition-opacity"
            >
              Continua →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-[18px] text-[var(--fg-primary)]">
            Nome e testo (facoltativo)
          </h2>

          <div>
            <label
              htmlFor="campaign-name"
              className="block text-[11px] uppercase tracking-wide text-[var(--fg-muted)] mb-1.5"
            >
              Nome campagna
            </label>
            <input
              id="campaign-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Promo autunno proprietari"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 px-3 py-2 text-[13px] text-[var(--fg-primary)]"
            />
          </div>

          {templates.length > 0 && (
            <div>
              <span className="block text-[11px] uppercase tracking-wide text-[var(--fg-muted)] mb-1.5">
                Template salvati
              </span>
              <div className="flex flex-wrap gap-2">
                {templates.map((t) => (
                  <div key={t.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => applyTemplate(t.body)}
                      className="px-3 py-1.5 rounded-full text-[12px] border border-[var(--border-subtle)] text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)]"
                    >
                      {t.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(t.id)}
                      title="Elimina template"
                      className="text-[var(--fg-muted)] hover:text-red-600 text-[12px] px-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="campaign-message"
              className="block text-[11px] uppercase tracking-wide text-[var(--fg-muted)] mb-1.5"
            >
              Messaggio — lascia vuoto per inviare solo la locandina
            </label>
            <textarea
              id="campaign-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              placeholder="es. Ciao {{nome}}, abbiamo nuovi immobili che potrebbero interessarti…"
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 px-3 py-2.5 text-[13px] text-[var(--fg-primary)] resize-y"
            />
            <p className="mt-1 text-[11px] text-[var(--fg-muted)]">
              Variabili disponibili: {"{{nome}}"}, {"{{cognome}}"}, {"{{nome_completo}}"}
            </p>
          </div>

          {message.trim() && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Nome template da salvare"
                className="flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 px-3 py-2 text-[12px] text-[var(--fg-primary)]"
              />
              <button
                type="button"
                disabled={!templateName.trim() || savingTemplate}
                onClick={handleSaveTemplate}
                className="rounded-xl px-3 py-2 text-[12px] font-medium text-[var(--fg-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-sunken)] disabled:opacity-40"
              >
                Salva come template
              </button>
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl px-4 py-2.5 text-[12px] text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)]"
            >
              ← Indietro
            </button>
            <button
              type="button"
              disabled={!canProceedToAttachment}
              onClick={() => setStep(3)}
              className="rounded-xl px-5 py-2.5 text-[12px] font-semibold text-[var(--fg-on-onyx)] bg-[var(--color-onyx-900)] hover:opacity-95 disabled:opacity-40 transition-opacity"
            >
              Continua →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-[18px] text-[var(--fg-primary)]">
            Locandina (facoltativa)
          </h2>
          <p className="text-[13px] text-[var(--fg-muted)]">
            JPG, PNG o PDF, max 5 MB. Puoi anche procedere senza allegato se hai scritto un
            messaggio.
          </p>

          {attachmentPreviewUrl ? (
            <div className="flex items-start gap-3">
              {attachmentMime === "application/pdf" ? (
                <div className="w-28 h-28 rounded-xl border border-[var(--border-subtle)] flex items-center justify-center text-[11px] text-[var(--fg-muted)]">
                  PDF
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachmentPreviewUrl}
                  alt="Anteprima locandina"
                  className="w-28 h-28 object-cover rounded-xl border border-[var(--border-subtle)]"
                />
              )}
              <button
                type="button"
                onClick={removeAttachment}
                className="text-[12px] text-red-600 hover:underline"
              >
                Rimuovi
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={handleFileChange}
              disabled={uploading}
              className="text-[13px] text-[var(--fg-secondary)]"
            />
          )}
          {uploading && <p className="text-[12px] text-[var(--fg-muted)]">Caricamento…</p>}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl px-4 py-2.5 text-[12px] text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)]"
            >
              ← Indietro
            </button>
            <button
              type="button"
              disabled={uploading || (!message.trim() && !attachmentPath)}
              onClick={() => setStep(4)}
              className="rounded-xl px-5 py-2.5 text-[12px] font-semibold text-[var(--fg-on-onyx)] bg-[var(--color-onyx-900)] hover:opacity-95 disabled:opacity-40 transition-opacity"
            >
              Continua →
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-[18px] text-[var(--fg-primary)]">Anteprima</h2>

          <div className="rounded-xl border border-[var(--border-subtle)] p-4 space-y-3 max-w-sm">
            {attachmentPreviewUrl && attachmentMime !== "application/pdf" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={attachmentPreviewUrl} alt="Locandina" className="w-full rounded-lg" />
            )}
            {attachmentMime === "application/pdf" && (
              <div className="text-[12px] text-[var(--fg-muted)]">📎 Allegato PDF</div>
            )}
            <p className="text-[13px] text-[var(--fg-primary)] whitespace-pre-wrap">
              {message.trim() || <span className="text-[var(--fg-muted)]">Nessun messaggio</span>}
            </p>
          </div>

          <div className="text-[13px] text-[var(--fg-secondary)]">
            Destinatari pronti all&apos;invio:{" "}
            <span className="font-semibold text-[var(--fg-primary)]">{readyCount}</span>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-xl px-4 py-2.5 text-[12px] text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)]"
            >
              ← Indietro
            </button>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="rounded-xl px-5 py-2.5 text-[12px] font-semibold text-[var(--fg-on-onyx)] bg-[var(--color-onyx-900)] hover:opacity-95 transition-opacity"
            >
              Continua →
            </button>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-[18px] text-[var(--fg-primary)]">Conferma invio</h2>

          <dl className="text-[13px] space-y-2">
            <div className="flex justify-between">
              <dt className="text-[var(--fg-muted)]">Nome campagna</dt>
              <dd className="text-[var(--fg-primary)] font-medium">{name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--fg-muted)]">Destinatari</dt>
              <dd className="text-[var(--fg-primary)] font-medium">
                {readyCount} pronti all&apos;invio
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--fg-muted)]">Messaggio</dt>
              <dd className="text-[var(--fg-primary)] font-medium text-right max-w-[60%]">
                {message.trim() || "Nessun messaggio"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--fg-muted)]">Allegato</dt>
              <dd className="text-[var(--fg-primary)] font-medium">
                {attachmentPath ? "Sì" : "Nessuno"}
              </dd>
            </div>
          </dl>

          <div>
            <span className="block text-[11px] uppercase tracking-wide text-[var(--fg-muted)] mb-2">
              Quando inviare
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSendMode("now")}
                className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
                  sendMode === "now"
                    ? "bg-[var(--color-onyx-900)] text-[var(--fg-on-onyx)] border-[var(--color-onyx-900)]"
                    : "border-[var(--border-subtle)] text-[var(--fg-secondary)]"
                }`}
              >
                Invia ora
              </button>
              <button
                type="button"
                onClick={() => setSendMode("schedule")}
                className={`px-3 py-1.5 rounded-full text-[12px] border transition-colors ${
                  sendMode === "schedule"
                    ? "bg-[var(--color-onyx-900)] text-[var(--fg-on-onyx)] border-[var(--color-onyx-900)]"
                    : "border-[var(--border-subtle)] text-[var(--fg-secondary)]"
                }`}
              >
                Programma invio
              </button>
            </div>
            {sendMode === "schedule" && (
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="mt-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/70 px-3 py-2 text-[13px] text-[var(--fg-primary)]"
              />
            )}
            {sendMode === "schedule" && (
              <p className="mt-1 text-[11px] text-[var(--fg-muted)]">
                La campagna verrà salvata come programmata. L&apos;invio automatico alla data scelta
                non è ancora attivo: potrai inviarla manualmente da questa pagina quando sarà il
                momento.
              </p>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="rounded-xl px-4 py-2.5 text-[12px] text-[var(--fg-secondary)] hover:bg-[var(--bg-sunken)]"
            >
              ← Indietro
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmit}
              className="rounded-xl px-6 py-2.5 text-[12px] font-semibold text-white bg-green-700 hover:bg-green-800 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? "Invio in corso…" : "INVIA CAMPAGNA"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const labels = ["Destinatari", "Testo", "Locandina", "Anteprima", "Conferma"];
  return (
    <div className="flex items-center gap-2 text-[11px]">
      {labels.map((label, i) => {
        const n = (i + 1) as Step;
        const active = n === step;
        const done = n < step;
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium ${
                active
                  ? "bg-[var(--color-onyx-900)] text-[var(--fg-on-onyx)]"
                  : done
                    ? "bg-[var(--color-brass)] text-[var(--fg-on-onyx)]"
                    : "bg-[var(--bg-sunken)] text-[var(--fg-muted)]"
              }`}
            >
              {i + 1}
            </span>
            <span
              className={active ? "text-[var(--fg-primary)] font-medium" : "text-[var(--fg-muted)]"}
            >
              {label}
            </span>
            {i < labels.length - 1 && <span className="text-[var(--fg-muted)]">·</span>}
          </div>
        );
      })}
    </div>
  );
}
