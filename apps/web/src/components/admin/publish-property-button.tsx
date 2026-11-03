"use client";

import { publishProperty } from "@/lib/actions/publish-property";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Props = {
  propertyId: string;
  /** properties.is_public as rendered by the server. */
  isPublic: boolean;
  /**
   * Whether the agency's public site is online. The listing page only
   * exists then, so the "view" link is shown only in that case.
   */
  agencyIsPublic: boolean;
};

type State =
  | { kind: "idle" }
  | { kind: "error"; message: string }
  | { kind: "published"; publicUrl: string | null };

/**
 * Publishes an existing draft through the publishProperty server action.
 * Permissions are checked on the server; this button only drives the UI.
 *
 * Render it unconditionally: it shows nothing for a property that was
 * already public, and keeps its confirmation after router.refresh() turns
 * isPublic to true.
 */
export function PublishPropertyButton({ propertyId, isPublic, agencyIsPublic }: Props) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();
  // Synchronous guard against a double click before React re-renders.
  const inFlight = useRef(false);

  function handlePublish() {
    if (inFlight.current || state.kind === "published") return;
    inFlight.current = true;
    setState({ kind: "idle" });

    startTransition(async () => {
      try {
        const result = await publishProperty({ propertyId });
        if (result.ok) {
          const { agencySlug, propertySlug } = result.data;
          setState({
            kind: "published",
            publicUrl:
              agencyIsPublic && agencySlug && propertySlug
                ? `/${agencySlug}/immobili/${propertySlug}`
                : null,
          });
          // Refresh the server-rendered page (status, public link, lists).
          router.refresh();
        } else {
          setState({ kind: "error", message: result.error.message });
        }
      } catch {
        setState({
          kind: "error",
          message: "Errore di connessione. Controlla la rete e riprova.",
        });
      } finally {
        inFlight.current = false;
      }
    });
  }

  if (state.kind === "published") {
    return (
      <output className="mt-3 inline-flex flex-wrap items-center gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        <span>Immobile pubblicato.</span>
        {/* After router.refresh() the page renders its own public link. */}
        {isPublic && state.publicUrl ? null : state.publicUrl ? (
          <a
            href={state.publicUrl}
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-emerald-900"
          >
            Apri pagina pubblica ↗
          </a>
        ) : (
          <span className="text-emerald-700">
            Sarà visibile quando il sito dell&apos;agenzia sarà online.
          </span>
        )}
      </output>
    );
  }

  if (isPublic) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      <span className="text-xs text-neutral-500">Bozza · non visibile sul sito</span>
      <button
        type="button"
        onClick={handlePublish}
        disabled={isPending}
        aria-busy={isPending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Pubblicazione…" : "Pubblica"}
      </button>
      {state.kind === "error" && (
        <span role="alert" className="text-sm text-red-600">
          {state.message}
        </span>
      )}
    </div>
  );
}
