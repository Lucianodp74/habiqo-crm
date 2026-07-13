-- Gestione Multi-Sede
-- Introduce l'entità "Sede" (agency_locations), concettualmente indipendente
-- dal Comune dell'immobile. Relazione: Agency -> AgencyLocation -> Properties.
-- Progettata come funzionalità generica, riutilizzabile da qualsiasi agenzia
-- con una o più sedi, non solo HabitaMi.

create table if not exists agency_locations (
  id          uuid primary key default gen_random_uuid(),
  agency_id   uuid not null references agencies(id) on delete cascade,
  name        text not null,
  status      text not null default 'active' check (status in ('active','inactive')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Evita sedi duplicate con lo stesso nome nella stessa agenzia, e rende
-- il seed sottostante idempotente (safe da rieseguire).
create unique index if not exists uq_agency_locations_agency_name
  on agency_locations(agency_id, name);

create index if not exists idx_agency_locations_agency
  on agency_locations(agency_id, status);

-- properties.agency_location_id: NULLABLE a livello database per garantire
-- compatibilità con gli immobili già esistenti (non deducibile automaticamente
-- dal Comune — principio esplicito di questa funzionalità). Obbligatorietà
-- applicata solo a livello applicativo per le nuove creazioni, e solo per le
-- agenzie che hanno già almeno una sede configurata.
alter table properties
  add column if not exists agency_location_id uuid references agency_locations(id) on delete set null;

create index if not exists idx_properties_location
  on properties(agency_location_id);

comment on column properties.agency_location_id is
  'Sede che gestisce l''immobile. Indipendente dal Comune (city): un immobile a Taranto puo'' essere gestito dalla sede San Giorgio, e viceversa. Nullable per compatibilita'' con immobili pre-esistenti.';

-- ─── RLS — stesso pattern gia' in uso per le altre tabelle scoped agenzia ───
alter table agency_locations enable row level security;

drop policy if exists "agency_locations_select_member" on agency_locations;
create policy "agency_locations_select_member"
  on agency_locations for select
  using (
    agency_id in (select agency_id from agency_members where user_id = auth.uid())
  );

drop policy if exists "agency_locations_write_owner_admin" on agency_locations;
create policy "agency_locations_write_owner_admin"
  on agency_locations for all
  using (
    exists (
      select 1 from agency_members am
      where am.agency_id = agency_locations.agency_id
        and am.user_id = auth.uid()
        and am.role in ('owner','admin')
    )
  )
  with check (
    exists (
      select 1 from agency_members am
      where am.agency_id = agency_locations.agency_id
        and am.user_id = auth.uid()
        and am.role in ('owner','admin')
    )
  );

-- ─── Seed iniziale: due sedi per HabitaMi ───────────────────────────────
-- Tramite slug, non UUID hardcoded — il seed resta portabile e non lega
-- la migration a un'agenzia specifica a livello di codice.
insert into agency_locations (agency_id, name)
select a.id, v.name
from agencies a
cross join (values ('San Giorgio'), ('Taranto')) as v(name)
where a.slug = 'habitami'
on conflict (agency_id, name) do nothing;
