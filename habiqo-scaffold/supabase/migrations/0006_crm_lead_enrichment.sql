-- Optional CRM display fields.
alter table leads
  add column if not exists preferred_property_type text;

alter table leads
  add column if not exists lead_priority text not null default 'medium';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_lead_priority_check'
  ) then
    alter table leads
      add constraint leads_lead_priority_check
      check (lead_priority in ('low', 'medium', 'high', 'critical'));
  end if;
end
$$;

alter type lead_source add value if not exists 'idealista';
alter type lead_source add value if not exists 'facebook';
