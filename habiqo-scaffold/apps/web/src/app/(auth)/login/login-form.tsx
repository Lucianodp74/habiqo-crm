"use client";

import { Button } from "@habiqo/ui";
import { useSearchParams } from "next/navigation";
import { useActionState, useMemo } from "react";
import { signInAndRedirect } from "@/lib/actions/auth";

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = useMemo(() => searchParams.get("next") ?? "/dashboard", [searchParams]);
  const [state, formAction, isPending] = useActionState(signInAndRedirect, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field
        name="email"
        type="email"
        label="Email"
        autoComplete="email"
        placeholder="nome@agenzia.it"
        errors={state?.ok === false ? state.error.fields?.email : undefined}
        required
      />
      <Field
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        errors={state?.ok === false ? state.error.fields?.password : undefined}
        required
      />
      {state?.ok === false && !state.error.fields ? (
        <p className="text-[12.5px] text-[var(--color-danger)]">{state.error.message}</p>
      ) : null}
      <Button intent="primary" size="lg" fullWidth loading={isPending} type="submit">
        Accedi
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
