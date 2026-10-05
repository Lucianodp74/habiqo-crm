"use client";

import { submitValuation } from "@/lib/actions/submit-valuation";
import Link from "next/link";
import { useState, useTransition } from "react";

type Props = {
  agencyId: string;
  agencyName: string;
  agencySlug: string;
};

const PROPERTY_TYPES = [
  { id: "apartment", label: "Appartamento" },
  { id: "villa", label: "Villa / Casa" },
  { id: "land", label: "Terreno" },
  { id: "commercial", label: "Commerciale" },
  { id: "office", label: "Ufficio" },
] as const;

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-sm focus:outline-none focus:border-[var(--fg-primary)] transition-colors";

/**
 * Sezione della home pubblica per raccogliere contatti di chi vuole
 * vendere (case, terreni, altro). Form breve: i dettagli dell'immobile
 * li approfondisce poi l'agente, oppure il visitatore può usare la
 * valutazione completa su /valuta-casa.
 */
export function AgencySellCta({ agencyId, agencyName, agencySlug }: Props) {
  const [propertyType, setPropertyType] = useState("");
  const [city, setCity] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!propertyType) return setError("Seleziona cosa vuoi vendere.");
    if (!city.trim()) return setError("Inserisci la zona o la città.");
    if (fullName.trim().length < 2) return setError("Inserisci il tuo nome.");
    if (!phone.trim()) return setError("Inserisci il tuo telefono.");
    if (!consentPrivacy)
      return setError("Per inviare la richiesta devi accettare l'informativa privacy.");

    setError("");
    startTransition(async () => {
      const result = await submitValuation({
        agencyId,
        propertyType,
        city,
        fullName,
        phone,
        consentPrivacy,
        consentMarketing,
      });
      if (result.ok) setDone(true);
      else setError(result.error);
    });
  }

  return (
    <section id="vendi" className="bg-[var(--bg-elevated)] border-y border-[var(--border-subtle)]">
      <div className="px-8 md:px-16 py-16 grid md:grid-cols-2 gap-10 items-start">
        <div>
          <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-4">
            Vuoi vendere?
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-[var(--fg-primary)] leading-tight mb-5">
            Hai una casa o un terreno da vendere?
          </h2>
          <p className="text-sm md:text-base text-[var(--fg-secondary)] leading-relaxed max-w-md mb-6">
            Lasciaci i tuoi riferimenti: un consulente di {agencyName} ti richiama per capire il
            valore reale del tuo immobile, senza impegno.
          </p>
          <Link
            href={`/${agencySlug}/valuta-casa`}
            className="text-sm underline text-[var(--fg-secondary)] hover:text-[var(--fg-primary)]"
          >
            Preferisci una valutazione dettagliata? Compila il modulo completo →
          </Link>
        </div>

        {done ? (
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-8 text-center">
            <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
              Richiesta inviata
            </p>
            <p className="font-display text-2xl text-[var(--fg-primary)] mb-2">
              Grazie, {fullName.trim().split(" ")[0]}.
            </p>
            <p className="text-sm text-[var(--fg-secondary)]">
              Ti ricontatteremo al {phone} al più presto.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-6 space-y-4"
          >
            <div>
              <span className="block text-xs uppercase tracking-widest text-[var(--fg-muted)] mb-2">
                Cosa vuoi vendere?
              </span>
              <div className="flex flex-wrap gap-2">
                {PROPERTY_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setPropertyType(t.id);
                      setError("");
                    }}
                    className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                      propertyType === t.id
                        ? "bg-[var(--fg-primary)] text-[var(--bg-canvas)] border-[var(--fg-primary)]"
                        : "border-[var(--border-subtle)] text-[var(--fg-secondary)] hover:border-[var(--fg-primary)]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Zona o città dell'immobile"
              aria-label="Zona o città dell'immobile"
              className={inputClass}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nome e cognome"
                aria-label="Nome e cognome"
                className={inputClass}
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Telefono"
                aria-label="Telefono"
                className={inputClass}
              />
            </div>

            <label className="flex items-start gap-3 text-xs text-[var(--fg-secondary)] leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={consentPrivacy}
                onChange={(e) => setConsentPrivacy(e.target.checked)}
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                Ho letto l&apos;
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline">
                  informativa privacy
                </a>{" "}
                e acconsento al trattamento dei miei dati per essere ricontattato.{" "}
                <span className="text-[var(--accent-deep)]">*</span>
              </span>
            </label>
            <label className="flex items-start gap-3 text-xs text-[var(--fg-secondary)] leading-relaxed cursor-pointer">
              <input
                type="checkbox"
                checked={consentMarketing}
                onChange={(e) => setConsentMarketing(e.target.checked)}
                className="mt-0.5 size-4 shrink-0"
              />
              <span>
                Acconsento a ricevere da {agencyName} comunicazioni su immobili e novità, anche via
                WhatsApp (facoltativo).
              </span>
            </label>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="w-full px-8 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isPending ? "Invio in corso…" : "Fatti richiamare →"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
