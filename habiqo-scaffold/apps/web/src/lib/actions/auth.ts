"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@habiqo/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const signInSchema = z.object({
  email: z.string().email({ message: "Inserisci un'email valida" }),
  password: z.string().min(8, { message: "Minimo 8 caratteri" }),
});

const signUpSchema = z.object({
  fullName: z.string().min(2, { message: "Inserisci nome e cognome" }).max(200).optional(),
  email: z.string().email({ message: "Inserisci un'email valida" }),
  password: z.string().min(8, { message: "Minimo 8 caratteri" }),
});

const redirectSchema = z.object({
  next: z.string().optional(),
});

export async function signIn(input: unknown): Promise<ActionResult<{ userId: string }>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: "Dati non validi",
        fields: parsed.error.flatten().fieldErrors,
      },
    };
  }

  let data: Awaited<
    ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["signInWithPassword"]>
  >["data"];
  let error: Awaited<
    ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["signInWithPassword"]>
  >["error"];
  try {
    const supabase = await createClient();
    ({ data, error } = await supabase.auth.signInWithPassword(parsed.data));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: {
        code: "unknown",
        message: msg.includes("Supabase env misconfigured")
          ? msg
          : "Connessione a Supabase non disponibile. Controlla NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
    };
  }

  if (error || !data.user) {
    return {
      ok: false,
      error: {
        code: "unauthenticated",
        message:
          error?.message?.toLowerCase().includes("invalid login credentials") ||
          error?.message?.toLowerCase().includes("invalid")
            ? "Email o password non corretti"
            : "Accesso non riuscito. Verifica le credenziali e riprova.",
      },
    };
  }

  return { ok: true, data: { userId: data.user.id } };
}

export async function signUp(input: unknown): Promise<ActionResult<{ userId: string }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: "Dati non validi",
        fields: parsed.error.flatten().fieldErrors,
      },
    };
  }

  let data: Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["signUp"]>>["data"];
  let error: Awaited<
    ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["signUp"]>
  >["error"];
  try {
    const supabase = await createClient();
    ({ data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: parsed.data.fullName ? { data: { full_name: parsed.data.fullName } } : undefined,
    }));
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: {
        code: "unknown",
        message: msg.includes("Supabase env misconfigured")
          ? msg
          : "Connessione a Supabase non disponibile. Controlla NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      },
    };
  }

  if (error || !data.user) {
    return {
      ok: false,
      error: {
        code: "unknown",
        message: error?.message ?? "Registrazione non riuscita",
      },
    };
  }

  return { ok: true, data: { userId: data.user.id } };
}

export async function signInAndRedirect(
  _prevState: ActionResult<null> | undefined,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: "Dati non validi",
        fields: parsed.error.flatten().fieldErrors,
      },
    };
  }

  const nextParsed = redirectSchema.safeParse({ next: formData.get("next") });
  const next = nextParsed.success ? nextParsed.data.next : undefined;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error || !data.user) {
      return {
        ok: false,
        error: {
          code: "unauthenticated",
          message: "Email o password non corretti",
        },
      };
    }

    revalidatePath("/", "layout");
    redirect(next?.startsWith("/") ? next : "/dashboard");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: {
        code: "unknown",
        message: msg.includes("Supabase env misconfigured")
          ? msg
          : "Connessione a Supabase non disponibile. Riprova tra qualche secondo.",
      },
    };
  }
}

export async function signUpAndRedirect(
  _prevState: ActionResult<null> | undefined,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName") || undefined,
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: {
        code: "validation_error",
        message: "Dati non validi",
        fields: parsed.error.flatten().fieldErrors,
      },
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: parsed.data.fullName ? { data: { full_name: parsed.data.fullName } } : undefined,
    });

    if (error || !data.user) {
      return {
        ok: false,
        error: {
          code: "unknown",
          message: error?.message ?? "Registrazione non riuscita",
        },
      };
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: {
        code: "unknown",
        message: msg.includes("Supabase env misconfigured")
          ? msg
          : "Connessione a Supabase non disponibile. Riprova tra qualche secondo.",
      },
    };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
