"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { updateAgencyPublic } from "@/lib/actions/update-agency-public";

/**
 * Client-side schema. Loose on purpose: format validation (slug regex,
 * reserved slugs, public-requires-slug) lives in the server action,
 * which is the single source of truth. The client just enforces basic
 * character limits to give immediate feedback.
 */
const formSchema = z.object({
  isPublic: z.boolean(),
  slug: z.string().max(60).nullish(),
  tagline: z.string().max(200).nullish(),
  description: z.string().max(2000).nullish(),
  city: z.string().max(100).nullish(),
  region: z.string().max(100).nullish(),
  phone: z.string().max(50).nullish(),
});

type FormValues = z.infer<typeof formSchema>;

export type AgencyPublicFormInitial = {
  id: string;
  name: string;
  isPublic: boolean;
  slug: string | null;
  tagline: string | null;
  description: string | null;
  city: string | null;
  region: string | null;
  phone: string | null;
};

export function AgencyPublicForm({
  agency,
}: {
  agency: AgencyPublicFormInitial;
}) {
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    slug: string | null;
    isPublic: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isPublic: agency.isPublic,
      slug: agency.slug ?? "",
      tagline: agency.tagline ?? "",
      description: agency.description ?? "",
      city: agency.city ?? "",
      region: agency.region ?? "",
      phone: agency.phone ?? "",
    },
  });

  const watchedIsPublic = watch("isPublic");
  const watchedSlug = watch("slug");

  const onSubmit = (values: FormValues) => {
    setServerError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await updateAgencyPublic({
        agencyId: agency.id,
        isPublic: values.isPublic,
        slug: values.slug,
        tagline: values.tagline,
        description: values.description,
        city: values.city,
        region: values.region,
        phone: values.phone,
      });

      if (!result.ok) {
        // Map server field errors back to form fields so they appear inline.
        const slugError = result.error.fields?.slug?.[0];
        if (slugError) {
          setError("slug", { type: "server", message: slugError });
        } else {
          setServerError(result.error.message);
        }
        return;
      }

      setSuccess({
        slug: result.data.slug,
        isPublic: result.data.isPublic,
      });
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-10 max-w-2xl">
      {/* ─── SITO PUBBLICO ─────────────────────────────────── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Sito pubblico</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Configura come la tua agenzia appare ai visitatori del sito Habita.
          </p>
        </div>

        <label className="flex items-start gap-3 rounded-md border border-neutral-200 p-4 hover:border-neutral-300 transition">
          <input
            type="checkbox"
            {...register("isPublic")}
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
          />
          <div className="flex-1">
            <div className="text-sm font-medium text-neutral-900">
              Pubblica il sito agenzia
            </div>
            <div className="mt-0.5 text-xs text-neutral-600">
              Se disattivato, la pagina pubblica non sarà raggiungibile.
            </div>
          </div>
        </label>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-neutral-900 mb-1.5">
            Slug URL
            {watchedIsPublic && <span className="ml-0.5 text-red-600">*</span>}
          </label>
          <div className="flex items-stretch rounded-md border border-neutral-300 overflow-hidden focus-within:ring-2 focus-within:ring-neutral-900/10 focus-within:border-neutral-900">
            <span className="flex items-center px-3 text-xs text-neutral-500 bg-neutral-50 border-r border-neutral-300 whitespace-nowrap">
              /
            </span>
            <input
              id="slug"
              type="text"
              {...register("slug")}
              placeholder="nome-agenzia"
              autoCapitalize="off"
              autoComplete="off"
              spellCheck={false}
              className="flex-1 px-3 py-2 text-sm bg-white outline-none"
            />
          </div>
          {errors.slug ? (
            <p className="mt-1.5 text-xs text-red-600">{errors.slug.message}</p>
          ) : watchedSlug && watchedSlug.trim() ? (
            <p className="mt-1.5 text-xs text-neutral-500">
              Il tuo sito sarà a:{" "}
              <span className="font-mono text-neutral-700">
                /{watchedSlug.toLowerCase().trim()}
              </span>
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-neutral-500">
              Solo minuscole, numeri e trattini. 1-60 caratteri.
            </p>
          )}
        </div>
      </section>

      {/* ─── IDENTITÀ ───────────────────────────────────────── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Identità</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Il nome dell'agenzia compare sul sito; tagline e descrizione completano la presentazione.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-900 mb-1.5">
            Nome agenzia
          </label>
          <input
            type="text"
            value={agency.name}
            disabled
            className="block w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600"
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            Per cambiare il nome contatta l'amministratore.
          </p>
        </div>

        <div>
          <label htmlFor="tagline" className="block text-sm font-medium text-neutral-900 mb-1.5">
            Tagline
          </label>
          <input
            id="tagline"
            type="text"
            {...register("tagline")}
            maxLength={200}
            placeholder="La tua casa, trovata bene."
            className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
          />
          {errors.tagline && (
            <p className="mt-1.5 text-xs text-red-600">{errors.tagline.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutral-900 mb-1.5">
            Descrizione
          </label>
          <textarea
            id="description"
            {...register("description")}
            maxLength={2000}
            rows={5}
            placeholder="Chi sei, da quanto operi, in quali zone, cosa ti distingue."
            className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
          />
          {errors.description && (
            <p className="mt-1.5 text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>
      </section>

      {/* ─── CONTATTI ───────────────────────────────────────── */}
      <section className="space-y-5">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Contatti</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Compaiono nell'header e nei CTA del sito pubblico.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-neutral-900 mb-1.5">
              Città
            </label>
            <input
              id="city"
              type="text"
              {...register("city")}
              placeholder="Brindisi"
              className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
            />
          </div>
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-neutral-900 mb-1.5">
              Regione
            </label>
            <input
              id="region"
              type="text"
              {...register("region")}
              placeholder="Puglia"
              className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-neutral-900 mb-1.5">
            Telefono
          </label>
          <input
            id="phone"
            type="tel"
            {...register("phone")}
            placeholder="+39 0831 123456"
            className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-900/10 focus:border-neutral-900"
          />
        </div>
      </section>

      {/* ─── SERVER ERROR (non-field) ───────────────────────── */}
      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {serverError}
        </div>
      )}

      {/* ─── SUCCESS ────────────────────────────────────────── */}
      {success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <div className="font-medium">Impostazioni salvate.</div>
          {success.isPublic && success.slug && (
            <div className="mt-1 text-xs">
              Il tuo sito è live a{" "}
              <a
                href={`/${success.slug}`}
                target="_blank"
                rel="noreferrer"
                className="underline font-medium"
              >
                /{success.slug}
              </a>
              .
            </div>
          )}
          {!success.isPublic && (
            <div className="mt-1 text-xs text-emerald-700">
              Il sito è in modalità privata. Per pubblicarlo, riattiva il toggle.
            </div>
          )}
        </div>
      )}

      {/* ─── SUBMIT ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2 border-t border-neutral-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {isPending ? "Salvataggio…" : "Salva modifiche"}
        </button>
      </div>
    </form>
  );
}
