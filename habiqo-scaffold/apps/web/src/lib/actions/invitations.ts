"use server";

import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ────────────────────────────────────────────────────────────────
// Validation schema
// ────────────────────────────────────────────────────────────────

const inviteAgentSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email non valida"),
  role: z.enum(["agent", "owner"]).default("agent"),
});

// ────────────────────────────────────────────────────────────────
// Action result types
// ────────────────────────────────────────────────────────────────

type InviteSuccess = {
  ok: true;
  invitation: {
    id: string;
    email: string;
    token: string;
    inviteUrl: string;
    expiresAt: string;
  };
};

type ActionFailure = {
  ok: false;
  error: string;
};

export type InviteAgentResult = InviteSuccess | ActionFailure;
export type RevokeResult = { ok: true } | ActionFailure;

// ────────────────────────────────────────────────────────────────
// Helper: load current user's owner-membership in one place.
// Receives the supabase client, doesn't create a new one.
// ────────────────────────────────────────────────────────────────

type RequireOwnerAgencyResult =
  | { ok: true; userId: string; agencyId: string }
  | { ok: false; error: string };

async function requireOwnerAgency(
  supabase: SupabaseClient,
): Promise<RequireOwnerAgencyResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Devi essere autenticato" };
  }

  const { data: memberships, error } = await supabase
    .from("agency_members")
    .select("agency_id")
    .eq("user_id", user.id)
    .eq("role", "owner");

  if (error) {
    console.error("[requireOwnerAgency] query error:", error);
    return { ok: false, error: "Errore verificando i permessi" };
  }

  if (!memberships || memberships.length === 0) {
    return {
      ok: false,
      error: "Solo gli amministratori possono invitare nuovi membri",
    };
  }

  if (memberships.length > 1) {
    return {
      ok: false,
      error:
        "Sei amministratore di piu agenzie. Funzionalita non ancora supportata.",
    };
  }

  const membership = memberships[0];
  if (!membership) {
    return { ok: false, error: "Errore verificando i permessi" };
  }

  return {
    ok: true,
    userId: user.id,
    agencyId: membership.agency_id,
  };
}

// ────────────────────────────────────────────────────────────────
// Helper: resolve and validate the public app URL.
// Strict in production, permissive in dev to keep DX smooth.
// ────────────────────────────────────────────────────────────────

function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be set in production environments",
    );
  }

  return "http://localhost:3000";
}

// ────────────────────────────────────────────────────────────────
// Server Action: create an invitation
// ────────────────────────────────────────────────────────────────

export async function inviteAgent(input: {
  email: string;
  role?: "agent" | "owner";
}): Promise<InviteAgentResult> {
  const parsed = inviteAgentSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors[0]?.message ?? "Dati non validi",
    };
  }

  const { email, role } = parsed.data;
  const supabase = await createClient();

  const ctx = await requireOwnerAgency(supabase);
  if (!ctx.ok) return ctx;

  const { data: invitation, error: insertError } = await supabase
    .from("agency_invitations")
    .insert({
      agency_id: ctx.agencyId,
      email,
      role,
      invited_by: ctx.userId,
    })
    .select("id, email, token, expires_at")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        ok: false,
        error: "Esiste gia un invito pendente per questa email",
      };
    }
    console.error("[inviteAgent] insert error:", insertError);
    return { ok: false, error: "Errore creando l'invito" };
  }

  const inviteUrl = `${getAppUrl()}/accept-invite?token=${invitation.token}`;

  revalidatePath("/admin/team");

  return {
    ok: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      inviteUrl,
      expiresAt: invitation.expires_at,
    },
  };
}

// ────────────────────────────────────────────────────────────────
// Server Action: revoke an invitation
// ────────────────────────────────────────────────────────────────

export async function revokeInvitation(
  invitationId: string,
): Promise<RevokeResult> {
  const supabase = await createClient();

  const ctx = await requireOwnerAgency(supabase);
  if (!ctx.ok) return ctx;

  const { error } = await supabase
    .from("agency_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId)
    .eq("agency_id", ctx.agencyId)
    .eq("status", "pending");

  if (error) {
    console.error("[revokeInvitation] error:", error);
    return { ok: false, error: "Errore revocando l'invito" };
  }

  revalidatePath("/admin/team");
  return { ok: true };
}

// -----------------------------------------------------------------------------
// Accept invitation (nuovo utente)
// -----------------------------------------------------------------------------

const acceptInvitationSchema = z.object({
  token: z.string().min(1),
  fullName: z.string().trim().min(2, "Nome troppo corto"),
  password: z.string().min(8, "Password minimo 8 caratteri"),
});

export async function acceptInvitation(
  input: z.infer<typeof acceptInvitationSchema>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = acceptInvitationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dati non validi" };
  }

  const { token, fullName, password } = parsed.data;
  const supabase = await createClient();

  // 1. Valida il token
  const { data: invitation, error: invError } = await supabase
    .from("agency_invitations")
    .select("id, email, role, agency_id, status, expires_at")
    .eq("token", token)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (invError || !invitation) {
    return { ok: false, error: "Invito non valido o scaduto" };
  }

  // 2. Crea l'utente auth
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: invitation.email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (signUpError || !authData.user) {
    console.error("[acceptInvitation] signUp error:", signUpError);
    if (signUpError?.message?.includes("already registered")) {
      return { ok: false, error: "Email già registrata. Accedi con il tuo account esistente." };
    }
    return { ok: false, error: "Errore durante la creazione dell'account" };
  }

  const userId = authData.user.id;

  // 3. Inserisci il profilo
  const { error: profileError } = await supabase
    .from("profiles")
    .insert({ id: userId, full_name: fullName });

  if (profileError) {
    console.error("[acceptInvitation] profile error:", profileError);
    // Non blocchiamo: il trigger Supabase potrebbe già averlo creato
  }

  // 4. Aggiungi a agency_members
  const { error: memberError } = await supabase
    .from("agency_members")
    .insert({
      agency_id: invitation.agency_id,
      user_id: userId,
      role: invitation.role,
    });

  if (memberError) {
    console.error("[acceptInvitation] member error:", memberError);
    return { ok: false, error: "Errore nell'aggiunta al team" };
  }

  // 5. Marca l'invito come accettato
  await supabase
    .from("agency_invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_by: userId,
    })
    .eq("id", invitation.id);

  return { ok: true };
}
