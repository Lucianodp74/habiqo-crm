import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getInvitationByToken } from "@/lib/queries/invitations";
import { AcceptInviteForm } from "@/components/accept-invite-form";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return <ErrorPage message="Link non valido." />;
  }

  const invitation = await getInvitationByToken(token);

  if (!invitation) {
    return (
      <ErrorPage message="Invito non valido o scaduto. Chiedi all'admin di inviarti un nuovo link." />
    );
  }

  // Controlla se l'utente è già loggato
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    if (user.email !== invitation.email) {
      return (
        <ErrorPage
          message={`Questo invito è per ${invitation.email}. Sei loggato con un account diverso.`}
        />
      );
    }

    // Auto-accettazione per utente già autenticato
    await supabase.from("agency_members").upsert({
      agency_id: invitation.agency_id,
      user_id: user.id,
      role: invitation.role,
    });

    await supabase
      .from("agency_invitations")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        accepted_by: user.id,
      })
      .eq("id", invitation.id);

    redirect("/dashboard");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-linen, #f5f0ea)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "2.5rem",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ marginBottom: "2rem", textAlign: "center" }}>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-onyx-400, #9ca3af)",
              marginBottom: "0.5rem",
              fontWeight: 600,
              letterSpacing: "0.05em",
            }}
          >
            HABIQUO
          </p>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "var(--color-onyx-900, #111)",
              marginBottom: "0.75rem",
            }}
          >
            Sei stato invitato
          </h1>
          <p style={{ color: "var(--color-onyx-600, #4b5563)", marginBottom: "0.5rem" }}>
            Unisciti a <strong>{invitation.agency_name}</strong> come{" "}
            <strong>{invitation.role === "agent" ? "Agente" : "Admin"}</strong>
          </p>
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--color-onyx-400, #9ca3af)",
            }}
          >
            {invitation.email}
          </p>
        </div>

        <AcceptInviteForm token={invitation.token} email={invitation.email} />
      </div>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--color-linen, #f5f0ea)",
        padding: "2rem",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          padding: "2.5rem",
          maxWidth: "420px",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</p>
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 600,
            marginBottom: "0.75rem",
            color: "var(--color-onyx-900, #111)",
          }}
        >
          Link non valido
        </h1>
        <p style={{ color: "var(--color-onyx-600, #4b5563)" }}>{message}</p>
      </div>
    </div>
  );
}
