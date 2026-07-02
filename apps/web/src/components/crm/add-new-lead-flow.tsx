"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  NEW_LEAD_SOURCE_VALUES,
  type NewLeadFormValues,
  newLeadDefaultValues,
  newLeadFormSchema,
} from "@/lib/crm/new-lead-schema";
import { PIPELINE_COLUMNS } from "@/lib/crm/pipeline";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const SOURCE_LABELS: Record<string, string> = {
  valuation: "Valutazione",
  portal: "Portale",
  idealista: "Idealista",
  facebook: "Facebook",
  manual: "Manuale",
  referral: "Referral",
  website: "Website",
  whatsapp: "WhatsApp",
};

type TeamMember = { user_id: string; full_name: string | null };

export function AddNewLeadFlow() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([]);

  const form = useForm<NewLeadFormValues>({
    resolver: zodResolver(newLeadFormSchema),
    defaultValues: newLeadDefaultValues,
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (!open) {
      reset(newLeadDefaultValues);
    }
  }, [open, reset]);

  useEffect(() => {
    if (open && members.length === 0) {
      fetch("/api/team/members")
        .then((r) => r.json())
        .then((data: TeamMember[]) => setMembers(data))
        .catch(() => {});
    }
  }, [open, members.length]);

  const onSubmit = useCallback(
    async (values: NewLeadFormValues) => {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          budget_min: values.budget_min ?? null,
          budget_max: values.budget_max ?? null,
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(
          typeof body.error === "string" ? body.error : "Impossibile creare il lead",
        );
        return;
      }

      toast.success("Lead creato con successo");
      setOpen(false);
      router.refresh();
    },
    [router],
  );

  const selectClassName =
    "flex h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]/80 px-3 text-[13px] text-[var(--fg-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brass)]/35";

  return (
    <>
      <Button
        type="button"
        size="lg"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 sm:right-8 z-[var(--z-sticky)] h-14 pl-5 pr-6 rounded-2xl shadow-[var(--shadow-floating)] border border-[var(--color-brass)]/25 ring-1 ring-[var(--color-brass-soft)]/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
        aria-haspopup="dialog"
      >
        <UserPlus className="size-5" aria-hidden />
        <span className="font-display text-[15px] tracking-tight">Nuovo Lead</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Nuovo lead</DialogTitle>
            <DialogDescription>
              Aggiungi un contatto al pipeline. I campi contrassegnati sono obbligatori per un
              profilo completo.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="overflow-y-auto px-6 py-4 space-y-4 flex-1 min-h-0"
          >
            <div className="grid gap-2">
              <Label htmlFor="new-lead-name">Nome completo *</Label>
              <Input
                id="new-lead-name"
                autoComplete="name"
                placeholder="es. Marco Bianchi"
                aria-invalid={!!errors.full_name}
                {...register("full_name")}
              />
              {errors.full_name ? (
                <p className="text-[12px] text-[var(--color-danger)]">
                  {errors.full_name.message}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-lead-email">Email</Label>
                <Input
                  id="new-lead-email"
                  type="email"
                  autoComplete="email"
                  placeholder="nome@email.it"
                  aria-invalid={!!errors.email}
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-[12px] text-[var(--color-danger)]">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-lead-phone">Telefono</Label>
                <Input
                  id="new-lead-phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+39 …"
                  {...register("phone")}
                />
                {errors.phone ? (
                  <p className="text-[12px] text-[var(--color-danger)]">
                    {errors.phone.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-lead-budget-min">Budget min (€)</Label>
                <Input
                  id="new-lead-budget-min"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="es. 50000"
                  aria-invalid={!!errors.budget_min}
                  {...register("budget_min")}
                />
                {errors.budget_min ? (
                  <p className="text-[12px] text-[var(--color-danger)]">
                    {String(errors.budget_min.message)}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-lead-budget-max">Budget max (€)</Label>
                <Input
                  id="new-lead-budget-max"
                  type="number"
                  min={1}
                  step={1}
                  placeholder="es. 50000"
                  aria-invalid={!!errors.budget_max}
                  {...register("budget_max")}
                />
                {errors.budget_max ? (
                  <p className="text-[12px] text-[var(--color-danger)]">
                    {errors.budget_max.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-lead-city">Città / zona preferita</Label>
              <Input
                id="new-lead-city"
                placeholder="es. Milano, Brera"
                {...register("preferred_city")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="new-lead-source">Fonte *</Label>
                <select
                  id="new-lead-source"
                  className={selectClassName}
                  aria-invalid={!!errors.source}
                  {...register("source")}
                >
                  {NEW_LEAD_SOURCE_VALUES.map((v) => (
                    <option key={v} value={v}>
                      {SOURCE_LABELS[v] ?? v}
                    </option>
                  ))}
                </select>
                {errors.source ? (
                  <p className="text-[12px] text-[var(--color-danger)]">
                    {errors.source.message}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-lead-status">Stato iniziale *</Label>
                <select
                  id="new-lead-status"
                  className={selectClassName}
                  aria-invalid={!!errors.status}
                  {...register("status")}
                >
                  {PIPELINE_COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {errors.status ? (
                  <p className="text-[12px] text-[var(--color-danger)]">
                    {errors.status.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-lead-assigned">Assegna a</Label>
              <select
                id="new-lead-assigned"
                className={selectClassName}
                {...register("assigned_to")}
              >
                <option value="">— Nessun agente —</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name ?? m.user_id}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-lead-notes">Note</Label>
              <Textarea
                id="new-lead-notes"
                placeholder="Preferenze, contesto, prossimi passi…"
                {...register("notes")}
              />
              {errors.notes ? (
                <p className="text-[12px] text-[var(--color-danger)]">
                  {errors.notes.message}
                </p>
              ) : null}
            </div>

            <DialogFooter className="px-0 pb-0 pt-2 border-0 bg-transparent sm:justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvataggio…" : "Crea lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
