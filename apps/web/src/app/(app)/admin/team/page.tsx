import { getTeamData } from "@/lib/queries/team";
import { redirect } from "next/navigation";
import { InviteAgentForm } from "@/components/admin/invite-agent-form";
import { MembersList } from "@/components/admin/members-list";
import { PendingInvitationsList } from "@/components/admin/pending-invitations-list";

export const metadata = {
  title: "Gestione Team",
  description: "Invita e gestisci gli agenti della tua agenzia",
};

export default async function TeamPage() {
  const team = await getTeamData();

  if (!team) {
    redirect("/dashboard");
  }

  const { members, pendingInvitations } = team;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <header className="mb-10">
        <h1 className="text-3xl font-medium tracking-tight">Gestione Team</h1>
        <p className="mt-2 text-sm text-[var(--color-onyx-600)]">
          Invita nuovi agenti, gestisci ruoli e tieni sotto controllo gli inviti pendenti.
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-medium">Invita un nuovo agente</h2>
        <InviteAgentForm />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-lg font-medium">
          Inviti pendenti
          {pendingInvitations.length > 0 && (
            <span className="ml-2 text-sm text-[var(--color-onyx-600)]">
              ({pendingInvitations.length})
            </span>
          )}
        </h2>
        <PendingInvitationsList invitations={pendingInvitations} />
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">
          Membri attivi
          <span className="ml-2 text-sm text-[var(--color-onyx-600)]">
            ({members.length})
          </span>
        </h2>
        <MembersList members={members} />
      </section>
    </div>
  );
}