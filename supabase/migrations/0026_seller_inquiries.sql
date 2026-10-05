-- ════════════════════════════════════════════════════════════════
-- HABIQUO · 0026_seller_inquiries
-- Richieste di vendita dal sito pubblico (case, terreni, altro)
--
-- Contesto: la tabella `valuation_requests` e la funzione
-- `submit_valuation_request` esistono già sul DB di produzione ma non
-- erano nei file di migration, e nessuna pagina del CRM leggeva la
-- tabella. Questa migration:
--  - mette la tabella sotto controllo di versione (create if not exists:
--    se esiste già, non cambia nulla)
--  - aggiunge i campi di consenso
--  - NON sovrascrive la funzione esistente: crea una nuova RPC
--    `submit_seller_inquiry` che crea (o riusa) il lead, lo marca
--    "Proprietario" e collega la richiesta
--  - permette ai membri dell'agenzia di leggere le richieste (RLS)
--  - marca come "Proprietario" i lead già arrivati da richieste esistenti
-- ════════════════════════════════════════════════════════════════

-- ─── 1) Tabella (no-op se esiste già) ─────────────────────────────
create table if not exists public.valuation_requests (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references public.agencies(id) on delete cascade,
  lead_id       uuid references public.leads(id) on delete set null,
  property_type text not null,
  city          text not null,
  area          text,
  sqm           integer,
  rooms         integer,
  bathrooms     integer,
  floor         integer,
  condition     text,
  full_name     text not null,
  phone         text not null,
  email         text,
  notes         text,
  status        text not null default 'new',
  created_at    timestamptz not null default now()
);

alter table public.valuation_requests
  add column if not exists consent_marketing boolean not null default false;

create index if not exists idx_valuation_requests_agency_created
  on public.valuation_requests (agency_id, created_at desc);
create index if not exists idx_valuation_requests_lead
  on public.valuation_requests (lead_id);

-- Data in cui il contatto ha dato il consenso marketing dal sito.
alter table public.leads
  add column if not exists marketing_consent_at timestamptz;

comment on column public.leads.marketing_consent_at is
  'Quando il contatto ha spuntato il consenso a ricevere comunicazioni marketing dal sito pubblico. Null = nessun consenso esplicito registrato.';

-- ─── 2) RLS: lettura per i membri dell'agenzia ────────────────────
alter table public.valuation_requests enable row level security;

drop policy if exists "valuation_requests_select_own_agency" on public.valuation_requests;
create policy "valuation_requests_select_own_agency"
  on public.valuation_requests for select
  using (agency_id in (select current_agency_ids()));

drop policy if exists "valuation_requests_update_own_agency" on public.valuation_requests;
create policy "valuation_requests_update_own_agency"
  on public.valuation_requests for update
  using (
    agency_id in (select current_agency_ids())
    and current_role_in(agency_id) in ('owner', 'admin', 'agent')
  );

