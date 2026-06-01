-- ════════════════════════════════════════════════════════════════
-- HABIQUO · 0021_leads_pipeline_stage
-- Adds pipeline_stage_id to leads.
--
-- Strategy: additive only.
--   - leads.status (lead_status enum) remains the canonical field.
--   - pipeline_stage_id is nullable; NULL means "use status fallback".
--   - No existing queries, RPCs, or RLS policies are touched.
--   - The board reads pipeline_stage_id only when non-null; otherwise
--     falls back to statusToColumnId(leads.status) as before.
-- ════════════════════════════════════════════════════════════════

alter table public.leads
  add column if not exists pipeline_stage_id uuid
    references public.pipeline_stages(id) on delete set null;

-- Index for efficient "all leads in stage X" queries (future analytics).
create index if not exists idx_leads_pipeline_stage
  on public.leads(pipeline_stage_id)
  where pipeline_stage_id is not null;

-- Index for "all leads in agency X by stage" (dashboard widgets).
create index if not exists idx_leads_agency_pipeline_stage
  on public.leads(agency_id, pipeline_stage_id)
  where pipeline_stage_id is not null;

comment on column public.leads.pipeline_stage_id is
  'Optional reference to a configurable pipeline_stages row. When NULL the board falls back to leads.status for column placement. Populated progressively as agencies configure their pipeline.';
