-- ════════════════════════════════════════════════════════════════
-- HABIQO · 0007_crm_extensions_schema
-- CRM: extend lead_events + leads; add lead_notes + lead_activities.
-- Idempotent where possible (IF NOT EXISTS / guarded DO blocks).
-- ════════════════════════════════════════════════════════════════

-- ─── 1) lead_events: alias columns requested by API contracts ───
-- Existing canonical columns remain: detail, actor_id, occurred_at (0001_init).

alter table lead_events
  add column if not exists description text;

alter table lead_events
  add column if not exists created_at timestamptz;

alter table lead_events
  add column if not exists created_by uuid references profiles(id) on delete set null;

update lead_events
set
  description = coalesce(description, detail),
  created_at = coalesce(created_at, occurred_at),
  created_by = coalesce(created_by, actor_id)
where description is null
   or created_at is null
   or created_by is null;

alter table lead_events
  alter column created_at set default now();

update lead_events set created_at = occurred_at where created_at is null;

alter table lead_events
  alter column created_at set not null;

create index if not exists idx_lead_events_created_at on lead_events (created_at desc);

create index if not exists idx_lead_events_created_by on lead_events (created_by)
  where created_by is not null;

create index if not exists idx_lead_events_agency_created on lead_events (agency_id, created_at desc);

comment on column lead_events.description is 'Alias for detail; kept in sync by trigger.';
comment on column lead_events.created_at is 'Alias timeline for occurred_at; kept in sync by trigger.';
comment on column lead_events.created_by is 'Alias for actor_id; kept in sync by trigger.';

create or replace function public.trg_lead_events_sync_alias_columns()
returns trigger
language plpgsql
as $$
begin
  new.detail := coalesce(new.detail, new.description);
  new.description := coalesce(new.description, new.detail);
  new.actor_id := coalesce(new.actor_id, new.created_by);
  new.created_by := coalesce(new.created_by, new.actor_id);
  new.occurred_at := coalesce(new.occurred_at, new.created_at);
  new.created_at := coalesce(new.created_at, new.occurred_at);
  return new;
end;
$$;

drop trigger if exists trg_lead_events_sync_aliases on lead_events;

create trigger trg_lead_events_sync_aliases
  before insert or update on lead_events
  for each row
  execute procedure public.trg_lead_events_sync_alias_columns();

-- ─── 2) lead_notes (dedicated notes table; events timeline may still use lead_events) ───

create table if not exists lead_notes (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  agency_id   uuid not null references agencies(id) on delete cascade,
  note        text not null,
  created_at  timestamptz not null default now(),
  created_by  uuid references profiles(id) on delete set null,
  constraint lead_notes_note_body_chk check (
    char_length(trim(note)) > 0
    and char_length(note) <= 16000
  )
);

create index if not exists idx_lead_notes_lead_created on lead_notes (lead_id, created_at desc);
create index if not exists idx_lead_notes_agency on lead_notes (agency_id);
create index if not exists idx_lead_notes_created_by on lead_notes (created_by)
  where created_by is not null;

comment on table lead_notes is 'Timestamped agent notes; parallel to type=note on lead_events if used.';

-- ─── 3) lead_activities (generic activity stream with JSON payload) ───

create table if not exists lead_activities (
  id             uuid primary key default gen_random_uuid(),
  lead_id        uuid not null references leads(id) on delete cascade,
  agency_id      uuid not null references agencies(id) on delete cascade,
  activity_type  text not null check (char_length(trim(activity_type)) > 0),
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  constraint lead_activities_type_len check (char_length(activity_type) <= 128)
);

create index if not exists idx_lead_activities_lead_created on lead_activities (lead_id, created_at desc);
create index if not exists idx_lead_activities_agency on lead_activities (agency_id);
create index if not exists idx_lead_activities_metadata on lead_activities using gin (metadata);
create index if not exists idx_lead_activities_type on lead_activities (activity_type);

comment on table lead_activities is 'Structured CRM activities (type + metadata), distinct from lead_events timeline.';

-- ─── 4) leads: requested CRM columns (source already exists on leads) ───

alter table leads
  add column if not exists priority text;

alter table leads
  add column if not exists preferred_city text;

alter table leads
  add column if not exists property_type text;

alter table leads
  add column if not exists urgency_level text;

alter table leads
  add column if not exists last_contact_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'leads_priority_level_chk'
  ) then
    alter table leads
      add constraint leads_priority_level_chk
      check (
        priority is null or priority in ('low', 'medium', 'high', 'critical')
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'leads_urgency_level_chk'
  ) then
    alter table leads
      add constraint leads_urgency_level_chk
      check (
        urgency_level is null or urgency_level in ('low', 'medium', 'high')
      );
  end if;
