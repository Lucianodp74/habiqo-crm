-- ════════════════════════════════════════════════════════════════
-- HABIQUO · 0002_rls
-- Row-Level Security. The lock at the data layer.
-- Application code is the door; RLS is the lock.
-- ════════════════════════════════════════════════════════════════

-- Helper: agencies the current user belongs to.
-- security definer because it's called from RLS policy expressions
-- where the calling user wouldn't otherwise have access.
create or replace function current_agency_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select agency_id from agency_members where user_id = auth.uid();
$$;

-- Helper: role of the current user within a given agency.
create or replace function current_role_in(p_agency_id uuid)
returns agency_role
language sql
stable
security definer
set search_path = public, auth
as $$
  select role from agency_members
  where user_id = auth.uid() and agency_id = p_agency_id
  limit 1;
$$;

-- ─── ENABLE RLS ──────────────────────────────────────────────────
alter table agencies         enable row level security;
alter table profiles         enable row level security;
alter table agency_members   enable row level security;
alter table leads            enable row level security;
alter table lead_events      enable row level security;
alter table lead_insights    enable row level security;
alter table properties       enable row level security;
alter table property_matches enable row level security;
alter table valuations       enable row level security;
alter table documents        enable row level security;
alter table ai_actions_log   enable row level security;

-- ─── PROFILES ────────────────────────────────────────────────────
-- Users can see/edit their own profile, plus profiles of teammates.
create policy "profiles_select_self_or_teammate"
  on profiles for select
  using (
    id = auth.uid()
    or exists (
      select 1 from agency_members am1
      join agency_members am2 on am1.agency_id = am2.agency_id
      where am1.user_id = auth.uid() and am2.user_id = profiles.id
    )
  );

create policy "profiles_update_self"
  on profiles for update
  using (id = auth.uid());

create policy "profiles_insert_self"
  on profiles for insert
  with check (id = auth.uid());

-- ─── AGENCIES ────────────────────────────────────────────────────
create policy "agencies_select_member"
  on agencies for select
  using (id in (select current_agency_ids()));

create policy "agencies_update_admin"
  on agencies for update
  using (current_role_in(id) in ('owner', 'admin'));

-- Agency creation is gated through a server action that uses the service role.
-- No public insert policy.

-- ─── AGENCY MEMBERS ──────────────────────────────────────────────
create policy "agency_members_select_own"
  on agency_members for select
  using (agency_id in (select current_agency_ids()));

create policy "agency_members_modify_admin"
  on agency_members for all
  using (current_role_in(agency_id) in ('owner', 'admin'))
  with check (current_role_in(agency_id) in ('owner', 'admin'));

-- ─── LEADS ───────────────────────────────────────────────────────
create policy "leads_select_own_agency"
  on leads for select
  using (agency_id in (select current_agency_ids()));

create policy "leads_insert_own_agency"
  on leads for insert
  with check (agency_id in (select current_agency_ids()));

create policy "leads_update_own_agency"
  on leads for update
  using (agency_id in (select current_agency_ids()));

create policy "leads_delete_admin_only"
  on leads for delete
  using (current_role_in(agency_id) in ('owner', 'admin'));

-- ─── LEAD EVENTS / INSIGHTS / MATCHES ────────────────────────────
create policy "lead_events_select_own_agency" on lead_events for select
  using (agency_id in (select current_agency_ids()));
create policy "lead_events_insert_own_agency" on lead_events for insert
  with check (agency_id in (select current_agency_ids()));

create policy "lead_insights_select_own_agency" on lead_insights for select
  using (agency_id in (select current_agency_ids()));
create policy "lead_insights_modify_own_agency" on lead_insights for all
  using (agency_id in (select current_agency_ids()))
  with check (agency_id in (select current_agency_ids()));

create policy "property_matches_select_own_agency" on property_matches for select
  using (agency_id in (select current_agency_ids()));
create policy "property_matches_modify_own_agency" on property_matches for all
  using (agency_id in (select current_agency_ids()))
  with check (agency_id in (select current_agency_ids()));

-- ─── PROPERTIES ──────────────────────────────────────────────────
create policy "properties_select_own_agency" on properties for select
  using (agency_id in (select current_agency_ids()));
create policy "properties_insert_own_agency" on properties for insert
  with check (agency_id in (select current_agency_ids()));
create policy "properties_update_own_agency" on properties for update
  using (agency_id in (select current_agency_ids()));
create policy "properties_delete_admin_only" on properties for delete
  using (current_role_in(agency_id) in ('owner', 'admin'));

-- ─── VALUATIONS / DOCUMENTS ──────────────────────────────────────
create policy "valuations_select_own_agency" on valuations for select
  using (agency_id in (select current_agency_ids()));
create policy "valuations_insert_own_agency" on valuations for insert
  with check (agency_id in (select current_agency_ids()));

create policy "documents_select_own_agency" on documents for select
  using (agency_id in (select current_agency_ids()));
create policy "documents_insert_own_agency" on documents for insert
  with check (agency_id in (select current_agency_ids()));
create policy "documents_delete_admin" on documents for delete
  using (current_role_in(agency_id) in ('owner', 'admin'));

-- ─── AI ACTIONS LOG ──────────────────────────────────────────────
-- Read: admins only (cost data is sensitive).
-- Write: typically via service-role from server actions; public insert disabled.
create policy "ai_log_select_admin" on ai_actions_log for select
  using (current_role_in(agency_id) in ('owner', 'admin'));
