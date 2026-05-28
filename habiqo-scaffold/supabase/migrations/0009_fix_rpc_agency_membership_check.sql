-- ════════════════════════════════════════════════════════════════
-- HABIQUO · 0009_fix_rpc_agency_membership_check
-- Membership check inside SECURITY DEFINER must not query agency_members
-- directly: RLS is still evaluated with the invoker session, and the
-- agency_members SELECT policy depends on current_agency_ids(), which can
-- make EXISTS (...) unreliable. Use current_agency_ids() (SECURITY DEFINER,
-- same as all tenant policies) so JWT users see a consistent membership set.
-- ════════════════════════════════════════════════════════════════

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

  if v_agency_id is null then
    raise exception 'ERR_NOT_FOUND';
  end if;

  if not exists (
    select 1
    where v_agency_id in (select public.current_agency_ids())
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
  'CRM: atomically set lead.status and append status_change; tenant check via current_agency_ids().';

revoke all on function public.update_lead_status_with_event(uuid, public.lead_status) from public;
grant execute on function public.update_lead_status_with_event(uuid, public.lead_status) to authenticated;
