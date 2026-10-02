-- ════════════════════════════════════════════════════════════════
-- HABIQUO · 0024_property_featured_flag
-- Permette all'agenzia di scegliere quali immobili mettere in
-- evidenza sulla home pubblica (Hero + sezione "Immobili in
-- evidenza"), invece dell'ordinamento automatico per data di
-- creazione. Prima di questa migration la colonna non esisteva:
-- il codice che la referenziava (apps/web .../agency-hero.tsx)
-- falliva silenziosamente e ricadeva sempre sul più recente.
-- ════════════════════════════════════════════════════════════════

alter table properties
  add column if not exists is_featured boolean not null default false;

comment on column properties.is_featured is
  'Scelto manualmente dall''agenzia per comparire in evidenza sulla home pubblica (Hero + sezione Immobili in evidenza). Non influisce sulla visibilità generale (is_public/status).';

create index if not exists idx_properties_featured
  on properties (agency_id, is_featured)
  where is_featured = true;