-- ─── 3) RPC: richiesta di vendita dal sito (anon) ─────────────────
create or replace function public.submit_seller_inquiry(
  p_agency_id         uuid,
  p_property_type     text,
  p_city              text,
  p_full_name         text,
  p_phone             text,
  p_email             text    default null,
  p_area              text    default null,
  p_sqm               integer default null,
  p_rooms             integer default null,
  p_bathrooms         integer default null,
  p_floor             integer default null,
  p_condition         text    default null,
  p_notes             text    default null,
  p_consent_marketing boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_agency     record;
  v_lead_id    uuid;
  v_request_id uuid;
  v_label      text;
  v_tags       text[];
  v_phone      text := nullif(trim(p_phone), '');
  v_email      text := nullif(lower(trim(p_email)), '');
begin
  if p_full_name is null or char_length(trim(p_full_name)) < 2
     or char_length(p_full_name) > 200 then
    raise exception 'ERR_VALIDATION_NAME';
  end if;
  if v_phone is null or char_length(v_phone) > 40 then
    raise exception 'ERR_VALIDATION_PHONE';
  end if;
  if p_city is null or char_length(trim(p_city)) = 0
     or char_length(p_city) > 200 then
    raise exception 'ERR_VALIDATION_CITY';
  end if;
  if p_notes is not null and char_length(p_notes) > 4000 then
    raise exception 'ERR_VALIDATION_NOTES';
  end if;
  if p_property_type not in ('apartment', 'villa', 'office', 'commercial', 'land') then
    raise exception 'ERR_VALIDATION_PROPERTY_TYPE';
  end if;

  select id, is_public into v_agency from public.agencies where id = p_agency_id;
  if not found or v_agency.is_public is not true then
    raise exception 'ERR_AGENCY_NOT_FOUND';
  end if;

  v_label := case p_property_type
    when 'apartment'  then 'Appartamento'
    when 'villa'      then 'Villa / Casa'
    when 'office'     then 'Ufficio'
    when 'commercial' then 'Commerciale'
    when 'land'       then 'Terreno'
  end;

  -- Tag usati dalla segmentazione dei broadcast WhatsApp.
  v_tags := array['Proprietario', 'Vende ' || lower(v_label)];

  -- Evita duplicati: stesso telefono (o stessa email) nella stessa agenzia.
  select id into v_lead_id
  from public.leads
  where agency_id = p_agency_id
    and (phone = v_phone or (v_email is not null and lower(email) = v_email))
  order by created_at asc
  limit 1;

  if v_lead_id is null then
    insert into public.leads (
      agency_id, full_name, email, phone, status, temperature,
      source, source_detail, tags, notes, last_activity_at
    ) values (
      p_agency_id, trim(p_full_name), v_email, v_phone,
      'new', 'warm',
      'valuation', 'habita-vendi',
      v_tags, nullif(trim(p_notes), ''), now()
    )
    returning id into v_lead_id;
  else
    -- Lead già presente: aggiunge i tag senza duplicarli.
    update public.leads
    set tags = (
          select coalesce(array_agg(distinct t), '{}')
          from unnest(coalesce(tags, '{}') || v_tags) as t
        ),
        last_activity_at = now()
    where id = v_lead_id;
  end if;

  if p_consent_marketing then
    update public.leads
    set marketing_consent_at = now()
    where id = v_lead_id and marketing_consent_at is null;
  end if;

  insert into public.valuation_requests (
    agency_id, lead_id, property_type, city, area, sqm, rooms, bathrooms,
    floor, condition, full_name, phone, email, notes, consent_marketing
  ) values (
    p_agency_id, v_lead_id, p_property_type, trim(p_city),
    nullif(trim(p_area), ''), p_sqm, p_rooms, p_bathrooms, p_floor,
    nullif(trim(p_condition), ''), trim(p_full_name), v_phone, v_email,
    nullif(trim(p_notes), ''), coalesce(p_consent_marketing, false)
  )
  returning id into v_request_id;

  insert into public.lead_events (lead_id, agency_id, type, title, detail, occurred_at)
  values (
    v_lead_id, p_agency_id, 'note', 'Richiesta di vendita dal sito web',
    v_label || ' a ' || trim(p_city)
      || case when p_sqm is not null then ' · ' || p_sqm || ' mq' else '' end,
    now()
  );

  return v_request_id;
end;
$$;

comment on function public.submit_seller_inquiry is
  'Habita: richiesta di vendita/valutazione dal sito pubblico (anon). Crea o riusa il lead, aggiunge i tag Proprietario, collega la richiesta. SECURITY DEFINER.';

revoke all on function public.submit_seller_inquiry from public;
grant execute on function public.submit_seller_inquiry to anon, authenticated;

-- ─── 4) Backfill: lead già arrivati da richieste di valutazione ───
update public.leads l
set tags = (
  select coalesce(array_agg(distinct t), '{}')
  from unnest(coalesce(l.tags, '{}') || array['Proprietario']) as t
)
where l.id in (
  select lead_id from public.valuation_requests where lead_id is not null
);

-- ─── Sanity check ──────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'submit_seller_inquiry'
  ) then
    raise exception 'submit_seller_inquiry was not created';
  end if;
  raise notice 'Migration 0026 applied: seller inquiries ready.';
end$$;
