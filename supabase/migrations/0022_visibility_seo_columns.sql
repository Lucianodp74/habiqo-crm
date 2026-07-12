-- Visibility Engine V1 — Sprint 1
-- Aggiunge colonne SEO dirette a properties e agencies,
-- seguendo il pattern già esistente con properties.seo_title.
-- Nessuna nuova tabella: coerente con l'architettura FK-diretta del progetto.

alter table properties
  add column if not exists seo_description text,
  add column if not exists seo_status text not null default 'generated'
    check (seo_status in ('generated', 'manual'));

alter table agencies
  add column if not exists seo_description text,
  add column if not exists seo_status text not null default 'generated'
    check (seo_status in ('generated', 'manual'));

comment on column properties.seo_description is
  'Meta description SEO. Se seo_status=manual, non va mai sovrascritta da rigenerazione automatica.';
comment on column agencies.seo_description is
  'Meta description SEO per la pagina pubblica agenzia. Stesso comportamento di properties.seo_description.';
