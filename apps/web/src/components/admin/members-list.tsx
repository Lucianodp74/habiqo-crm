import type { TeamMember } from "@/lib/queries/team";

type MembersListProps = {
  members: TeamMember[];
};

function formatJoinedDate(iso: string): string {
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat("it-IT", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "data non disponibile";
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? "").toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}

function RoleBadge({ role }: { role: "owner" | "agent" }) {
  const isOwner = role === "owner";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isOwner
          ? "bg-[var(--color-onyx-900)] text-[var(--color-surface)]"
          : "bg-[var(--color-onyx-100)] text-[var(--color-onyx-700)]"
      }`}
    >
      {isOwner ? "Admin" : "Agente"}
    </span>
  );
}

export function MembersList({ members }: MembersListProps) {
  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-onyx-200)] bg-[var(--color-surface)] px-6 py-8 text-center">
        <p className="text-sm text-[var(--color-onyx-600)]">
          Nessun membro nel team.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-onyx-200)] bg-[var(--color-surface)]">
      <ul className="divide-y divide-[var(--color-onyx-200)]">
        {members.map((member) => (
          <li
            key={member.userId}
            className="flex items-center gap-4 px-6 py-4"
          >
            {/* Avatar */}
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[var(--color-onyx-200)]">
              {member.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.avatarUrl}
                  alt={member.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-sm font-medium text-[var(--color-onyx-700)]">
                  {getInitials(member.fullName)}
                </span>
              )}
            </div>

            {/* Name + role */}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <p className="truncate text-sm font-medium text-[var(--color-onyx-900)]">
                {member.fullName}
              </p>
              <RoleBadge role={member.role} />
            </div>

            {/* Joined date */}
            <p className="shrink-0 text-xs text-[var(--color-onyx-600)]">
              dal {formatJoinedDate(member.joinedAt)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
