-- Migration: 0013_lead_preferences.sql
-- Aggiunge campi preferenze di ricerca alla tabella leads
-- per il sistema di matching lead <-> immobili

alter table public.leads
  add column if not exists preferred_city         text,
  add column if not exists preferred_listing_type text
    check (preferred_listing_type in (''sale'', ''rent'')),
  add column if not exists preferred_rooms_min    int,
  add column if not exists preferred_sqm_min      int;
