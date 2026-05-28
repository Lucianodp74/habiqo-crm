-- ════════════════════════════════════════════════════════════════
-- HABIQUO · 0008_update_lead_status_rpc
-- Atomic lead status change + timeline event, with explicit
-- agency membership checks (SECURITY DEFINER; RLS remains on tables
-- for all direct client access).
-- ════════════════════════════════════════════════════════════════

-- Explicit WITH CHECK mirrors USING so updated rows stay in-member agencies.
drop policy if exists "leads_update_own_agency" on leads;

create policy "leads_update_own_agency"
  on leads for update
  using (agency_id in (select current_agency_ids()))
  with check (agency_id in (select current_agency_ids()));

create or replace function public.update_lead_status_with_event(
  p_lead_id uuid,
  p_new_status public.lead_status
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_agency_id uuid;
  v_prev public.lead_status;
begin
  if auth.uid() is null then
    raise exception 'ERR_AUTH';
  end if;

  select l.agency_id, l.status
  into v_agency_id, v_prev
  from public.leads l
  where l.id = p_lead_id
  for update;

  if not found then
    raise exception 'ERR_NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.agency_members m
    where m.user_id = auth.uid()
      and m.agency_id = v_agency_id
  ) then
    raise exception 'ERR_FORBIDDEN';
  end if;

  update public.leads
  set status = p_new_status
  where id = p_lead_id;

  if v_prev is distinct from p_new_status then
    insert into public.lead_events (
      lead_id,
      agency_id,
      type,
      title,
      detail,
      actor_id,
      occurred_at
    )
    values (
      p_lead_id,
      v_agency_id,
      'status_change',
      'Stato aggiornato',
      v_prev::text || ' → ' || p_new_status::text,
      auth.uid(),
      now()
    );
  end if;
end;
$$;

comment on function public.update_lead_status_with_event(uuid, public.lead_status) is
  'CRM: atomically set lead.status and append status_change to lead_events; enforces agency membership.';

revoke all on function public.update_lead_status_with_event(uuid, public.lead_status) from public;
grant execute on function public.update_lead_status_with_event(uuid, public.lead_status) to authenticated;
