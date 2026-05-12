"use client";

import { useState, useTransition } from "react";
import { submitPublicLead } from "@/lib/actions/submit-public-lead";

type Props = {
  agencyId: string;
  propertyId: string | null;
  propertyTitle?: string;
};

type FormState =
  | { status: "idle" | "submitting" }
  | { status: "success" }
  | { status: "error"; error: string };

export function LeadForm({ agencyId, propertyId, propertyTitle }: Props) {
  const defaultMessage = propertyTitle
    ? `Buongiorno, sono interessato a: ${propertyTitle}.\n\n`
    : "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [state, setState] = useState<FormState>({ status: "idle" });
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Client-side validation (the server action validates again)
    if (fullName.trim().length < 2) {
      setState({
        status: "error",
        error: "Inserisci il tuo nome e cognome.",
      });
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setState({
        status: "error",
        error: "Inserisci almeno una email o un telefono.",
      });
      return;
    }

    setState({ status: "submitting" });

    startTransition(async () => {
      const result = await submitPublicLead({
        agencyId,
        propertyId,
        fullName: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        message: message.trim() || null,
      });

      if (result.ok) {
        setState({ status: "success" });
        setFullName("");
        setEmail("");
        setPhone("");
        setMessage(defaultMessage);
      } else {
        setState({ status: "error", error: result.error });
      }
    });
  }

  const isSubmitting = state.status === "submitting" || isPending;

  if (state.status === "success") {
    return (
      <div className="text-center py-8">
        <p className="text-xs uppercase tracking-widest text-[var(--accent-deep)] mb-3">
          Grazie
        </p>
        <p className="font-display text-2xl text-[var(--fg-primary)] mb-3">
          Richiesta inviata.
        </p>
        <p className="text-sm text-[var(--fg-secondary)] mb-6">
          Ti ricontatteremo al più presto.
        </p>
        <button
          type="button"
          onClick={() => setState({ status: "idle" })}
          className="text-sm underline underline-offset-4 text-[var(--accent-deep)] hover:opacity-80"
        >
          Invia un'altra richiesta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="lead-full-name"
          className="block text-xs uppercase tracking-widest text-[var(--fg-secondary)] mb-1.5"
        >
          Nome e cognome <span className="text-[var(--accent-deep)]">*</span>
        </label>
        <input
          id="lead-full-name"
          type="text"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={isSubmitting}
          maxLength={200}
          className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-sm focus:outline-none focus:border-[var(--accent-deep)] transition-colors disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="lead-email"
          className="block text-xs uppercase tracking-widest text-[var(--fg-secondary)] mb-1.5"
        >
          Email
        </label>
        <input
          id="lead-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-sm focus:outline-none focus:border-[var(--accent-deep)] transition-colors disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="lead-phone"
          className="block text-xs uppercase tracking-widest text-[var(--fg-secondary)] mb-1.5"
        >
          Telefono
        </label>
        <input
          id="lead-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isSubmitting}
          className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-sm focus:outline-none focus:border-[var(--accent-deep)] transition-colors disabled:opacity-60"
        />
      </div>

      <p className="text-xs text-[var(--fg-secondary)] -mt-2">
        Inserisci almeno uno tra email e telefono.
      </p>

      <div>
        <label
          htmlFor="lead-message"
          className="block text-xs uppercase tracking-widest text-[var(--fg-secondary)] mb-1.5"
        >
          Messaggio
        </label>
        <textarea
          id="lead-message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={isSubmitting}
          maxLength={4000}
          className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-canvas)] text-sm focus:outline-none focus:border-[var(--accent-deep)] transition-colors disabled:opacity-60 resize-y"
        />
      </div>

      {state.status === "error" ? (
        <p
          role="alert"
          className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded-md border border-red-200"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-[var(--fg-primary)] text-[var(--bg-canvas)] rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Invio in corso…" : "Invia richiesta"}
      </button>

      <p className="text-xs text-[var(--fg-secondary)] text-center leading-relaxed">
        Inviando il modulo, accetti che i tuoi dati siano trattati per
        rispondere alla tua richiesta.
      </p>
    </form>
  );
}
