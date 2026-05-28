-- ════════════════════════════════════════════════════════════════
-- HABIQUO · 0012_habita_public_layer
-- Public-facing layer for /[agencySlug] (Habita).
-- Additive: no existing RLS or policies are modified.
-- ════════════════════════════════════════════════════════════════

-- ─── 1) AGENCIES: campi pubblici ─────────────────────────────────
alter table public.agencies
  add column if not exists slug text;
alter table public.agencies
  add column if not exists is_public boolean not null default false;
alter table public.agencies
  add column if not exists tagline text;
alter table public.agencies
  add column if not exists description text;
alter table public.agencies
  add column if not exists logo_path text;
alter table public.agencies
  add column if not exists cover_image_path text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'agencies_slug_format_chk') then
    alter table public.agencies
      add constraint agencies_slug_format_chk
      check (slug is null or (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])?$'));
  end if;
end $$;

create unique index if not exists uniq_agencies_slug_ci
  on public.agencies (lower(slug)) where slug is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'agencies_public_requires_slug_chk') then
    alter table public.agencies
      add constraint agencies_public_requires_slug_chk
      check (is_public = false or slug is not null);
  end if;
end $$;

-- ─── 2) PROPERTIES: campi pubblici ───────────────────────────────
alter table public.properties
  add column if not exists slug text;
alter table public.properties
  add column if not exists is_public boolean not null default false;
alter table public.properties
  add column if not exists published_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'properties_slug_format_chk') then
    alter table public.properties
      add constraint properties_slug_format_chk
      check (slug is null or (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,58}[a-z0-9])?$'));
  end if;
end $$;

create unique index if not exists uniq_properties_agency_slug
  on public.properties (agency_id, lower(slug)) where slug is not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'properties_public_requires_slug_chk') then
    alter table public.properties
      add constraint properties_public_requires_slug_chk
      check (is_public = false or slug is not null);
  end if;
end $$;

create or replace function public.trg_properties_stamp_published_at()
returns trigger language plpgsql as $$
begin
  if new.is_public = true and (old is null or old.is_public is distinct from true) then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists trg_properties_published_at on public.properties;
create trigger trg_properties_published_at
  before insert or update of is_public on public.properties
  for each row execute procedure public.trg_properties_stamp_published_at();

create index if not exists idx_properties_public_published
  on public.properties (agency_id, published_at desc nulls last)
  where is_public = true;

-- ─── 3) LEADS: riferimento immobile sorgente ─────────────────────
alter table public.leads
  add column if not exists source_property_id uuid
    references public.properties(id) on delete set null;

create index if not exists idx_leads_source_property
  on public.leads (source_property_id) where source_property_id is not null;

-- ─── 4) RLS: letture pubbliche anonime (additive) ────────────────
-- Le policy esistenti per authenticated NON sono modificate.

-- TODO:
-- Future hardening may replace direct anon table access
-- with dedicated public views or readonly RPCs.

drop policy if exists "agencies_public_anon_select" on public.agencies;
create policy "agencies_public_anon_select"
  on public.agencies for select to anon
  using (is_public = true);

drop policy if exists "properties_public_anon_select" on public.properties;
create policy "properties_public_anon_select"
  on public.properties for select to anon
  using (
    is_public = true
    and exists (
      select 1 from public.agencies a
      where a.id = properties.agency_id and a.is_public = true
    )
  );

-- ─── 5) RPC: submission lead pubblica (anon) ─────────────────────
create or replace function public.submit_public_lead(
  p_agency_id   uuid,
  p_property_id uuid,
  p_full_name   text,
  p_email       text,
  p_phone       text,
  p_message     text
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_lead_id  uuid;
  v_agency   record;
  v_property record;
begin
  if p_full_name is null or char_length(trim(p_full_name)) < 2 then
    raise exception 'ERR_VALIDATION_NAME';
  end if;
  if char_length(p_full_name) > 200 then
    raise exception 'ERR_VALIDATION_NAME_LENGTH';
  end if;
  if (p_email is null or char_length(trim(p_email)) = 0)
     and (p_phone is null or char_length(trim(p_phone)) = 0) then
    raise exception 'ERR_VALIDATION_CONTACT';
  end if;
  if p_message is not null and char_length(p_message) > 4000 then
    raise exception 'ERR_VALIDATION_MESSAGE';
  end if;

  select id, is_public into v_agency from public.agencies where id = p_agency_id;
  if not found or v_agency.is_public is not true then
    raise exception 'ERR_AGENCY_NOT_FOUND';
  end if;

  if p_property_id is not null then
    select id, agency_id, is_public into v_property
    from public.properties where id = p_property_id;
    if not found
       or v_property.agency_id <> p_agency_id
       or v_property.is_public is not true then
      raise exception 'ERR_PROPERTY_NOT_FOUND';
    end if;
  end if;

  insert into public.leads (
    agency_id, full_name, email, phone, status, temperature,
    source, source_detail, source_property_id, notes
  ) values (
    p_agency_id, trim(p_full_name),
    nullif(trim(p_email), ''), nullif(trim(p_phone), ''),
    'new', 'cold', 'website', 'habita',
    p_property_id, nullif(trim(p_message), '')
  )
  returning id into v_lead_id;

  insert into public.lead_events (lead_id, agency_id, type, title, detail, occurred_at)
  values (
    v_lead_id, p_agency_id, 'note', 'Richiesta dal sito web',
    case when p_property_id is not null
      then 'Lead generato da pagina immobile pubblica'
      else 'Lead generato da homepage agenzia pubblica'
    end,
    now()
  );

  return v_lead_id;
end;
$$;

comment on function public.submit_public_lead(uuid, uuid, text, text, text, text) is
  'Habita: anonymous public lead capture. Validates is_public on agency/property. RLS bypassed via SECURITY DEFINER.';

revoke all on function public.submit_public_lead(uuid, uuid, text, text, text, text) from public;
grant execute on function public.submit_public_lead(uuid, uuid, text, text, text, text) to anon, authenticated;
