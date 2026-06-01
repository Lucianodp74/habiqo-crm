-- ════════════════════════════════════════════════════════════════
-- HABIQUO · 0020_pipeline_stages
-- Configurable pipeline stages per agency.
--
-- Design principles:
--   - Opzione B: 6 system stages always exist, cannot be deleted.
--   - Agencies may rename, recolor, reorder system stages.
--   - Agencies may add custom stages (is_system = false).
--   - leads.status (enum) remains the source of truth for DnD.
--     pipeline_stage_id on leads is added in 0021 for future use.
--   - automation_enabled / automation_config prepared for Sprint 2
--     (WhatsApp notifications). No automation logic here.
--   - KPI-ready: created_at, updated_at, sort_order tracked from day 1.
-- ════════════════════════════════════════════════════════════════

-- ─── TABLE ────────────────────────────────────────────────────────
create table if not exists public.pipeline_stages (
  id                 uuid        primary key default gen_random_uuid(),
  agency_id          uuid        not null references public.agencies(id) on delete cascade,

  -- Display
  name               text        not null check (char_length(name) between 1 and 60),
  color              text        not null default '#6B7280'
                                 check (color ~ '^#[0-9A-Fa-f]{6}$'),
  short_label        text        check (char_length(short_label) <= 12),

  -- Ordering
  sort_order         integer     not null default 0,

  -- System vs custom
  is_system          boolean     not null default false,
  -- Maps to lead_status enum value for system stages (e.g. 'new', 'in_negotiation').
  -- NULL for custom stages that don't correspond to an existing enum value.
  status_key         text,

  -- Sprint 2: WhatsApp automation hooks (structure only, no logic yet)
  automation_enabled boolean     not null default false,
  automation_config  jsonb,      -- future: { whatsapp_template_id, delay_minutes, ... }

  -- KPI scaffolding
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ─── INDEXES ──────────────────────────────────────────────────────
create index if not exists idx_pipeline_stages_agency
  on public.pipeline_stages(agency_id);

create index if not exists idx_pipeline_stages_agency_order
  on public.pipeline_stages(agency_id, sort_order);

-- One system stage per status_key per agency (prevents duplicates).
create unique index if not exists uniq_pipeline_stages_system_key
  on public.pipeline_stages(agency_id, status_key)
  where status_key is not null;

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────────
create or replace function public.set_pipeline_stages_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_pipeline_stages_updated_at on public.pipeline_stages;
create trigger trg_pipeline_stages_updated_at
  before update on public.pipeline_stages
  for each row execute function public.set_pipeline_stages_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────
alter table public.pipeline_stages enable row level security;

-- Any member of the agency can read its stages.
create policy "pipeline_stages_select"
  on public.pipeline_stages for select
  using (agency_id in (select public.current_agency_ids()));

-- Only owner/admin can insert.
create policy "pipeline_stages_insert"
  on public.pipeline_stages for insert
  with check (
    agency_id in (select public.current_agency_ids())
    and public.current_role_in(agency_id) in ('owner', 'admin')
  );

-- Owner/admin can update; cannot flip is_system to false on system stages
-- (enforced at application layer — RLS allows update for simplicity).
create policy "pipeline_stages_update"
  on public.pipeline_stages for update
  using (
    agency_id in (select public.current_agency_ids())
    and public.current_role_in(agency_id) in ('owner', 'admin')
  )
  with check (
    agency_id in (select public.current_agency_ids())
    and public.current_role_in(agency_id) in ('owner', 'admin')
  );

-- Only custom stages can be deleted (is_system = false).
create policy "pipeline_stages_delete"
  on public.pipeline_stages for delete
  using (
    is_system = false
    and agency_id in (select public.current_agency_ids())
    and public.current_role_in(agency_id) in ('owner', 'admin')
  );

-- ─── SEED FUNCTION ───────────────────────────────────────────────
-- Inserts the 6 default stages for a given agency.
-- Called by the trigger below AND can be called manually for demo setup.
create or replace function public.seed_default_pipeline_stages(p_agency_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.pipeline_stages
    (agency_id, name, short_label, color, sort_order, is_system, status_key)
  values
    (p_agency_id, 'Nuovo',          'Nuovo',  '#3B82F6', 0, true, 'new'),
    (p_agency_id, 'Qualificato',    'OK',     '#8B5CF6', 1, true, 'qualified'),
    (p_agency_id, 'Visita',         'Visita', '#F59E0B', 2, true, 'visit_scheduled'),
    (p_agency_id, 'Trattativa',     'Tratt.', '#EF4444', 3, true, 'in_negotiation'),
    (p_agency_id, 'Vinto',          'Vinto',  '#10B981', 4, true, 'won'),
    (p_agency_id, 'Perso',          'Perso',  '#6B7280', 5, true, 'lost')
  on conflict (agency_id, status_key) do nothing;
end;
$$;

-- ─── AUTO-SEED TRIGGER ───────────────────────────────────────────
-- Fires after every new agency insert. Works alongside handle_new_user().
create or replace function public.trg_seed_pipeline_stages_for_agency()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_default_pipeline_stages(new.id);
  return new;
end;
$$;

drop trigger if exists on_agency_created_seed_pipeline on public.agencies;
create trigger on_agency_created_seed_pipeline
  after insert on public.agencies
  for each row execute function public.trg_seed_pipeline_stages_for_agency();

-- ─── BACKFILL existing agencies ──────────────────────────────────
-- Any agency already in the DB gets default stages now.
do $$
declare
  r record;
begin
  for r in select id from public.agencies loop
    perform public.seed_default_pipeline_stages(r.id);
  end loop;
end;
$$;

comment on table public.pipeline_stages is
  'Per-agency Kanban stage configuration. System stages map 1:1 to lead_status enum values. Custom stages extend the pipeline without touching the enum.';
comment on column public.pipeline_stages.status_key is
  'For system stages: the lead_status enum value this stage represents (e.g. ''new'', ''in_negotiation''). NULL for custom stages.';
comment on column public.pipeline_stages.automation_enabled is
  'Sprint 2 hook: when true, automation_config describes the WhatsApp action to trigger when a lead enters this stage.';
comment on column public.pipeline_stages.automation_config is
  'Sprint 2 hook: JSONB payload for future automation engine. Schema TBD. Safe to ignore until Sprint 2.';
