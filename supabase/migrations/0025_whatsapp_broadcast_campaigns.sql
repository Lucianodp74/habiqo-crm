-- ════════════════════════════════════════════════════════════════
-- HABIQUO · 0025_whatsapp_broadcast_campaigns
-- Marketing → Broadcast WhatsApp
--
-- Riusa `leads` come unica fonte di contatti (nessuna seconda
-- tabella contatti). La segmentazione per "proprietari in vendita"
-- ecc. si costruisce sui tag già esistenti (leads.tags text[]) e
-- sui campi già presenti (status, preferred_city, ecc.) — nessuna
-- nuova entità "proprietario": non esiste nello schema e non viene
-- introdotta qui.
--
-- Punti chiave dello spec rispettati da questo schema:
--  - campaigns.message è nullable (campo davvero facoltativo, §8)
--  - campaign_recipients salva uno SNAPSHOT dei destinatari al
--    momento della creazione (nome/telefono), indipendente da
--    modifiche successive ai tag del lead (§15)
--  - stato granulare per destinatario: pending/sent/delivered/read/
--    failed/excluded, mai "sent" finché il provider non conferma (§6, §16)
--  - leads.marketing_opt_out: non esisteva alcun campo di consenso/
--    opt-out prima di questa migration (§17)
-- ════════════════════════════════════════════════════════════════

-- ─── 1) Consenso marketing sul lead (riusa l'entità esistente) ───
alter table leads
  add column if not exists marketing_opt_out boolean not null default false;

comment on column leads.marketing_opt_out is
  'Il contatto ha chiesto di non ricevere comunicazioni marketing (es. broadcast WhatsApp). Esclusione obbligatoria da qualsiasi campagna.';

create index if not exists idx_leads_marketing_opt_out
  on leads (agency_id)
  where marketing_opt_out = true;

-- ─── 2) Enum di stato ─────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'campaign_status') then
    create type campaign_status as enum (
      'draft', 'scheduled', 'sending', 'completed', 'failed', 'cancelled'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'campaign_recipient_status') then
    create type campaign_recipient_status as enum (
      'pending', 'sent', 'delivered', 'read', 'failed', 'excluded'
    );
  end if;
end$$;

-- ─── 3) campaigns ─────────────────────────────────────────────────
create table if not exists campaigns (
  id              uuid primary key default gen_random_uuid(),
  agency_id       uuid not null references agencies(id) on delete cascade,
  name            text not null check (char_length(name) between 1 and 200),
  -- Facoltativo per davvero: una campagna "solo locandina" ha message = null.
  message         text,
  attachment_path text,
  attachment_mime text,
  -- Criteri di segmentazione usati per costruire lo snapshot, conservati
  -- per riferimento/audit (non per ri-eseguire la query in futuro).
  audience_filter jsonb not null default '{}'::jsonb,
  status          campaign_status not null default 'draft',
  scheduled_at    timestamptz,
  sent_at         timestamptz,
  created_by      uuid references profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_campaigns_agency_created
  on campaigns (agency_id, created_at desc);

create or replace function trg_campaigns_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_campaigns_updated_at on campaigns;
create trigger trg_campaigns_updated_at
  before update on campaigns
  for each row execute function trg_campaigns_set_updated_at();

-- ─── 4) campaign_recipients (snapshot al momento della creazione) ──
create table if not exists campaign_recipients (
  id                  uuid primary key default gen_random_uuid(),
  campaign_id         uuid not null references campaigns(id) on delete cascade,
  -- on delete set null: se il lead viene cancellato in futuro, lo
  -- storico della campagna resta leggibile grazie allo snapshot sotto.
  lead_id             uuid references leads(id) on delete set null,
  full_name_snapshot  text not null,
  phone_snapshot      text,
  status              campaign_recipient_status not null default 'pending',
  -- Motivo di esclusione quando status = 'excluded' (numero mancante,
  -- opt-out, ecc.) — mostrato prima della conferma di invio (§16).
  exclusion_reason    text,
  provider_message_id text,
  error_message       text,
  sent_at             timestamptz,
  delivered_at        timestamptz,
  read_at             timestamptz,
  created_at          timestamptz not null default now()
);

create index if not exists idx_campaign_recipients_campaign
  on campaign_recipients (campaign_id);
create index if not exists idx_campaign_recipients_status
  on campaign_recipients (campaign_id, status);

