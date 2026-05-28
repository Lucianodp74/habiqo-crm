-- ════════════════════════════════════════════════════════════════
-- HABIQUO · 0001_init
-- Initial schema. Tables, enums, indexes, triggers.
-- RLS policies are in 0002_rls.sql.
-- ════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";
create extension if not exists "postgis";
create extension if not exists "pg_trgm";
create extension if not exists "vector";

-- ─── ENUMS ────────────────────────────────────────────────────────
create type agency_role as enum ('owner', 'admin', 'agent', 'viewer');
create type lead_status as enum ('new', 'qualified', 'in_negotiation', 'won', 'lost');
create type lead_temperature as enum ('cold', 'warm', 'hot');
create type lead_source as enum ('valuation', 'portal', 'manual', 'referral', 'website', 'whatsapp');
create type property_status as enum ('draft', 'active', 'reserved', 'sold', 'archived');
create type property_listing_type as enum ('sale', 'rent');
create type event_type as enum (
  'note', 'call', 'email', 'whatsapp', 'visit', 'view', 'ai_insight', 'status_change'
);

-- ─── AGENCIES ─────────────────────────────────────────────────────
create table agencies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  vat_number    text unique,
  pec_email     text,
  phone         text,
  address       text,
  city          text,
  postal_code   text,
  region        text,
  plan          text not null default 'starter',
  trial_ends_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── PROFILES (1:1 with auth.users) ───────────────────────────────
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text not null,
  avatar_url text,
  phone      text,
  locale     text not null default 'it',
  created_at timestamptz not null default now()
);

create table agency_members (
  agency_id uuid not null references agencies(id) on delete cascade,
  user_id   uuid not null references profiles(id) on delete cascade,
  role      agency_role not null default 'agent',
  joined_at timestamptz not null default now(),
  primary key (agency_id, user_id)
);
create index idx_agency_members_user on agency_members(user_id);

-- ─── LEADS ────────────────────────────────────────────────────────
create table leads (
  id                     uuid primary key default gen_random_uuid(),
  agency_id              uuid not null references agencies(id) on delete cascade,
  assigned_to            uuid references profiles(id) on delete set null,
  full_name              text not null,
  email                  text,
  phone                  text,
  whatsapp               text,
  status                 lead_status not null default 'new',
  temperature            lead_temperature not null default 'cold',
  source                 lead_source not null,
  source_detail          text,
  ai_score               smallint check (ai_score between 0 and 100),
  conversion_probability smallint check (conversion_probability between 0 and 100),
  budget_min_eur         integer,
  budget_max_eur         integer,
  preferred_zones        text[] not null default '{}',
  tags                   text[] not null default '{}',
  notes                  text,
  last_activity_at       timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
create index idx_leads_agency_status   on leads(agency_id, status);
create index idx_leads_agency_assigned on leads(agency_id, assigned_to);
create index idx_leads_search          on leads using gin (full_name gin_trgm_ops, email gin_trgm_ops);
create index idx_leads_last_activity   on leads(agency_id, last_activity_at desc);

-- ─── LEAD EVENTS (timeline) ───────────────────────────────────────
create table lead_events (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  agency_id   uuid not null references agencies(id) on delete cascade,
  type        event_type not null,
  title       text not null,
  detail      text,
  metadata    jsonb not null default '{}',
  actor_id    uuid references profiles(id) on delete set null,
  occurred_at timestamptz not null default now()
);
create index idx_lead_events_lead on lead_events(lead_id, occurred_at desc);

-- ─── LEAD INSIGHTS (AI-generated, denormalized for read speed) ────
create table lead_insights (
  id                   uuid primary key default gen_random_uuid(),
  lead_id              uuid not null unique references leads(id) on delete cascade,
  agency_id            uuid not null references agencies(id) on delete cascade,
  sentiment_score      numeric(3,2),
  sentiment_label      text,
  urgency_level        text check (urgency_level in ('low','medium','high')),
  urgency_detail       text,
  affordability_min    integer,
  affordability_max    integer,
  affordability_basis  text,
  next_action_headline text,
  next_action_reason   text,
  risk_indicators      jsonb not null default '[]',
  model_version        text not null,
  generated_at         timestamptz not null default now()
);

-- ─── PROPERTIES ───────────────────────────────────────────────────
create table properties (
  id              uuid primary key default gen_random_uuid(),
  agency_id       uuid not null references agencies(id) on delete cascade,
  listing_type    property_listing_type not null,
  status          property_status not null default 'draft',
  title           text not null,
  description     text,
  address         text not null,
  city            text not null,
  postal_code     text,
  region          text,
  location        geography(point, 4326),
  price_eur       integer not null,
  rooms           smallint,
  bathrooms       smallint,
  sqm             integer,
  floor           smallint,
  has_elevator    boolean,
  has_garage      boolean,
  energy_class    text,
  cadastral_data  jsonb,
  photos          text[] not null default '{}',
  embedding       vector(1024),
  published_to    text[] not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_properties_agency on properties(agency_id, status);
create index idx_properties_geo    on properties using gist (location);
create index idx_properties_embed  on properties using ivfflat (embedding vector_cosine_ops);

-- ─── LEAD ↔ PROPERTY MATCHES ──────────────────────────────────────
create table property_matches (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  agency_id   uuid not null references agencies(id) on delete cascade,
  similarity  numeric(4,3) not null,
  reasons     text[] not null default '{}',
  computed_at timestamptz not null default now(),
  unique (lead_id, property_id)
);
create index idx_matches_lead on property_matches(lead_id, similarity desc);

-- ─── VALUATIONS ───────────────────────────────────────────────────
create table valuations (
  id            uuid primary key default gen_random_uuid(),
  agency_id     uuid not null references agencies(id) on delete cascade,
  lead_id       uuid references leads(id) on delete set null,
  address       text not null,
  city          text,
  sqm           integer,
  floor         smallint,
  estimated_min integer not null,
  estimated_max integer not null,
  comparables   jsonb not null default '[]',
  trend_12m_pct numeric(5,2),
  pdf_url       text,
  model_version text not null,
  created_at    timestamptz not null default now()
);

-- ─── DOCUMENTS ────────────────────────────────────────────────────
create table documents (
  id             uuid primary key default gen_random_uuid(),
  agency_id      uuid not null references agencies(id) on delete cascade,
  lead_id        uuid references leads(id) on delete set null,
  property_id    uuid references properties(id) on delete set null,
  kind           text not null,
  filename       text not null,
  storage_path   text not null,
  size_bytes     bigint,
  extracted_data jsonb,
  created_at     timestamptz not null default now()
);

-- ─── AI ACTIONS LOG (audit + cost) ────────────────────────────────
create table ai_actions_log (
  id             uuid primary key default gen_random_uuid(),
  agency_id      uuid not null references agencies(id) on delete cascade,
  user_id        uuid references profiles(id) on delete set null,
  trace_id       text,
  task           text not null,
  prompt_version text,
  model          text not null,
  tier           text,
  input_tokens   integer,
  output_tokens  integer,
  cost_eur       numeric(10,6),
  duration_ms    integer,
  status         text not null,
  error          text,
  created_at     timestamptz not null default now()
);
create index idx_ai_log_agency_date on ai_actions_log(agency_id, created_at desc);

-- ─── UPDATED_AT TRIGGERS ──────────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_agencies_updated_at  before update on agencies   for each row execute function set_updated_at();
create trigger trg_leads_updated_at     before update on leads      for each row execute function set_updated_at();
create trigger trg_properties_updated_at before update on properties for each row execute function set_updated_at();
