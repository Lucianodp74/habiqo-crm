-- ════════════════════════════════════════════════════════════════
-- HABIQO · 0003_auth_triggers
-- Auto-provision profile + agency on signup.
-- The first user becomes the owner of a new "personal" agency;
-- they can rename it later or be invited into another one.
-- ════════════════════════════════════════════════════════════════

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_agency_id uuid;
  v_full_name text;
  v_agency_name text;
begin
  v_full_name := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  v_agency_name := coalesce(new.raw_user_meta_data ->> 'agency_name', v_full_name || ' — Agenzia');

  insert into profiles (id, full_name, locale)
  values (new.id, v_full_name, 'it');

  insert into agencies (name, plan, trial_ends_at)
  values (v_agency_name, 'starter', now() + interval '14 days')
  returning id into v_agency_id;

  insert into agency_members (agency_id, user_id, role)
  values (v_agency_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Default agency_id on lead_events from leads.agency_id (avoids requiring
-- the client to know the agency_id).
create or replace function fill_lead_event_agency_id()
returns trigger
language plpgsql
as $$
begin
  if new.agency_id is null then
    select agency_id into new.agency_id from leads where id = new.lead_id;
  end if;
  return new;
end;
$$;

create trigger trg_lead_events_fill_agency
  before insert on lead_events
  for each row execute function fill_lead_event_agency_id();
