-- ════════════════════════════════════════════════════════════════
-- HABIQO · 0011_agency_invitations
-- Tabella per gestire gli inviti di nuovi agenti a un'agenzia.
-- L'admin invia un invito → sistema genera token → l'invitato apre
-- il link → fa signup → viene aggiunto come membro.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.agency_invitations (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  email         text not null,
  role          text not null default 'agent' check (role in ('agent', 'admin')),
  token         text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by    uuid not null references auth.users(id),
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at    timestamptz not null default (now() + interval '7 days'),
  accepted_at   timestamptz,
  accepted_by   uuid references auth.users(id),
  created_at    timestamptz not null default now()
);

-- Indici utili
create index if not exists idx_invitations_agency on public.agency_invitations(agency_id);
create index if not exists idx_invitations_email on public.agency_invitations(email);
create index if not exists idx_invitations_token on public.agency_invitations(token);
create index if not exists idx_invitations_status on public.agency_invitations(status);

-- Constraint: una stessa email può avere un solo invito 'pending' per agenzia
create unique index if not exists uniq_invitations_pending
  on public.agency_invitations(agency_id, lower(email))
  where status = 'pending';

-- Enable RLS
alter table public.agency_invitations enable row level security;

-- Policy: gli admin di un'agenzia possono leggere/scrivere gli inviti della loro agenzia
create policy "admins_manage_invitations"
  on public.agency_invitations
  for all
  using (
    exists (
      select 1 from public.agency_members am
      where am.agency_id = agency_invitations.agency_id
        and am.user_id = auth.uid()
        and am.role = 'owner'
    )
  )
  with check (
    exists (
      select 1 from public.agency_members am
      where am.agency_id = agency_invitations.agency_id
        and am.user_id = auth.uid()
        and am.role = 'owner'
    )
  );

-- Policy: chiunque (anche non autenticato) può LEGGERE un invito by token
-- (necessario per la pagina "/accept-invite?token=..." che valida il token prima del signup)
create policy "anyone_reads_invitation_by_token"
  on public.agency_invitations
  for select
  using (true);

-- GRANTs
grant select on public.agency_invitations to anon, authenticated;
grant insert, update, delete on public.agency_invitations to authenticated;