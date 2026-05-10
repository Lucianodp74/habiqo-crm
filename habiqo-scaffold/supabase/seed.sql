-- ════════════════════════════════════════════════════════════════
-- HABIQUO · seed
-- Local dev seed. Inserts a demo agency + leads when run against
-- a fresh local Supabase.
--
-- Run after creating a test user via the Supabase dashboard:
--   1. Sign up at http://localhost:3000/registrazione
--   2. The auth trigger creates profile + agency automatically
--   3. Then run this seed to add leads:
--      psql -f supabase/seed.sql
-- ════════════════════════════════════════════════════════════════

do $$
declare
  v_agency_id uuid;
begin
  -- Pick the first agency for the demo
  select id into v_agency_id from agencies order by created_at desc limit 1;
  if v_agency_id is null then
    raise notice 'No agency found. Sign up first.';
    return;
  end if;

  insert into leads (
    agency_id, full_name, email, phone, status, temperature,
    source, ai_score, conversion_probability,
    budget_min_eur, budget_max_eur, preferred_zones, tags,
    last_activity_at
  ) values
    (v_agency_id, 'Marco Bianchi', 'marco.bianchi@email.it', '+393331245678',
     'in_negotiation', 'hot', 'valuation', 87, 73,
     420000, 480000, array['Brera', 'Porta Venezia', 'Isola'],
     array['Prima casa', 'Mutuo pre-approvato', 'Famiglia 2 figli'],
     now() - interval '2 hours'),
    (v_agency_id, 'Elena Conti', 'elena.conti@email.it', '+393334567890',
     'qualified', 'warm', 'portal', 72, 58,
     350000, 410000, array['Navigli', 'Tortona'],
     array['Investitore', 'Cash buyer'],
     now() - interval '1 day'),
    (v_agency_id, 'Davide Romano', 'davide.romano@email.it', '+393339876543',
     'new', 'cold', 'website', 45, 28,
     280000, 320000, array['Lambrate', 'Città Studi'],
     array['Studente lavoratore'],
     now() - interval '3 days');

  raise notice 'Seeded 3 demo leads into agency %', v_agency_id;
end;
$$;