-- ─── 5) campaign_templates (messaggi riutilizzabili, §9) ──────────
create table if not exists campaign_templates (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references agencies(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  body        text not null check (char_length(body) between 1 and 4000),
  created_by  uuid references profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_campaign_templates_agency
  on campaign_templates (agency_id, created_at desc);

-- ─── 6) RLS — stesso pattern di tutto il resto dello schema ───────
alter table campaigns           enable row level security;
alter table campaign_recipients enable row level security;
alter table campaign_templates  enable row level security;

drop policy if exists "campaigns_select_own_agency" on campaigns;
create policy "campaigns_select_own_agency"
  on campaigns for select
  using (agency_id in (select current_agency_ids()));

drop policy if exists "campaigns_insert_own_agency" on campaigns;
create policy "campaigns_insert_own_agency"
  on campaigns for insert
  with check (
    agency_id in (select current_agency_ids())
    and current_role_in(agency_id) in ('owner', 'admin', 'agent')
  );

drop policy if exists "campaigns_update_own_agency" on campaigns;
create policy "campaigns_update_own_agency"
  on campaigns for update
  using (
    agency_id in (select current_agency_ids())
    and current_role_in(agency_id) in ('owner', 'admin', 'agent')
  );

drop policy if exists "campaigns_delete_admin_only" on campaigns;
create policy "campaigns_delete_admin_only"
  on campaigns for delete
  using (current_role_in(agency_id) in ('owner', 'admin'));

-- campaign_recipients non ha agency_id diretto: si appoggia a campaigns.
drop policy if exists "campaign_recipients_select_own_agency" on campaign_recipients;
create policy "campaign_recipients_select_own_agency"
  on campaign_recipients for select
  using (
    campaign_id in (
      select id from campaigns where agency_id in (select current_agency_ids())
    )
  );

drop policy if exists "campaign_recipients_insert_own_agency" on campaign_recipients;
create policy "campaign_recipients_insert_own_agency"
  on campaign_recipients for insert
  with check (
    campaign_id in (
      select id from campaigns where agency_id in (select current_agency_ids())
    )
  );

drop policy if exists "campaign_recipients_update_own_agency" on campaign_recipients;
create policy "campaign_recipients_update_own_agency"
  on campaign_recipients for update
  using (
    campaign_id in (
      select id from campaigns where agency_id in (select current_agency_ids())
    )
  );

drop policy if exists "campaign_templates_select_own_agency" on campaign_templates;
create policy "campaign_templates_select_own_agency"
  on campaign_templates for select
  using (agency_id in (select current_agency_ids()));

drop policy if exists "campaign_templates_insert_own_agency" on campaign_templates;
create policy "campaign_templates_insert_own_agency"
  on campaign_templates for insert
  with check (
    agency_id in (select current_agency_ids())
    and current_role_in(agency_id) in ('owner', 'admin', 'agent')
  );

drop policy if exists "campaign_templates_delete_own_agency" on campaign_templates;
create policy "campaign_templates_delete_own_agency"
  on campaign_templates for delete
  using (current_role_in(agency_id) in ('owner', 'admin', 'agent'));

-- ─── 7) Storage: bucket allegati campagna (stesso pattern di property-photos) ──
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'campaign-attachments',
  'campaign-attachments',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "campaign_attachments_public_read" on storage.objects;
create policy "campaign_attachments_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'campaign-attachments');

drop policy if exists "campaign_attachments_authenticated_insert" on storage.objects;
create policy "campaign_attachments_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'campaign-attachments');

drop policy if exists "campaign_attachments_authenticated_update" on storage.objects;
create policy "campaign_attachments_authenticated_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'campaign-attachments')
  with check (bucket_id = 'campaign-attachments');

drop policy if exists "campaign_attachments_authenticated_delete" on storage.objects;
create policy "campaign_attachments_authenticated_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'campaign-attachments');

-- ─── Sanity checks ─────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from storage.buckets where id = 'campaign-attachments') then
    raise exception 'campaign-attachments bucket was not created';
  end if;

  if (
    select count(*) from pg_policy
    where polrelid = 'storage.objects'::regclass
      and polname like 'campaign_attachments_%'
  ) <> 4 then
    raise exception 'Expected 4 campaign_attachments_* policies on storage.objects';
  end if;

  raise notice 'Migration 0025 applied: campaigns schema + storage bucket in place.';
end$$;
