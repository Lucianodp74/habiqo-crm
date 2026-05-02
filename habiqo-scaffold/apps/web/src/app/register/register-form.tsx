"use client";

import { useActionState } from "react";
import { Button } from "@habiqo/ui";
import { signUpAndRedirect } from "@/lib/actions/auth";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(signUpAndRedirect, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <Field
        name="fullName"
        type="text"
        label="Nome e cognome"
        placeholder="Giulia Romano"
        autoComplete="name"
        errors={state?.ok === false ? state.error.fields?.fullName : undefined}
      />
      <Field
        name="email"
        type="email"
        label="Email"
        placeholder="nome@agenzia.it"
        autoComplete="email"
        errors={state?.ok === false ? state.error.fields?.email : undefined}
        required
      />
      <Field
        name="password"
        type="password"
        label="Password"
        autoComplete="new-password"
        errors={state?.ok === false ? state.error.fields?.password : undefined}
        required
      />
      {state?.ok === false && !state.error.fields ? (
        <p className="text-[12.5px] text-[var(--color-danger)]">{state.error.message}</p>
      ) : null}
      <Button intent="primary" size="lg" fullWidth loading={isPending} type="submit">
        Crea account
      </Button>
    </form>
  );
}

function Field({
  name,
  type,
  label,
  errors,
  ...rest
}: {
  name: string;
  type: string;
  label: string;
  errors?: string[];
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = `field-${name}`;
  return (
    <div>
      <label
        htmlFor={id}
        className="block font-mono text-[10px] tracking-[0.16em] uppercase text-[var(--fg-muted)] mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        aria-invalid={errors ? true : undefined}
        aria-describedby={errors ? `${id}-error` : undefined}
        className="w-full h-10 px-3 rounded-md text-[14px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent transition-all"
        {...rest}
      />
      {errors ? (
        <p id={`${id}-error`} className="text-[12px] text-[var(--color-danger)] mt-1.5">
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}

