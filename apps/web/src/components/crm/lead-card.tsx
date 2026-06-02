"use client";

import {
  formatBudgetRange,
  formatLeadSource,
  formatPropertyType,
  formatZones,
  resolveDisplayUrgency,
  urgencyLabel,
} from "@/lib/crm/lead-presenter";
import type { PipelineLead } from "@/lib/crm/pipeline";
import { StaleBadge } from "@/components/funnel/StaleBadge";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatRelative } from "@habiquo/utils";
import { ArrowRight, GripVertical, Mail, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";

type LeadCardProps = {
  lead: PipelineLead;
  /** Brief highlight when the card lands in a new column via realtime sync. */
  surfacePulse?: boolean;
};

function stopDrag(e: React.SyntheticEvent) {
  e.stopPropagation();
}

function priorityStyles(u: ReturnType<typeof resolveDisplayUrgency>): string {
  const map: Record<ReturnType<typeof resolveDisplayUrgency>, string> = {
    low: "bg-[var(--color-positive)]/15 text-[var(--color-positive)] border-[var(--color-positive)]/30",
    medium:
      "bg-[var(--color-brass)]/12 text-[var(--color-brass-deep)] border-[var(--color-brass)]/25",
    high: "bg-[var(--color-warning)]/15 text-[var(--color-warning)] border-[var(--color-warning)]/30",
    critical:
      "bg-[var(--color-danger)]/18 text-[var(--color-danger)] border-[var(--color-danger)]/35",
  };
  return map[u];
}

function sourceStyles(): string {
  return "bg-[var(--bg-sunken)]/90 text-[var(--fg-secondary)] border-[var(--border-subtle)]";
}

export function LeadCard({ lead, surfacePulse = false }: LeadCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const urgency = resolveDisplayUrgency(lead);
  const sourceLabel = formatLeadSource(lead.source, lead.sourceDetail);
  const callHref = lead.phone ? `tel:${lead.phone.replace(/\s/g, "")}` : null;
  const rawDigits = (lead.whatsapp || lead.phone || "").replace(/\D/g, "");
  const waE164 =
    rawDigits.length > 0
      ? rawDigits.startsWith("39")
        ? rawDigits
        : rawDigits.startsWith("3")
          ? `39${rawDigits}`
          : rawDigits
      : "";
  const waHref = waE164 ? `https://wa.me/${waE164}` : null;
  const mailHref = lead.email ? `mailto:${lead.email}` : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-2xl border border-[var(--glass-edge)] glass-panel transition-[transform,box-shadow,ring-color,opacity] duration-300 ease-out ${
        isDragging
          ? "opacity-95 shadow-2xl ring-1 ring-[var(--color-brass)]/40 z-20 scale-[1.01]"
          : surfacePulse
            ? "ring-2 ring-[var(--color-brass)]/50 shadow-[0_0_28px_-10px_rgba(200,160,96,0.45)]"
            : "hover:shadow-[var(--shadow-floating)] hover:border-[var(--color-brass)]/20"
      }`}
    >
      <div className="flex gap-1.5 p-2 sm:p-2.5">
        <button
          type="button"
          className="mt-0.5 h-fit shrink-0 touch-none cursor-grab rounded-lg p-1.5 text-[var(--fg-muted)] hover:bg-[var(--bg-sunken)] hover:text-[var(--fg-primary)] active:cursor-grabbing transition-colors"
          aria-label="Trascina lead"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-1">
            <span
              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${priorityStyles(urgency)}`}
            >
              {urgencyLabel(urgency)}
            </span>
            <span
              className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[9px] font-medium ${sourceStyles()}`}
            >
              {sourceLabel}
            </span>
            {/* Staleness badge — visibile solo se il lead è inattivo */}
            <StaleBadge
              status={lead.status}
              lastActivityAt={lead.lastContactAt}
              updatedAt={lead.updatedAt}
              createdAt={null}
            />
          </div>

          <Link
            href={`/crm/leads/${lead.id}`}
            className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-canvas)]"
          >
            <h3 className="text-[13px] sm:text-[14px] font-semibold leading-snug text-[var(--fg-primary)] group-hover:text-[var(--accent-deep)] transition-colors line-clamp-2">
              {lead.fullName}
            </h3>
            <dl className="mt-1.5 space-y-0.5 text-[11px] text-[var(--fg-muted)]">
              <div className="flex justify-between gap-2">
                <dt className="sr-only">Telefono</dt>
                <dd className="truncate">{lead.phone ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="shrink-0">Budget</dt>
                <dd className="truncate text-right text-[var(--fg-secondary)] tabular-nums">
                  {formatBudgetRange(lead)}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="shrink-0">Zona</dt>
                <dd className="truncate text-right">{formatZones(lead.preferredZones)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="shrink-0">Tipo</dt>
                <dd className="truncate text-right">{formatPropertyType(lead.propertyType)}</dd>
              </div>
              <div className="flex justify-between gap-2 pt-0.5 border-t border-[var(--border-subtle)]/60 mt-1">
                <dt className="shrink-0 text-[var(--fg-muted)]">Urgenza</dt>
                <dd className="text-[var(--fg-secondary)]">{urgencyLabel(urgency)}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="shrink-0">Ultimo contatto</dt>
                <dd className="text-[var(--fg-secondary)]">
                  {lead.lastContactAt ? formatRelative(lead.lastContactAt) : "—"}
                </dd>
              </div>
            </dl>
          </Link>

          <fieldset
            className="flex flex-wrap gap-1 pt-0.5 border-0 p-0 m-0 min-w-0"
            onPointerDown={stopDrag}
          >
            <legend className="sr-only">Azioni rapide</legend>
            {callHref ? (
              <a
                href={callHref}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sunken)]/80 text-[var(--fg-secondary)] hover:bg-[var(--bg-canvas)] hover:text-[var(--fg-primary)] transition-colors"
                aria-label="Chiama"
              >
                <Phone className="size-3.5" />
              </a>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] opacity-40">
                <Phone className="size-3.5" />
              </span>
            )}
            {waHref ? (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sunken)]/80 text-[var(--color-positive)] hover:bg-[var(--bg-canvas)] transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle className="size-3.5" />
              </a>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] opacity-40">
                <MessageCircle className="size-3.5" />
              </span>
            )}
            {mailHref ? (
              <a
                href={mailHref}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-sunken)]/80 text-[var(--fg-secondary)] hover:bg-[var(--bg-canvas)] hover:text-[var(--fg-primary)] transition-colors"
                aria-label="Email"
              >
                <Mail className="size-3.5" />
              </a>
            ) : (
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dashed border-[var(--border-subtle)] opacity-40">
                <Mail className="size-3.5" />
              </span>
            )}
            <Link
              href={`/crm/leads/${lead.id}`}
              className="inline-flex h-8 flex-1 min-w-[100px] items-center justify-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--color-onyx-900)] text-[11px] font-medium text-[var(--color-brass-soft)] hover:opacity-95 transition-opacity sm:flex-none sm:px-3"
            >
              Scheda
              <ArrowRight className="size-3.5 opacity-80" />
            </Link>
          </fieldset>
        </div>
      </div>
    </div>
  );
}

export function LeadCardDragPreview({ lead }: { lead: PipelineLead }) {
  const urgency = resolveDisplayUrgency(lead);
  return (
    <div className="rounded-2xl border border-[var(--glass-edge)] glass-panel shadow-2xl ring-2 ring-[var(--color-brass)]/30 w-[min(100vw-2rem,300px)] rotate-[1deg]">
      <div className="p-3 space-y-2">
        <div className="flex gap-1 flex-wrap">
          <span
            className={`rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${priorityStyles(urgency)}`}
          >
            {urgencyLabel(urgency)}
          </span>
          <span className={`rounded-md border px-1.5 py-0.5 text-[9px] ${sourceStyles()}`}>
            {formatLeadSource(lead.source, lead.sourceDetail)}
          </span>
        </div>
        <p className="text-[14px] font-semibold text-[var(--fg-primary)] leading-snug">
          {lead.fullName}
        </p>
        <p className="text-[11px] text-[var(--fg-muted)] tabular-nums">{formatBudgetRange(lead)}</p>
      </div>
    </div>
  );
}