end
$$;

-- Backfill priority from lead_priority (0006) when present
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'lead_priority'
  ) then
    execute $u$
      update leads
      set priority = coalesce(priority, lead_priority)
      where priority is null and lead_priority is not null
    $u$;
  end if;
end
$$;

update leads set priority = coalesce(priority, 'medium') where priority is null;

-- Align property_type with preferred_property_type when present
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'preferred_property_type'
  ) then
    execute $u$
      update leads
      set property_type = coalesce(property_type, preferred_property_type)
      where property_type is null and preferred_property_type is not null
    $u$;
  end if;
end
$$;

update leads
set last_contact_at = coalesce(last_contact_at, last_activity_at)
where last_contact_at is null;

create index if not exists idx_leads_agency_priority on leads (agency_id, priority)
  where priority is not null;

create index if not exists idx_leads_preferred_city on leads (agency_id, preferred_city)
  where preferred_city is not null;

create index if not exists idx_leads_property_type on leads (agency_id, property_type)
  where property_type is not null;

create index if not exists idx_leads_last_contact on leads (agency_id, last_contact_at desc)
  where last_contact_at is not null;

comment on column leads.source is 'Lead acquisition channel (lead_source enum); present since 0001_init.';
comment on column leads.priority is 'CRM priority; synced with lead_priority when that column exists.';
comment on column leads.preferred_city is 'Primary city preference; complements preferred_zones[].';
comment on column leads.property_type is 'Requested property typology; may mirror preferred_property_type.';
comment on column leads.urgency_level is 'Business urgency on the lead row (distinct from AI lead_insights).';
comment on column leads.last_contact_at is 'Last meaningful touchpoint; mirrors last_activity_at when unset.';

-- Keep priority ↔ lead_priority aligned (only when lead_priority exists from 0006)
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'leads'
      and column_name = 'lead_priority'
  ) then
    create or replace function public.trg_leads_sync_priority_columns()
    returns trigger
    language plpgsql
    as $f$
    begin
      if new.priority is null and new.lead_priority is not null then
        new.priority := new.lead_priority;
      elsif new.lead_priority is null and new.priority is not null then
        new.lead_priority := new.priority;
      elsif new.priority is not null
        and new.lead_priority is not null
        and new.priority is distinct from new.lead_priority then
        new.lead_priority := new.priority;
      end if;
      return new;
    end;
    $f$;

    drop trigger if exists trg_leads_sync_priority on leads;

    create trigger trg_leads_sync_priority
      before insert or update on leads
      for each row
      execute procedure public.trg_leads_sync_priority_columns();
  end if;
end
$$;

-- ─── 5) RLS for new tables ───

alter table lead_notes enable row level security;
alter table lead_activities enable row level security;

drop policy if exists "lead_notes_select_own_agency" on lead_notes;
create policy "lead_notes_select_own_agency"
  on lead_notes for select
  using (agency_id in (select current_agency_ids()));

drop policy if exists "lead_notes_insert_own_agency" on lead_notes;
create policy "lead_notes_insert_own_agency"
  on lead_notes for insert
  with check (agency_id in (select current_agency_ids()));

drop policy if exists "lead_notes_update_own_agency" on lead_notes;
create policy "lead_notes_update_own_agency"
  on lead_notes for update
  using (agency_id in (select current_agency_ids()));

drop policy if exists "lead_notes_delete_admin_only" on lead_notes;
create policy "lead_notes_delete_admin_only"
  on lead_notes for delete
  using (current_role_in(agency_id) in ('owner', 'admin'));

drop policy if exists "lead_activities_select_own_agency" on lead_activities;
create policy "lead_activities_select_own_agency"
  on lead_activities for select
  using (agency_id in (select current_agency_ids()));

drop policy if exists "lead_activities_insert_own_agency" on lead_activities;
create policy "lead_activities_insert_own_agency"
  on lead_activities for insert
  with check (agency_id in (select current_agency_ids()));

drop policy if exists "lead_activities_update_own_agency" on lead_activities;
create policy "lead_activities_update_own_agency"
  on lead_activities for update
  using (agency_id in (select current_agency_ids()));

drop policy if exists "lead_activities_delete_admin_only" on lead_activities;
create policy "lead_activities_delete_admin_only"
  on lead_activities for delete
  using (current_role_in(agency_id) in ('owner', 'admin'));
